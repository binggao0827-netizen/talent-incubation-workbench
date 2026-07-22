import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import * as ai from "./ai";
import { feishuRouter } from "./feishuRouter";
import { trendingRouter } from "./trendingRouter";

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

  // ========== Creators Router ==========
  creators: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getCreators(input);
      }),

    getById: protectedProcedure
      .input(z.string())
      .query(async ({ input }) => {
        const creator = await db.getCreatorById(input);
        if (!creator) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        // Get all accounts for this creator
        const accounts = await db.getAccounts({ creatorId: input });
        return { ...creator, accounts };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        avatar: z.string().optional(),
        assignedEditor: z.string().optional(),
        status: z.enum(["孵化中", "成熟", "暂停"]).default("孵化中"),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.createCreator(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          avatar: z.string().optional(),
          assignedEditor: z.string().optional(),
          status: z.enum(["孵化中", "成熟", "暂停"]).optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateCreator(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.string())
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.deleteCreator(input);
        return { success: true };
      }),
  }),

  // ========== Accounts Router ==========
  accounts: router({
    list: protectedProcedure
      .input(z.object({
        creatorId: z.string().optional(),
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
        const contentTypes = await db.getAccountContentTypes(input);
        return { ...account, contentTypes };
      }),

    create: protectedProcedure
      .input(z.object({
        creatorId: z.string(),
        platform: z.enum(["抖音", "小红书", "B站", "视频号"]),
        accountName: z.string(),
        homepageUrl: z.string().optional(),
        followerCount: z.number().optional(),
        status: z.enum(["孵化中", "成熟", "暂停"]).default("孵化中"),
        contentTypeIds: z.string().array().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { contentTypeIds, ...accountData } = input;
        const accountId = await db.createAccount(accountData);
        
        // Add content types if provided
        if (contentTypeIds && contentTypeIds.length > 0) {
          for (const typeId of contentTypeIds) {
            await db.addContentTypeToAccount(accountId, typeId);
          }
        }
        
        return accountId;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          accountName: z.string().optional(),
          homepageUrl: z.string().optional(),
          followerCount: z.number().optional(),
          status: z.enum(["孵化中", "成熟", "暂停"]).optional(),
          contentTypeIds: z.string().array().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { contentTypeIds, ...updateData } = input.data;
        await db.updateAccount(input.id, updateData);
        
        // Update content types if provided
        if (contentTypeIds) {
          // Clear existing content types
          const existing = await db.getAccountContentTypes(input.id);
          for (const type of existing) {
            await db.removeContentTypeFromAccount(input.id, type.id);
          }
          // Add new ones
          for (const typeId of contentTypeIds) {
            await db.addContentTypeToAccount(input.id, typeId);
          }
        }
        
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

  // ========== Content Types Router ==========
  contentTypes: router({
    list: protectedProcedure
      .query(async () => {
        return db.getContentTypes();
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        color: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.createContentType(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          color: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateContentType(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.string())
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.deleteContentType(input);
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

  // ========== Feishu Router ==========
  feishu: feishuRouter,

  // ========== Trending Router ==========
  trending: trendingRouter,

  // ========== AI Router ==========
  ai: router({
    generateWeeklyReport: protectedProcedure
      .input(z.object({
        weekStart: z.date(),
        weekEnd: z.date(),
      }))
      .mutation(async ({ input }) => {
        try {
          const report = await ai.generateWeeklyReport(input.weekStart, input.weekEnd);
          return { success: true, report };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate weekly report",
          });
        }
      }),

    analyzeTopScripts: protectedProcedure.mutation(async () => {
      try {
        const analysis = await ai.analyzeTopScriptPatterns();
        return { success: true, analysis };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze script patterns",
        });
      }
    }),

    generateTopicIdeas: protectedProcedure
      .input(z.object({
        accountId: z.string().optional(),
        hotTopics: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const ideas = await ai.generateTopicIdeas(input.accountId, input.hotTopics);
          return { success: true, ideas };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate topic ideas",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
