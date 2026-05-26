import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// allow 5 requests per minute
const rateLimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"),

})

// rate limiter helper function
export const checkRateLimit = (identifier: string) => {
    return rateLimit.limit(identifier);
}