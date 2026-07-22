import * as db from "./db";
import { trendingItems } from "../drizzle/schema";
import { nanoid } from "nanoid";

// 模拟热榜数据
const mockTrendingData = {
  "抖音": [
    { title: "2024年最火的短视频创意", heat: 2850000, category: "创意", link: "https://douyin.com/1" },
    { title: "如何通过短视频赚钱", heat: 2650000, category: "教程", link: "https://douyin.com/2" },
    { title: "明星同款穿搭分享", heat: 2450000, category: "时尚", link: "https://douyin.com/3" },
    { title: "美食制作秘诀大公开", heat: 2250000, category: "美食", link: "https://douyin.com/4" },
    { title: "健身房打卡挑战", heat: 2050000, category: "健身", link: "https://douyin.com/5" },
    { title: "宠物搞笑视频合集", heat: 1950000, category: "宠物", link: "https://douyin.com/6" },
    { title: "旅游vlog拍摄技巧", heat: 1850000, category: "旅游", link: "https://douyin.com/7" },
    { title: "化妆教程新手入门", heat: 1750000, category: "美妆", link: "https://douyin.com/8" },
    { title: "游戏直播精彩时刻", heat: 1650000, category: "游戏", link: "https://douyin.com/9" },
    { title: "音乐翻唱大赛", heat: 1550000, category: "音乐", link: "https://douyin.com/10" },
  ],
  "微博": [
    { title: "热点话题讨论", heat: 5200000, category: "社会", link: "https://weibo.com/1" },
    { title: "明星八卦新闻", heat: 4800000, category: "娱乐", link: "https://weibo.com/2" },
    { title: "体育赛事直播", heat: 4500000, category: "体育", link: "https://weibo.com/3" },
    { title: "科技产品评测", heat: 4200000, category: "科技", link: "https://weibo.com/4" },
    { title: "电影上映预告", heat: 3900000, category: "电影", link: "https://weibo.com/5" },
    { title: "政策解读分析", heat: 3600000, category: "政治", link: "https://weibo.com/6" },
    { title: "经济财经新闻", heat: 3300000, category: "财经", link: "https://weibo.com/7" },
    { title: "教育改革讨论", heat: 3000000, category: "教育", link: "https://weibo.com/8" },
    { title: "环保话题倡议", heat: 2700000, category: "环保", link: "https://weibo.com/9" },
    { title: "健康养生知识", heat: 2400000, category: "健康", link: "https://weibo.com/10" },
  ],
  "快手": [
    { title: "乡村生活日常", heat: 1850000, category: "生活", link: "https://kuaishou.com/1" },
    { title: "手工制作教程", heat: 1650000, category: "手工", link: "https://kuaishou.com/2" },
    { title: "农业种植技巧", heat: 1450000, category: "农业", link: "https://kuaishou.com/3" },
    { title: "小吃美食制作", heat: 1250000, category: "美食", link: "https://kuaishou.com/4" },
    { title: "家居装修设计", heat: 1050000, category: "装修", link: "https://kuaishou.com/5" },
    { title: "儿童教育内容", heat: 950000, category: "教育", link: "https://kuaishou.com/6" },
    { title: "宠物养护知识", heat: 850000, category: "宠物", link: "https://kuaishou.com/7" },
    { title: "汽车维修保养", heat: 750000, category: "汽车", link: "https://kuaishou.com/8" },
    { title: "运动健身分享", heat: 650000, category: "健身", link: "https://kuaishou.com/9" },
    { title: "旅游景点推荐", heat: 550000, category: "旅游", link: "https://kuaishou.com/10" },
  ],
  "B站": [
    { title: "动画新番推荐", heat: 3200000, category: "动画", link: "https://bilibili.com/1" },
    { title: "游戏攻略讲解", heat: 2900000, category: "游戏", link: "https://bilibili.com/2" },
    { title: "编程技术教学", heat: 2600000, category: "技术", link: "https://bilibili.com/3" },
    { title: "音乐创作分享", heat: 2300000, category: "音乐", link: "https://bilibili.com/4" },
    { title: "科学知识普及", heat: 2000000, category: "科学", link: "https://bilibili.com/5" },
    { title: "电影影视评论", heat: 1700000, category: "电影", link: "https://bilibili.com/6" },
    { title: "美妆护肤教程", heat: 1400000, category: "美妆", link: "https://bilibili.com/7" },
    { title: "vlog日常分享", heat: 1100000, category: "生活", link: "https://bilibili.com/8" },
    { title: "体育赛事解说", heat: 800000, category: "体育", link: "https://bilibili.com/9" },
    { title: "历史文化讲座", heat: 500000, category: "文化", link: "https://bilibili.com/10" },
  ],
};

async function seedTrendingData() {
  try {
    console.log("🚀 开始生成模拟热榜数据...\n");

    const database = await db.getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    let totalInserted = 0;

    for (const [platform, items] of Object.entries(mockTrendingData)) {
      console.log(`📱 正在插入 ${platform} 数据...`);
      
      const itemsToInsert = items.map((item: any, index: number) => ({
        id: nanoid(),
        platform: platform as any,
        rank: index + 1,
        title: item.title,
        description: `热度: ${(item.heat / 1000000).toFixed(1)}M`,
        link: item.link,
        heat: item.heat,
        category: item.category,
        collectedAt: new Date(),
      }));

      await database.insert(trendingItems).values(itemsToInsert);
      console.log(`  ✅ 已插入 ${itemsToInsert.length} 条数据`);
      totalInserted += itemsToInsert.length;
    }

    console.log(`\n✅ 模拟数据生成完成！`);
    console.log(`   总共插入: ${totalInserted} 条数据`);
    console.log(`\n现在您可以访问热榜看板查看效果！`);
    process.exit(0);
  } catch (error) {
    console.error("❌ 错误:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

seedTrendingData();
