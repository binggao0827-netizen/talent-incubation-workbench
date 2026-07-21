import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

async function seed() {
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("🌱 Seeding database...");

  // Create test accounts
  const accountIds = [];
  const accounts = [
    {
      name: "美妆达人小红",
      platform: "小红书",
      accountUrl: "https://xiaohongshu.com/user/123456",
      category: "美妆",
      followerCount: 150000,
      status: "成熟",
      assignedEditor: "张编导",
    },
    {
      name: "游戏主播老王",
      platform: "抖音",
      accountUrl: "https://douyin.com/user/654321",
      category: "游戏",
      followerCount: 280000,
      status: "孵化中",
      assignedEditor: "李编导",
    },
    {
      name: "B站剧情创作者",
      platform: "B站",
      accountUrl: "https://bilibili.com/user/987654",
      category: "剧情",
      followerCount: 95000,
      status: "孵化中",
      assignedEditor: "王编导",
    },
    {
      name: "视频号测评博主",
      platform: "视频号",
      accountUrl: "https://channels.weixin.qq.com/user/123",
      category: "测评",
      followerCount: 45000,
      status: "暂停",
      assignedEditor: "赵编导",
    },
    {
      name: "抖音教程达人",
      platform: "抖音",
      accountUrl: "https://douyin.com/user/111111",
      category: "教程",
      followerCount: 320000,
      status: "成熟",
      assignedEditor: "张编导",
    },
  ];

  for (const account of accounts) {
    const id = nanoid();
    accountIds.push(id);
    await connection.execute(
      `INSERT INTO accounts (id, name, platform, accountUrl, category, followerCount, status, assignedEditor) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        account.name,
        account.platform,
        account.accountUrl,
        account.category,
        account.followerCount,
        account.status,
        account.assignedEditor,
      ]
    );
  }

  console.log("✅ Created 5 test accounts");

  // Create test scripts
  const scriptIds = [];
  // Removed unused topicTags variable
  const hookTypes = ["提问式", "悬念式", "痛点式", "反转式", "数据式"];

  const scriptTemplates = [
    {
      title: "新手必看：3分钟学会完美底妆",
      topicTag: "教程",
      hookType: "提问式",
      content: "你是不是也在为底妆卡粉而烦恼？今天我就来教你3分钟快速打造完美底妆的秘诀...",
      ending: "记住这个方法，你也能拥有明星级别的底妆效果！",
      accountId: accountIds[0],
    },
    {
      title: "我玩了100小时才发现的游戏隐藏彩蛋",
      topicTag: "知识",
      hookType: "悬念式",
      content: "这个游戏我已经玩了100多小时，但直到今天我才发现了这个隐藏的彩蛋...",
      ending: "你们有发现过类似的彩蛋吗？评论区告诉我！",
      accountId: accountIds[1],
    },
    {
      title: "这个美妆产品真的值得买吗？深度测评",
      topicTag: "测评",
      hookType: "痛点式",
      content: "很多人都被这个产品的宣传迷惑了，今天我就来给大家做一个真实的测评...",
      ending: "综合来看，这个产品的性价比还是不错的，但不是所有人都适合。",
      accountId: accountIds[0],
    },
    {
      title: "剧情反转：她以为自己赢了，其实早已输了",
      topicTag: "剧情",
      hookType: "反转式",
      content: "故事的开头看起来很平常，但结局会让你大吃一惊...",
      ending: "有没有被这个反转惊到？",
      accountId: accountIds[2],
    },
    {
      title: "2024年最值得入手的5款护肤品",
      topicTag: "种草",
      hookType: "数据式",
      content: "根据今年的销售数据和用户评价，我整理出了5款最值得入手的护肤品...",
      ending: "这些产品都是经过验证的，相信不会让你失望！",
      accountId: accountIds[0],
    },
    {
      title: "这个游戏的难度设置有多离谱？",
      topicTag: "搞笑",
      hookType: "提问式",
      content: "我从来没见过这么离谱的游戏难度设置，简直是在虐待玩家...",
      ending: "各位游戏迷，你们有遇到过更离谱的吗？",
      accountId: accountIds[1],
    },
    {
      title: "B站视频制作完全指南",
      topicTag: "教程",
      hookType: "痛点式",
      content: "想要制作高质量的B站视频？这个完整指南会教你从策划到发布的全过程...",
      ending: "按照这个步骤来，你也能成为优质UP主！",
      accountId: accountIds[2],
    },
    {
      title: "抖音短视频爆款的5个秘密",
      topicTag: "知识",
      hookType: "数据式",
      content: "通过分析1000+爆款视频，我发现了它们都有的5个共同特点...",
      ending: "掌握这些秘密，你的视频也能成为爆款！",
      accountId: accountIds[4],
    },
    {
      title: "这个测评产品我用了一个月",
      topicTag: "测评",
      hookType: "反转式",
      content: "刚开始用的时候我不太看好，但一个月后我的想法完全改变了...",
      ending: "真的是越用越喜欢，现在已经回购了！",
      accountId: accountIds[3],
    },
    {
      title: "手机摄影技巧大公开",
      topicTag: "教程",
      hookType: "提问式",
      content: "你是不是也在用手机拍出来的照片总是不理想？其实只需要掌握这几个技巧...",
      ending: "学会这些技巧，你也能用手机拍出专业级照片！",
      accountId: accountIds[0],
    },
  ];

  for (const script of scriptTemplates) {
    const id = nanoid();
    scriptIds.push(id);
    const publishDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    await connection.execute(
      `INSERT INTO scripts (id, accountId, title, topicTag, hookType, content, ending, publishDate, creator, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        script.accountId,
        script.title,
        script.topicTag,
        script.hookType,
        script.content,
        script.ending,
        publishDate,
        "系统生成",
        Math.random() > 0.3 ? "发布" : "审核",
      ]
    );
  }

  console.log("✅ Created 10 test scripts");

  // Create test metrics
  for (const scriptId of scriptIds) {
    const recordCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < recordCount; i++) {
      const id = nanoid();
      const recordDate = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
      const views = Math.floor(Math.random() * 50000) + 5000;
      const completionRate = (Math.random() * 40 + 40).toFixed(2);

      await connection.execute(
        `INSERT INTO metrics (id, scriptId, views, likes, comments, shares, newFollowers, completionRate, recordDate) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          scriptId,
          views,
          Math.floor(views * (Math.random() * 0.1 + 0.02)),
          Math.floor(views * (Math.random() * 0.05 + 0.01)),
          Math.floor(views * (Math.random() * 0.02 + 0.005)),
          Math.floor(Math.random() * 5000) + 100,
          completionRate,
          recordDate,
        ]
      );
    }
  }

  console.log("✅ Created test metrics data");

  // Create test reviews
  const weeks = ["2024-W28", "2024-W29", "2024-W30"];
  for (const week of weeks) {
    const id = nanoid();
    await connection.execute(
      `INSERT INTO reviews (id, week, accountId, content, highlights, pitfalls, nextWeekPlan, aiGenerated) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        week,
        null,
        `本周整体表现不错，各账号都有新的增长。继续保持现有的内容策略，同时尝试新的选题方向。`,
        `美妆账号的教程类视频表现突出，平均完播率达到65%。`,
        `游戏账号的某个视频因为内容问题被限流，需要加强审核。`,
        `下周计划推出5个新选题，重点关注用户反馈。`,
        false,
      ]
    );
  }

  console.log("✅ Created 3 test reviews");

  console.log("✨ Database seeding completed!");
  await connection.end();
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
