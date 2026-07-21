import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// Helper to check if user is admin
function isAdmin(userRole?: string): boolean {
  return userRole === "admin";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ========== Accounts Router ==========
  accounts: router({
    list: protectedProcedure
      .input(z.object({
        platform: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getAccounts(input);
      }),

    getById: protectedProcedure
      .input(z.string())
      .query(async ({ input }) => {
        const account = await db.getAccountById(input);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return account;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        platform: z.enum(["抖音", "小红书", "B站", "视频号"]),
        accountUrl: z.string().optional(),
        category: z.enum(["美妆", "游戏", "剧情", "测评", "教程", "种草", "生活", "其他"]),
        followerCount: z.number().optional(),
        status: z.enum(["孵化中", "成熟", "暂停"]).optional(),
        assignedEditor: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Only admin can create accounts
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.createAccount(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          platform: z.enum(["抖音", "小红书", "B站", "视频号"]).optional(),
          accountUrl: z.string().optional(),
          category: z.enum(["美妆", "游戏", "剧情", "测评", "教程", "种草", "生活", "其他"]).optional(),
          followerCount: z.number().optional(),
          status: z.enum(["孵化中", "成熟", "暂停"]).optional(),
          assignedEditor: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateAccount(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.string())
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.deleteAccount(input);
        return { success: true };
      }),
  }),

  // ========== Scripts Router ==========
  scripts: router({
    list: protectedProcedure
      .input(z.object({
        accountId: z.string().optional(),
        topicTag: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getScripts(input);
      }),

    getById: protectedProcedure
      .input(z.string())
      .query(async ({ input }) => {
        const script = await db.getScriptById(input);
        if (!script) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return script;
      }),

    create: protectedProcedure
      .input(z.object({
        accountId: z.string(),
        title: z.string(),
        topicTag: z.enum(["剧情", "测评", "教程", "种草", "搞笑", "知识", "其他"]),
        hookType: z.enum(["提问式", "悬念式", "痛点式", "反转式", "数据式", "其他"]),
        content: z.string(),
        ending: z.string().optional(),
        publishDate: z.date().optional(),
        videoUrl: z.string().optional(),
        creator: z.string().optional(),
        status: z.enum(["草稿", "审核", "发布", "归档"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Editor can create scripts
        if (!ctx.user?.role) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.createScript(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          title: z.string().optional(),
          topicTag: z.enum(["剧情", "测评", "教程", "种草", "搞笑", "知识", "其他"]).optional(),
          hookType: z.enum(["提问式", "悬念式", "痛点式", "反转式", "数据式", "其他"]).optional(),
          content: z.string().optional(),
          ending: z.string().optional(),
          publishDate: z.date().optional(),
          videoUrl: z.string().optional(),
          creator: z.string().optional(),
          status: z.enum(["草稿", "审核", "发布", "归档"]).optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.role) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateScript(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.string())
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.deleteScript(input);
        return { success: true };
      }),
  }),

  // ========== Metrics Router ==========
  metrics: router({
    getByScriptId: protectedProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return db.getMetricsByScriptId(input);
      }),

    create: protectedProcedure
      .input(z.object({
        scriptId: z.string(),
        views: z.number().optional(),
        likes: z.number().optional(),
        comments: z.number().optional(),
        shares: z.number().optional(),
        newFollowers: z.number().optional(),
        completionRate: z.string().optional(),
        recordDate: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.role) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.createMetric(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          views: z.number().optional(),
          likes: z.number().optional(),
          comments: z.number().optional(),
          shares: z.number().optional(),
          newFollowers: z.number().optional(),
          completionRate: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.role) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateMetric(input.id, input.data);
        return { success: true };
      }),
  }),

  // ========== Reviews Router ==========
  reviews: router({
    list: protectedProcedure
      .input(z.object({
        week: z.string().optional(),
        accountId: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getReviews(input);
      }),

    getById: protectedProcedure
      .input(z.string())
      .query(async ({ input }) => {
        const review = await db.getReviewById(input);
        if (!review) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return review;
      }),

    create: protectedProcedure
      .input(z.object({
        week: z.string(),
        accountId: z.string().optional(),
        content: z.string(),
        highlights: z.string().optional(),
        pitfalls: z.string().optional(),
        nextWeekPlan: z.string().optional(),
        aiGenerated: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.role) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.createReview(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          content: z.string().optional(),
          highlights: z.string().optional(),
          pitfalls: z.string().optional(),
          nextWeekPlan: z.string().optional(),
          aiGenerated: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.role) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateReview(input.id, input.data);
        return { success: true };
      }),
  }),

  // ========== Dashboard Router ==========
  dashboard: router({
    getStats: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const accounts = await db.getAccounts();
        const scripts = await db.getScripts({
          startDate: input.startDate,
          endDate: input.endDate,
        });

        const metrics = await db.getMetricsForPeriod(input.startDate, input.endDate);

        let totalNewFollowers = 0;
        let totalViews = 0;

        metrics.forEach(m => {
          totalNewFollowers += m.newFollowers || 0;
          totalViews += m.views || 0;
        });

        return {
          totalAccounts: accounts.length,
          newScriptsCount: scripts.length,
          totalNewFollowers,
          totalViews,
        };
      }),

    getTopScripts: protectedProcedure
      .input(z.object({
        metric: z.enum(["views", "likes", "newFollowers"]),
        limit: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getTopScriptsByMetric(input.metric, input.limit || 5);
      }),
  }),

  // ========== Hot Topics Router ==========
  hotTopics: router({
    list: protectedProcedure
      .input(z.object({
        platform: z.string().optional(),
        category: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getHotTopics(input);
      }),

    create: protectedProcedure
      .input(z.object({
        platform: z.enum(["抖音", "小红书", "B站", "视频号"]),
        keyword: z.string(),
        category: z.string().optional(),
        heatScore: z.string().optional(),
        source: z.string().optional(),
        aiAnalysis: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.createHotTopic(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
