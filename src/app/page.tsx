"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { usePaginatedQuery, useMutation, useAction, useQuery } from "convex/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { Info, MessageSquare, Star, Youtube } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import RotatedText from "@/components/RotatedText";

type Message = {
	_id: Id<"messages">;
	_creationTime: number;
	text: string;
	sender: string;
	side: "prisma" | "drizzle";
	createdAt: number;
};

function LoadingSkeleton() {
	return (
		<div className='space-y-4'>
			{[...Array(5)].map((_, i) => (
				<div key={i} className='flex items-start space-x-4'>
					<Skeleton className='h-10 w-10 rounded-full' />
					<div className='space-y-2 flex-1'>
						<Skeleton className='h-4 w-[100px]' />
						<Skeleton className='h-4 w-full' />
					</div>
				</div>
			))}
		</div>
	);
}

export default function ORMChat() {
	const [clientIp, setClientIp] = useState("");
	const supporterCount = useQuery(api.messages.getSupporterCount);

	const [newMessagePrisma, setNewMessagePrisma] = useState("");
	const [newMessageDrizzle, setNewMessageDrizzle] = useState("");

	const [optimisticMessagesPrisma, setOptimisticMessagesPrisma] = useState<Message[]>([]);
	const [optimisticMessagesDrizzle, setOptimisticMessagesDrizzle] = useState<Message[]>([]);

	const {
		results: serverMessagesPrisma,
		status: statusPrisma,
		loadMore: loadMorePrisma,
	} = usePaginatedQuery(api.messages.list, { side: "prisma" }, { initialNumItems: 20 });

	const {
		results: serverMessagesDrizzle,
		status: statusDrizzle,
		loadMore: loadMoreDrizzle,
	} = usePaginatedQuery(api.messages.list, { side: "drizzle" }, { initialNumItems: 20 });

	const sendMessage = useMutation(api.messages.send);
	const checkRateLimit = useAction(api.actions.checkRateLimit);

	const isLoadingPrisma = statusPrisma === "LoadingFirstPage";
	const isLoadingDrizzle = statusDrizzle === "LoadingFirstPage";

	useEffect(() => {
		fetch("https://api.ipify.org?format=json")
			.then((response) => response.json())
			.then((data) => setClientIp(data.ip));
	}, []);

	const handleSendMessage = async (side: "prisma" | "drizzle") => {
		const messageText = side === "prisma" ? newMessagePrisma : newMessageDrizzle;
		if (messageText.trim()) {
			const tempId = `temp-${Date.now()}`;
			const optimisticMessage: Message = {
				_id: tempId as Id<"messages">,
				_creationTime: Date.now(),
				text: messageText,
				sender: "Enjoyer",
				side,
				createdAt: Date.now(),
			};

			const setOptimisticMessages =
				side === "prisma" ? setOptimisticMessagesPrisma : setOptimisticMessagesDrizzle;
			setOptimisticMessages((prev) => [...prev, optimisticMessage]);

			if (side === "prisma") {
				setNewMessagePrisma("");
			} else {
				setNewMessageDrizzle("");
			}

			try {
				const rateLimitResult = await checkRateLimit({ clientIp });
				if (!rateLimitResult.isAllowed) {
					const resetTime = new Date(Date.now() + rateLimitResult.reset);
					throw new Error(
						`Rate limit exceeded. You've sent ${rateLimitResult.currentRequests} messages. 
            Limit resets tomorrow at ${resetTime.toLocaleTimeString()}.`
					);
				}

				const serverMessageId = await sendMessage({ text: messageText, sender: "Enjoyer", side });

				setOptimisticMessages((prev) =>
					prev.map((m) =>
						m._id === tempId
							? { ...m, _id: serverMessageId as Id<"messages">, _creationTime: Date.now() }
							: m
					)
				);
			} catch (error) {
				setOptimisticMessages((prev) => prev.filter((m) => m._id !== tempId));
				if (error instanceof Error) {
					toast.error(error.message);
				} else {
					toast.error("Failed to send message. Please try again.");
				}
			}
		}
	};
	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

	// combine server messages with optimistic messages for each side
	const allMessagesPrisma = useMemo(() => {
		const combined = [...(serverMessagesPrisma || []), ...optimisticMessagesPrisma];
		return combined
			.filter((message, index, self) => index === self.findIndex((t) => t._id === message._id))
			.sort((a, b) => a._creationTime - b._creationTime);
	}, [serverMessagesPrisma, optimisticMessagesPrisma]);

	const allMessagesDrizzle = useMemo(() => {
		const combined = [...(serverMessagesDrizzle || []), ...optimisticMessagesDrizzle];
		return combined
			.filter((message, index, self) => index === self.findIndex((t) => t._id === message._id))
			.sort((a, b) => a._creationTime - b._creationTime);
	}, [serverMessagesDrizzle, optimisticMessagesDrizzle]);

	return (
		<div className='flex flex-col h-screen'>
			<div className='absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]'></div>
			<div className='p-4 text-center'>
				<h1 className='font-bold'>
					<span className='block font-extrabold uppercase'>Let&apos;s settle the debate</span>
					<span className='text-5xl block my-2 '>
						<RotatedText className='bg-gradient-to-br from-[#5A67D8] via-[#7A77D8] to-[#DD3CBE]'>
							Prisma
						</RotatedText>
						{" vs "}
						<RotatedText
							className='bg-gradient-to-tl from-[#DD3CBE] via-[#AD52CB] to-[#5A67D8]'
							tiltDirection='right'
						>
							DRIZZLE
						</RotatedText>
					</span>
					<span className='block text-sm text-muted-foreground'>
						built by
						<a
							href='https://github.com/burakorkmez'
							target='_blank'
							rel='noopener noreferrer'
							className='mx-1 underline hover:text-gray-700 transition-colors duration-200'
						>
							burak
						</a>
					</span>
				</h1>
				<div className='mt-4 absolute top-4 right-4 flex items-center space-x-2'>
					<Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
						<DialogTrigger asChild>
							<Button
								variant='outline'
								size='icon'
								className='rounded-full'
								onClick={() => setIsInfoDialogOpen(true)}
							>
								<Info className='h-4 w-4' />
								<span className='sr-only'>Info</span>
							</Button>
						</DialogTrigger>
						<DialogContent className='sm:max-w-[425px]'>
							<DialogHeader>
								<DialogTitle>Powered by 👇</DialogTitle>
							</DialogHeader>
							<div className='grid gap-4 py-4'>
								<div className='flex justify-around items-center'>
									<Link href={"https://nextjs.org"} className='text-center' target='_blank'>
										<Image src='/nextjs.png' alt='Next.js' width={50} height={50} />
										<p className='mt-2 font-bold'>Next.js</p>
									</Link>

									<Link href={"https://upstash.com"} className='text-center' target='_blank'>
										<Image src='/upstash.png' alt='Upstash' width={50} height={50} />
										<p className='mt-2 font-bold'>Upstash</p>
									</Link>
									<Link href={"https://convex.dev"} className='text-center' target='_blank'>
										<Image src='/convex.png' alt='Convex' width={50} height={50} />
										<p className='mt-2 font-bold'>Convex</p>
									</Link>
								</div>
								<div className='flex items-center space-x-2'>
									<MessageSquare className='size-4 text-gray-500' />
									<p>You have 3 messages per day, use it </p>
									<RotatedText>wisely</RotatedText>
								</div>
								<div className='flex items-center space-x-2'>
									<Youtube className='h-5 w-5 text-gray-500' />
									<p>
										hey!{" "}
										<a
											href='https://youtube.com/@asaprogrammer_'
											target='_blank'
											className='text-muted-foreground underline underline-offset-2 decoration-wavy'
										>
											subscribe
										</a>{" "}
										:)
									</p>
								</div>
							</div>
						</DialogContent>
					</Dialog>
					<Link
						href='https://github.com/burakorkmez/debate-settled'
						target='_blank'
						rel='noopener noreferrer'
						className={cn(
							"bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-200",
							buttonVariants({ size: "sm" })
						)}
					>
						<Star className='w-4 h-4 mr-2' />
						Star on GitHub
					</Link>
				</div>
			</div>
			<div className='flex-1 flex flex-col sm:flex-row'>
				<ChatPanel
					title='Prisma'
					logo='/prisma.jpg'
					color='prisma'
					messages={allMessagesPrisma}
					newMessage={newMessagePrisma}
					onNewMessageChange={setNewMessagePrisma}
					onSendMessage={() => handleSendMessage("prisma")}
					onLoadMore={() => loadMorePrisma(20)}
					hasMore={statusPrisma === "CanLoadMore"}
					supporterCount={supporterCount?.prisma || 0}
					isLoading={isLoadingPrisma}
				/>
				<div className='w-px bg-gray-200 mx-2' />
				<ChatPanel
					title='Drizzle'
					logo='/drizzle.jpg'
					color='drizzle'
					messages={allMessagesDrizzle}
					newMessage={newMessageDrizzle}
					onNewMessageChange={setNewMessageDrizzle}
					onSendMessage={() => handleSendMessage("drizzle")}
					onLoadMore={() => loadMoreDrizzle(20)}
					hasMore={statusDrizzle === "CanLoadMore"}
					supporterCount={supporterCount?.drizzle || 0}
					isLoading={isLoadingDrizzle}
				/>
			</div>
		</div>
	);
}

