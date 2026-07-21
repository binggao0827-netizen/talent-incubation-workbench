import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { eq, gte, lte } from "drizzle-orm";
import { scripts, metrics, reviews } from "../drizzle/schema";

/**
 * Generate AI weekly report based on current week's scripts and data
 */
export async function generateWeeklyReport(weekStart: Date, weekEnd: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get scripts published this week
  const weekScripts = await db
    .select()
    .from(scripts)
    .where(
      gte(scripts.publishDate, weekStart) && lte(scripts.publishDate, weekEnd)
    );

  // Get metrics for these scripts
  const scriptIds = weekScripts.map((s) => s.id);
  const weekMetrics = await db
    .select()
    .from(metrics)
    .where(
      scriptIds.length > 0
        ? gte(metrics.scriptId, scriptIds[0])
        : undefined
    );

  // Get existing reviews for this week
  const weekReviews = await db
    .select()
    .from(reviews)
    .where(
      gte(reviews.createdAt, weekStart) && lte(reviews.createdAt, weekEnd)
    );

  // Build context for LLM
  const scriptSummary = weekScripts
    .map(
      (s) =>
        `- 《${s.title}》(${s.topicTag}/${s.hookType}): ${s.content.substring(0, 100)}...`
    )
    .join("\n");

  const metricsSummary = weekMetrics
    .slice(0, 5)
    .map(
      (m) =>
        `- 脚本 #${m.scriptId}: 播放 ${m.views || 0}, 点赞 ${m.likes || 0}, 涨粉 ${m.newFollowers || 0}`
    )
    .join("\n");

  const reviewSummary = weekReviews
    .map((r) => `- ${r.week}: ${r.content.substring(0, 80)}...`)
    .join("\n");

  const prompt = `
你是一个短视频内容运营分析专家。根据以下本周数据，生成一份结构化的周报。

本周发布的脚本：
${scriptSummary || "无"}

本周数据表现：
${metricsSummary || "无"}

本周复盘记录：
${reviewSummary || "无"}

请生成一份包含以下部分的周报：
1. 本周亮点（2-3个最成功的内容或数据表现）
2. 存在的问题（2-3个需要改进的方面）
3. 下周建议（3-5条具体的改进建议）

格式要求：
- 每个部分用 ## 开头
- 使用 markdown 格式
- 内容要具体、可执行
- 基于实际数据进行分析
`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a professional short-video content operations analyst. Generate structured weekly reports based on actual data.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.choices[0].message.content;
}

/**
 * Analyze patterns in top-performing scripts
 */
export async function analyzeTopScriptPatterns() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get top scripts by views
  const topScripts = await db
    .select()
    .from(scripts)
    .where(eq(scripts.status, "发布"))
    .limit(10);

  // Get metrics for these scripts
  const scriptMetrics = await Promise.all(
    topScripts.map(async (script) => {
      const scriptMetrics = await db
        .select()
        .from(metrics)
        .where(eq(metrics.scriptId, script.id))
        .limit(1);
      return { script, metric: scriptMetrics[0] };
    })
  );

  // Build analysis context
  const topPerformers = scriptMetrics
    .filter((sm) => sm.metric)
    .sort((a, b) => (b.metric?.views || 0) - (a.metric?.views || 0))
    .slice(0, 5)
    .map(
      (sm) =>
        `- 《${sm.script.title}》(${sm.script.topicTag}/${sm.script.hookType}): 播放 ${sm.metric?.views || 0}, 完播率 ${sm.metric?.completionRate || 0}%`
    )
    .join("\n");

  const prompt = `
分析以下表现最好的短视频脚本，找出成功的规律：

${topPerformers}

请分析：
1. 这些脚本的共同特点（选题、钩子、结构等）
2. 成功的关键因素
3. 对未来选题的建议

格式：
- 使用 markdown 格式
- 每个分析点要具体、可复用
`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a short-video content strategy expert. Analyze patterns in successful content.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.choices[0].message.content;
}

/**
 * Generate topic ideas based on history and trends
 */
export async function generateTopicIdeas(
  accountId?: string,
  hotTopics?: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get recent successful scripts
  const recentScripts = await db
    .select()
    .from(scripts)
    .where(accountId ? eq(scripts.accountId, accountId) : undefined)
    .limit(20);

  const topicTags = recentScripts
    .map((s) => s.topicTag)
    .filter((tag, idx, arr) => arr.indexOf(tag) === idx);

  const hookTypes = recentScripts
    .map((s) => s.hookType)
    .filter((hook, idx, arr) => arr.indexOf(hook) === idx);

  const hotTopicsStr = hotTopics?.join("、") || "无";

  const prompt = `
根据以下信息，为短视频创作者生成10个新的选题创意：

最近常用的选题标签：${topicTags.join("、")}
最常用的钩子类型：${hookTypes.join("、")}
当前热点话题：${hotTopicsStr}

请生成10个具体的选题创意，每个包括：
1. 选题名称
2. 推荐的选题标签
3. 推荐的钩子类型
4. 简短的脚本思路

格式：
使用 markdown 的有序列表
每个选题用 ### 开头
`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a creative director for short-video content. Generate innovative and practical topic ideas.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.choices[0].message.content;
}
