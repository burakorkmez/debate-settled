// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	messages: defineTable({
		text: v.string(),
		sender: v.string(),
		side: v.union(v.literal("prisma"), v.literal("drizzle")),
		createdAt: v.number(),
	}).index("by_createdAt", ["createdAt"]),
});
