import { getDb } from "./db";
import { trendingItems } from "../drizzle/schema";
import { nanoid } from "nanoid";

type Platform = "抖音" | "微博" | "快手" | "B站";

const TRENDING_APIS: Record<Platform, string> = {
  "抖音": "https://v2.xxapi.cn/api/douyinhot",
  "微博": "https://v2.xxapi.cn/api/weibohot",
  "快手": "https://v2.xxapi.cn/api/kuaishouhot",
  "B站": "https://v2.xxapi.cn/api/bilibilihot",
};

async function fetchTrendingData(platform: Platform): Promise<any[]> {
  try {
    const apiUrl = TRENDING_APIS[platform];
    console.log(`Fetching ${platform} from ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json() as any;
    
    if (data.code !== 0 && data.code !== 200) {
      throw new Error(`API error: ${data.msg || data.code}`);
    }

    const items = data.data || [];
    console.log(`✅ Got ${items.length} items for ${platform}`);
    return items;
  } catch (error) {
    console.error(`❌ Failed to fetch ${platform}:`, error);
    return [];
  }
}

function parseHotValue(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // 处理 "250万" 格式
    const match = value.match(/(\d+(?:\.\d+)?)\s*(万|千|百)?/);
    if (match) {
      let num = parseFloat(match[1]);
      if (match[2] === '万') num *= 10000;
      else if (match[2] === '千') num *= 1000;
      else if (match[2] === '百') num *= 100;
      return Math.floor(num);
    }
  }
  return 0;
}

function parseTrendingItem(item: any, platform: Platform, rank: number): any {
  let title = "";
  let description = "";
  let hotValue = 0;
  let url = "";
  let imageUrl = "";
  let category = "";

  if (platform === "抖音") {
    title = item.word || item.title || "";
    description = item.word || "";
    hotValue = parseHotValue(item.hot_value || 0);
    
    // 获取图片 URL
    if (item.word_cover && item.word_cover.url_list && item.word_cover.url_list.length > 0) {
      imageUrl = item.word_cover.url_list[0];
    }
    
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
  } else if (platform === "微博") {
    title = item.word || item.title || "";
    description = item.word || "";
    hotValue = parseHotValue(item.hot || 0);
    
    if (item.pic) imageUrl = item.pic;
    if (item.image) imageUrl = item.image;
    
    category = item.category || "综合";
  } else if (platform === "B站") {
    title = item.title || item.word || "";
    description = item.title || "";
    hotValue = parseHotValue(item.hot || 0);
    
    if (item.pic) imageUrl = item.pic;
    if (item.image) imageUrl = item.image;
    
    category = item.category || "综合";
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

async function main() {
  try {
    const database = await getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    const platforms: Platform[] = ["抖音", "微博", "B站"];
    
    for (const platform of platforms) {
      console.log(`\n📊 Collecting ${platform} trending data...`);
      
      const items = await fetchTrendingData(platform);
      
      if (items.length === 0) {
        console.log(`⚠️  No data for ${platform}`);
        continue;
      }

      // 解析并保存数据
      const parsedItems = items.slice(0, 30).map((item, index) => 
        parseTrendingItem(item, platform, index)
      );

      await database.insert(trendingItems).values(parsedItems);
      console.log(`✅ Saved ${parsedItems.length} items for ${platform}`);
    }

    console.log("\n✅ All trending data collected successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