function ChatPanel({
	title,
	logo,
	color,
	messages,
	newMessage,
	onNewMessageChange,
	onSendMessage,
	onLoadMore,
	hasMore,
	supporterCount,
	isLoading,
}: {
	title: string;
	logo: string;
	color: "prisma" | "drizzle";
	messages: Message[];
	newMessage: string;
	onNewMessageChange: (value: string) => void;
	onSendMessage: () => void;
	onLoadMore: () => void;
	hasMore: boolean;
	supporterCount: number;
	isLoading: boolean;
}) {
	const themeColor = color === "prisma" ? "#5A67D8" : "#E63CB6";
	const lightThemeColor = color === "prisma" ? "#EEF0FF" : "#FFF0FA";
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		}
	}, [messages]);

	return (
		<div
			className='flex-1 p-4 bg-white/65 rounded-lg shadow-sm m-2 flex flex-col mb-10'
			style={{ borderColor: themeColor, borderWidth: "1px" }}
		>
			<div className='flex items-center justify-between mb-4'>
				<div className='flex items-center gap-3'>
					<img src={logo} alt={`${title} logo`} className='h-10 object-cover rounded-full' />
					<h2 className='text-xl font-semibold' style={{ color: themeColor }}>
						{title} Supporters
					</h2>
				</div>
				<div className='text-sm font-bold' style={{ color: themeColor }}>
					{supporterCount} {title} enjoyer{supporterCount !== 1 ? "s" : ""}
				</div>
			</div>
			{hasMore && (
				<Button
					onClick={onLoadMore}
					variant='outline'
					className='w-full mb-4'
					style={{ borderColor: themeColor, color: themeColor }}
				>
					Load More
				</Button>
			)}
			<ScrollArea className='flex-grow mb-4' ref={scrollAreaRef}>
				{isLoading ? (
					<LoadingSkeleton />
				) : (
					messages.map((message, idx) => {
						const isBoy = idx % 2 === 0;
						const gender = isBoy ? "boy" : "girl";
						return (
							<div key={message._id} className='mb-4 flex items-start gap-3'>
								<Avatar>
									<AvatarImage
										src={`https://avatar.iran.liara.run/public/${gender}?username=${message._id}`}
									/>
									<AvatarFallback>{message.sender[0]}</AvatarFallback>
								</Avatar>
								<div className='rounded-lg p-3 flex-1' style={{ backgroundColor: lightThemeColor }}>
									<p className='font-semibold text-sm' style={{ color: themeColor }}>
										{message.sender}
									</p>
									<p className='text-gray-700'>{message.text}</p>
								</div>
							</div>
						);
					})
				)}
			</ScrollArea>
			<div className='flex items-center gap-2'>
				<Input
					placeholder={`I support ${title} because...`}
					value={newMessage}
					onChange={(e) => onNewMessageChange(e.target.value)}
					onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
					className='flex-1'
					style={{ borderColor: themeColor }}
				/>
				<Button onClick={onSendMessage} className='text-white' style={{ backgroundColor: themeColor }}>
					Send
				</Button>
			</div>
		</div>
	);
}
