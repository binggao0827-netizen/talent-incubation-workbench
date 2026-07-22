import { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import * as db from "../db";
import { trendingItems, trendingSnapshots } from "../../drizzle/schema";
import { eq, and, desc, lte } from "drizzle-orm";
import { nanoid } from "nanoid";

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

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    if (data.code !== 0) {
      throw new Error(`API error: ${data.msg || data.code}`);
    }

    const items = data.data || [];
    return items;
  } catch (error) {
    console.error(`Failed to fetch trending data for ${platform}:`, error);
    throw error;
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

// 采集单个平台的热榜数据
async function collectPlatformTrending(platform: Platform): Promise<number> {
  try {
    const database = await db.getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    // 从 API 获取热榜数据
    const rawData = await fetchTrendingData(platform);

    // 解析并保存热榜数据
    const parsedItems = rawData.map((item, index) =>
      parseTrendingItem(item, platform, index)
    );

    // 删除该平台的旧数据（保留最近 7 天的数据）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await database
      .delete(trendingItems)
      .where(
        and(
          eq(trendingItems.platform, platform),
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
      platform,
      snapshotDate: new Date(today),
      data: JSON.stringify(parsedItems),
      createdAt: new Date(),
    });

    console.log(`Successfully collected ${parsedItems.length} trending items for ${platform}`);
    return parsedItems.length;
  } catch (error) {
    console.error(`Failed to collect trending data for ${platform}:`, error);
    throw error;
  }
}

// 定时任务处理器
export async function collectTrendingHandler(req: Request, res: Response) {
  try {
    // 验证请求来自定时任务系统
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    console.log(`Starting trending data collection for task ${user.taskUid}`);

    // 采集所有平台的数据
    const platforms: Platform[] = ["抖音", "微博", "快手", "B站"];
    const results: Record<Platform, number> = {
      "抖音": 0,
      "微博": 0,
      "快手": 0,
      "B站": 0,
    };

    for (const platform of platforms) {
      try {
        const count = await collectPlatformTrending(platform);
        results[platform] = count;
      } catch (error) {
        console.error(`Failed to collect ${platform}:`, error);
        // 继续采集其他平台，不中断整个任务
      }
    }

    const totalCount = Object.values(results).reduce((a, b) => a + b, 0);
    console.log(`Trending data collection completed. Total items: ${totalCount}`);

    res.json({
      ok: true,
      totalItems: totalCount,
      platforms: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trending collection handler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        url: req.url,
        taskUid: (await sdk.authenticateRequest(req).catch(() => null))?.taskUid,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
