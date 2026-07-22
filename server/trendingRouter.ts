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
    // API 返回 code: 200 表示成功，code: 0 也表示成功
    if (data.code !== 0 && data.code !== 200) {
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

/**
 * 验证和规范化图片 URL
 * - 处理相对 URL（添加 https 前缀）
 * - 验证 URL 格式
 * - 返回有效 URL 或空字符串
 */
function normalizeImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  
  url = url.trim();
  if (!url) return "";
  
  try {
    // 如果是相对 URL，添加 https 前缀
    if (url.startsWith("//")) {
      url = "https:" + url;
    }
    // 检查是否是有效的 HTTP(S) URL
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return "";
    }
    // 验证 URL 格式
    new URL(url);
    return url;
  } catch {
    return "";
  }
}

// 解析 API 返回的数据为标准格式
function parseTrendingItem(item: any, platform: Platform, rank: number): any {
  let title = "";
  let description = "";
  let hotValue = 0;
  let url = "";
  let imageUrl = "";
  let category = "";

  // 抖音 API 特定字段
  if (platform === "抖音") {
    title = item.word || item.title || "";
    description = item.word || "";
    hotValue = item.hot_value || 0;
    // 从 word_cover 获取图片並规范化
    if (item.word_cover && item.word_cover.url_list && item.word_cover.url_list.length > 0) {
      imageUrl = normalizeImageUrl(item.word_cover.url_list[0]);
    }
    // 根据 sentence_tag 判断分类
    const tagMap: Record<number, string> = {
      6000: "生活",
      9000: "美食",
      3001: "交通",
      2005: "音乐",
      2001: "游戏",
      12000: "游戏",
      13000: "娱乐",
    };
    category = tagMap[item.sentence_tag] || "综合";
  } else {
    // 处理其他平台的字段名称差异
    if (item.title) title = item.title;
    if (item.name) title = item.name;
    if (item.keyword) title = item.keyword;
    if (item.word) title = item.word;

    if (item.desc) description = item.desc;
    if (item.description) description = item.description;

    if (item.hot) hotValue = parseInt(String(item.hot), 10) || 0;
    if (item.hot_value) hotValue = item.hot_value;
    if (item.heatValue) hotValue = item.heatValue;
    if (item.heat) hotValue = item.heat;

    if (item.url) url = item.url;
    if (item.link) url = item.link;

    // 规范化图片 URL
    if (!imageUrl) imageUrl = normalizeImageUrl(item.image);
    if (!imageUrl) imageUrl = normalizeImageUrl(item.pic);
    if (!imageUrl) imageUrl = normalizeImageUrl(item.img);

    if (item.category) category = item.category;
    if (item.type) category = item.type;
  }

  return {
    id: nanoid(36),
    platform,
    rank: rank + 1,
    title: title || "未知话题",
    description: description || "",
    hotValue: hotValue,
    url: url || "",
    imageUrl: imageUrl || "",
    category: category || "综合",
    collectedAt: new Date(),
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

        // 从 API 获取数据
        const apiData = await fetchTrendingData(input.platform);

        // 解析并保存数据
        const itemsToInsert = apiData.slice(0, 50).map((item: any, index: number) => 
          parseTrendingItem(item, input.platform, index)
        );

        if (itemsToInsert.length === 0) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No data received from API",
          });
        }

        // 删除旧数据（保留最近 7 天的数据）
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        await database
          .delete(trendingItems)
          .where(
            and(
              eq(trendingItems.platform, input.platform),
              lte(trendingItems.collectedAt, sevenDaysAgo)
            )
          );

        // 插入新数据
        await database.insert(trendingItems).values(itemsToInsert);

        return {
          success: true,
          message: `Successfully collected ${itemsToInsert.length} trending items for ${input.platform}`,
          count: itemsToInsert.length,
        };
      } catch (error) {
        console.error("Failed to collect trending data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to collect trending data",
        });
      }
    }),

  // 获取热榜统计信息
  getStats: publicProcedure.query(async () => {
    try {
      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const platforms: Platform[] = ["抖音", "微博", "快手", "B站"];
      const stats: Record<Platform, number> = {
        "抖音": 0,
        "微博": 0,
        "快手": 0,
        "B站": 0,
      };

      for (const platform of platforms) {
        const result = await database
          .select({ count: sql<number>`count(*)` })
          .from(trendingItems)
          .where(eq(trendingItems.platform, platform));
        
        stats[platform] = result[0]?.count || 0;
      }

      return stats;
    } catch (error) {
      console.error("Failed to get trending stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch trending stats",
      });
    }
  }),
});
