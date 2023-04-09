import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TRPCError } from "@trpc/server";

// Create a new ratelimiter, that allows 3 requests per 60 seconds
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "60 s"),
    analytics: true,
    /**
     * Optional prefix for the keys used in redis. This is useful if you want to share a redis
     * instance with other applications and want to avoid key collisions. The default prefix is
     * "@upstash/ratelimit"
     */
    prefix: "@upstash/ratelimit",
});

export const postsRouter = createTRPCRouter({
    getAll: publicProcedure.query(async ({ ctx }) => {
        const Posts = await ctx.prisma.post.findMany({
            orderBy: {
                createdAt: "desc",
            }
        });
        const users = (await clerkClient.users.getUserList(
          {
              userId: Posts.map((post) => post.authorId),
          }
        )).map((user) => {
            return {
                id: user.id,
                username: user.username,
                profileImageUrl: user.profileImageUrl
            }
        });
        return Posts.map((post) => {
            return {
                ...post,
                author: users.find((user) => user.id === post.authorId),
            }
        });
    }),
    create: protectedProcedure.input(z.object({
        content: z.string().emoji().min(1).max(255),
    })).mutation(async ({ input, ctx }) => {
        const key = `posts:${ctx.userId}`;
        const { success } = await ratelimit.limit(key);
        if (!success) {
            throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
            });
        }
        return await ctx.prisma.post.create({
            data: {
                content: input.content,
                authorId: ctx.userId,
            },
        });
    }),
});
