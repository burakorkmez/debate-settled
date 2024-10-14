import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const list = query({
	args: {
		paginationOpts: paginationOptsValidator,
		side: v.union(v.literal("prisma"), v.literal("drizzle")),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messages")
			.filter((q) => q.eq(q.field("side"), args.side))
			.order("desc")
			.paginate(args.paginationOpts);
	},
});

export const send = mutation({
	args: {
		text: v.string(),
		sender: v.string(),
		side: v.union(v.literal("prisma"), v.literal("drizzle")),
	},
	handler: async (ctx, { text, sender, side }) => {
		const messageId = await ctx.db.insert("messages", { text, sender, side, createdAt: Date.now() });
		return messageId;
	},
});

export const getSupporterCount = query({
	handler: async (ctx) => {
		const prismaCount = await ctx.db
			.query("messages")
			.filter((q) => q.eq(q.field("side"), "prisma"))
			.collect();

		const drizzleCount = await ctx.db
			.query("messages")
			.filter((q) => q.eq(q.field("side"), "drizzle"))
			.collect();

		return {
			prisma: prismaCount.length,
			drizzle: drizzleCount.length,
		};
	},
});
