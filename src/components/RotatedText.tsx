import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface RotatedTextProps {
	children: ReactNode;
	className?: string;
	textColor?: string;
	bgColor?: string;
	tiltDirection?: "left" | "right";
}

const RotatedText = ({
	children,
	className,
	textColor = "text-white",
	bgColor = "bg-sky-500",
	tiltDirection = "left",
}: RotatedTextProps) => {
	const tiltClass = tiltDirection === "left" ? "-rotate-1" : "rotate-1";

	return (
		<span className='relative whitespace-nowrap'>
			<span
				className={cn(
					"absolute -left-2 -top-1 -bottom-1 -right-2 md:-left-3 md:-top-0 md:-bottom-0 md:-right-3 mx-2",
					bgColor,
					tiltClass,
					className
				)}
				aria-hidden='true'
			/>
			<span className={cn("relative uppercase font-bold", textColor)}>{children}</span>
		</span>
	);
};

export default RotatedText;
