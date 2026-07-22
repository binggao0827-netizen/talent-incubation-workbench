import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { nanoid } from "nanoid";
import { trendingItems, trendingSnapshots } from "../drizzle/schema";
import { eq, and, desc, lte, sql } from "drizzle-orm";

// 平台类型
type Platform = "抖音" | "微博" | "快手" | "B站";

// 热榜 API 端点配置
const TRENDING_APIS: Record<Platform, string> = {
  "抖音": "https://v2.xxapi.cn/api/douyinhot",
  "微博": "https://v2.xxapi.cn/api/weibohot",
  "快手": "https://v2.xxapi.cn/api/kuaishouhot",
  "B站": "https://v2.xxapi.cn/api/bilibilihot",
};

// 从 API 获取热榜数据
async function fetchTrendingData(platform: Platform): Promise<any[]> {
  try {
    const apiUrl = TRENDING_APIS[platform];
    if (!apiUrl) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    console.log(`Fetching trending data for ${platform} from ${apiUrl}`);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    // 根据不同平台处理数据格式
    if (data.code !== 0) {
      throw new Error(`API error: ${data.msg || data.code}`);
    }

    // 假设 API 返回的格式是 { code: 0, data: [...] }
    const items = data.data || [];
    console.log(`Got ${items.length} trending items for ${platform}`);

    return items;
  } catch (error) {
    console.error(`Failed to fetch trending data for ${platform}:`, error);
    throw error;
  }
}

// 解析 API 返回的数据为标准格式
// 根据 xxapi.cn 的实际返回格式调整
function parseTrendingItem(item: any, platform: Platform, rank: number): any {
  let title = "";
  let description = "";
  let hotValue = 0;
  let url = "";
  let imageUrl = "";
  let category = "";

  // 处理不同平台的字段名称差异
  if (item.title) title = item.title;
  if (item.name) title = item.name;
  if (item.keyword) title = item.keyword;

  if (item.desc) description = item.desc;
  if (item.description) description = item.description;

  if (item.hot) hotValue = parseInt(String(item.hot), 10) || 0;
  if (item.heatValue) hotValue = item.heatValue;
  if (item.heat) hotValue = item.heat;

  if (item.url) url = item.url;
  if (item.link) url = item.link;

  if (item.image) imageUrl = item.image;
  if (item.pic) imageUrl = item.pic;
  if (item.img) imageUrl = item.img;

  if (item.category) category = item.category;
  if (item.type) category = item.type;

  return {
    id: nanoid(36),
    platform,
    rank: rank + 1,
    title: title || "未知话题",
    description: description || "",
    hotValue: hotValue,
    url: url || "",
    imageUrl: imageUrl || "",
    category: category || "",
    collectedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export const trendingRouter = router({
  // 获取最新热榜数据
  getLatest: publicProcedure
    .input(z.object({
      platform: z.enum(["抖音", "微博", "快手", "B站"]),
      limit: z.number().min(1).max(100).optional().default(30),
    }))
    .query(async ({ input }) => {
      try {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // 获取最新的热榜数据
        const items = await database
          .select()
          .from(trendingItems)
          .where(eq(trendingItems.platform, input.platform))
          .orderBy(desc(trendingItems.collectedAt), desc(trendingItems.rank))
          .limit(input.limit);

        return items;
      } catch (error) {
        console.error("Failed to get trending items:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch trending data",
        });
      }
    }),

  // 获取所有平台的最新热榜
  getAllPlatforms: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).optional().default(20),
    }))
    .query(async ({ input }) => {
      try {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const platforms: Platform[] = ["抖音", "微博", "快手", "B站"];
        const result: Record<Platform, any[]> = {
          "抖音": [],
          "微博": [],
          "快手": [],
          "B站": [],
        };

        for (const platform of platforms) {
          const items = await database
            .select()
            .from(trendingItems)
            .where(eq(trendingItems.platform, platform))
            .orderBy(desc(trendingItems.collectedAt), desc(trendingItems.rank))
            .limit(input.limit);
          result[platform] = items;
        }

        return result;
      } catch (error) {
        console.error("Failed to get all trending items:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch trending data",
        });
      }
    }),

  // 采集热榜数据（管理员操作）
  collectTrending: protectedProcedure
    .input(z.object({
      platform: z.enum(["抖音", "微博", "快手", "B站"]),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ 
          code: "FORBIDDEN",
          message: "Only administrators can collect trending data"
        });
      }

      try {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // 从 API 获取热榜数据
        const rawData = await fetchTrendingData(input.platform);

        // 解析并保存热榜数据
        const parsedItems = rawData.map((item, index) =>
          parseTrendingItem(item, input.platform, index)
        );

        // 删除该平台的旧数据（保留最近 7 天的数据）
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        await database
          .delete(trendingItems)
          .where(
            and(
              eq(trendingItems.platform, input.platform),
              lte(trendingItems.collectedAt, sevenDaysAgo)
            )
          );

        // 批量插入新数据
        if (parsedItems.length > 0) {
          await database.insert(trendingItems).values(parsedItems);
        }

        // 保存快照
        const snapshotId = nanoid(36);
        const today = new Date().toISOString().split("T")[0];

        await database.insert(trendingSnapshots).values({
          id: snapshotId,
          platform: input.platform,
          snapshotDate: new Date(today),
          data: JSON.stringify(parsedItems),
          createdAt: new Date(),
        });

        return {
          success: true,
          platform: input.platform,
          count: parsedItems.length,
          message: `Successfully collected ${parsedItems.length} trending items for ${input.platform}`,
        };
      } catch (error) {
        console.error("Failed to collect trending data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to collect trending data",
        });
      }
    }),

  // 获取热榜历史快照
  getSnapshots: publicProcedure
    .input(z.object({
      platform: z.enum(["抖音", "微博", "快手", "B站"]),
      days: z.number().min(1).max(30).optional().default(7),
    }))
    .query(async ({ input }) => {
      try {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // 计算指定天数前的日期
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        const snapshots = await database
          .select()
          .from(trendingSnapshots)
          .where(
            and(
              eq(trendingSnapshots.platform, input.platform),
              lte(trendingSnapshots.snapshotDate, new Date())
            )
          )
          .orderBy(desc(trendingSnapshots.snapshotDate))
          .limit(input.days);

        return snapshots.map(snapshot => ({
          ...snapshot,
          data: JSON.parse(snapshot.data),
        }));
      } catch (error) {
        console.error("Failed to get trending snapshots:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch trending snapshots",
        });
      }
    }),

  // 搜索热榜
  search: publicProcedure
    .input(z.object({
      keyword: z.string().min(1),
      platform: z.enum(["抖音", "微博", "快手", "B站"]).optional(),
      limit: z.number().min(1).max(100).optional().default(30),
    }))
    .query(async ({ input }) => {
      try {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // 构建查询条件
        let query = database
          .select()
          .from(trendingItems)
          .where(
            input.platform
              ? and(
                  eq(trendingItems.platform, input.platform),
                  // 搜索标题和描述
                  // 注意：MySQL 的 LIKE 查询需要特殊处理
                )
              : undefined
          )
          .orderBy(desc(trendingItems.collectedAt))
          .limit(input.limit);

        // 由于 Drizzle ORM 的限制，这里使用简单的内存过滤
        // 实际生产环境应该使用数据库的全文搜索
        const items = await query;
        return items.filter(
          item =>
            item.title.includes(input.keyword) ||
            (item.description && item.description.includes(input.keyword))
        );
      } catch (error) {
        console.error("Failed to search trending items:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search trending data",
        });
      }
    }),
});
