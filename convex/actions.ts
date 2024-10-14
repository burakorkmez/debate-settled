import { action } from "./_generated/server";
import { v } from "convex/values";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 3 requests per 24 hours
const ratelimit = new Ratelimit({
	redis: redis,
	limiter: Ratelimit.slidingWindow(3, "24 h"),
});

export const checkRateLimit = action({
	args: { clientIp: v.string() },
	handler: async (ctx, { clientIp }) => {
		const identifier = `rateLimit:${clientIp}`;
		const result = await ratelimit.limit(identifier);

		return {
			isAllowed: result.success,
			currentRequests: 3 - result.remaining,
			maxRequests: 3,
			reset: result.reset,
		};
	},
});
