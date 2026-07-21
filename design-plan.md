# 达人孵化工作台 · UI 精细化改造设计方案（v2）

> 依据 frontend-design skill 制定。目标：去除"AI 生成感"，达到 Linear/Notion 级别的简约高级内部工具质感。
> 主体：短视频团队内部工具（编导 + 老板），单一职责是"让内容资产和数据一眼可读"。

## 一、诊断（当前 AI 感来源）

1. 大面积饱和蓝（#2563eb 类）实心按钮 + 蓝色渐变 logo（`bg-gradient-to-br from-blue-500 to-blue-600`）
2. emoji 作为平台图标（🎵📱🎬📺）——最强 AI 感来源
3. Sparkles 图标滥用（AI 页每个按钮/标题都有）
4. 彩色胶囊 badge（bg-blue-100/green-100/yellow-100 text-*-800）三色混杂
5. 全宽大按钮（w-full 大蓝条）、hover:shadow-lg 卡片浮起
6. text-gray-* 硬编码，排版层级靠 text-3xl font-bold 蛮力
7. 标题下都跟一句副标题说明文，模板感强
8. 图表默认 recharts 样式（虚线网格、默认 tooltip、Legend、绿色 bar + 蓝色 line 混杂）
9. Dashboard 图表用 Math.random() 假数据（须改为真实数据或明确空态）

## 二、Token 系统

### 色彩（5 个命名值，oklch）
- **Ink 墨** `oklch(0.205 0.012 260)` ≈ #1a1c22 —— 主文字、主按钮（黑按钮替代蓝按钮）
- **Paper 纸** `oklch(0.988 0.002 90)` ≈ #fcfcfb —— 页面背景（极浅暖白，非纯白）
- **Graphite 石墨** `oklch(0.51 0.015 260)` —— 次级文字
- **Hairline 发丝线** `oklch(0.922 0.004 260)` —— 分割线/边框
- **Signal 信号红橙** `oklch(0.62 0.19 33)` ≈ #e0492f —— 唯一强调色：数据高亮、活跃态指示、录制点。短视频行业的"REC 红点"隐喻，克制使用（小面积）。

主按钮 = Ink 黑底白字；强调色仅用于：侧边栏活跃指示点、关键数据上升值、"发布"状态点、图表主线。
状态语义不再用彩色胶囊，改为「点 + 文字」：`●（色点 6px）+ 灰字`。发布=Signal、审核=amber、草稿/归档=灰。

### 字体
- UI/正文：Inter + PingFang SC（保持）
- 数据数字：**JetBrains Mono**（Google Fonts，weight 500）+ `font-variant-numeric: tabular-nums`，所有 KPI、粉丝数、播放量用 `.font-data` 类
- 标题：Inter 600（不再用 font-bold 700），字号降一档：页面标题 text-xl/2xl，收紧 tracking

### 布局与层级
- 卡片：去阴影，`border border-hairline + rounded-lg(8px)`，hover 时仅 border 变深，不浮起
- radius 从 0.65rem 降到 0.5rem（更工具感）
- 页头：标题与副标题同一行基线（标题左，说明文字弱化或删除），页头下加发丝线
- KPI 卡：去掉 Card 组件叠层，改为「发丝线分栏」的一体化统计条（grid + divide-x），数字用 mono
- 列表行：table 化视觉（分行发丝线），减少卡片嵌套

### 签名元素
**「REC 信号点」**：侧边栏当前导航项左侧一个 6px Signal 色圆点（微呼吸动画，respect reduced-motion），呼应短视频拍摄的 REC 录制指示。同一语言延伸到状态点、数据上升箭头。这是全站唯一的"活"元素。

### 动效
- 删除 hover:shadow-lg、按钮 shadow-lg
- 仅保留：按钮 active scale(0.97) 160ms、导航/行 hover 背景 150ms ease-out
- REC 点呼吸动画 2s（reduced-motion 关闭）

## 三、改造清单（文件级）

1. `client/index.html`：加 JetBrains Mono 字体
2. `client/src/index.css`：全套 CSS 变量重写（上述色彩）、`.font-data` 工具类、REC 点动画 keyframes、radius 0.5rem
3. `DashboardLayout.tsx`：logo 去渐变（Ink 方块或纯字标）、REC 活跃点、顶栏精简（去重复标题，显示当前页面名）、侧边栏 footer 精简
4. `Home.tsx`：hero 去渐变占位块，改为"产品界面线框示意"或纯排版 hero；feature 卡去蓝色渐变；CTA 区 Ink 底
5. `Dashboard.tsx`：KPI 统计条（divide-x 一体化）、图表样式统一（细线、无 Legend、自定义 tooltip、Signal 主线色 + Ink 辅线）、时间切换改 segmented control、TOP5 改排名表格行、**去掉 Math.random 假数据→用真实 metrics 或空态**
6. `AccountsList.tsx`：去 emoji 平台图标→改为文字缩写方块（抖/红/B/视）单色；badge 改状态点；卡片去 hover 阴影
7. `ScriptsList.tsx`：列表行 table 化，badge 改状态点+细边框 tag；筛选条精简
8. `ScriptDetail.tsx`：KPI 用统计条 + mono 数字；数据记录时间线化
9. `AccountDetail.tsx`：同上统一
10. `ReviewsList.tsx`：「AI 生成」badge 改为细体标注"由 AI 起草"；卡片精简
11. `AIFeatures.tsx`：去 Sparkles 滥用（仅标题区一个小图标或全部去掉）、全宽大蓝按钮改普通尺寸 Ink 按钮右对齐、"使用说明"卡改页脚细字注释
12. 所有 text-gray-* → 语义 token（text-muted-foreground 等）

## 四、验收标准
- 全站只有一处强调色系（Signal），蓝色全部移除
- 无 emoji、无渐变、无浮起阴影
- 所有数字 tabular mono
- 截图对比确认后保存检查点

---

## 执行进度记录（供上下文压缩后恢复）

已完成：
- [x] index.css：token 全部重写（Ink/Paper/Signal oklch，radius 0.5rem，.font-data、.rec-dot、.status-dot、按压反馈、REC 呼吸动画）
- [x] index.html：加 JetBrains Mono 字体，lang=zh-CN
- [x] DashboardLayout.tsx：Ink logo 方块 + 双行字标、REC 活跃点导航、面包屑顶栏（工作台/页面名）、max-w-6xl 内容容器、footer 精简、resize handle 去蓝
- [x] 新建 client/src/components/Meta.tsx：StatusDot、Tag、StatStrip、PageHeader 四个共享组件
- [x] Dashboard.tsx：PageHeader + segmented control、StatStrip KPI、真实数据图表（去 Math.random）、TOP5 排名表格行（01/02 mono 序号）、账号状态表格行 + StatusDot

待完成（页面改造要点见上方“三、改造清单”）：
- [x] Home.tsx：已重写为编辑部风 Ink/Paper landing（编号目录式能力区 + 深色反转 AI 区）
- [x] AccountsList.tsx：已完成（platformMark 字标、StatusDot、PageHeader、虚线空状态）
- [x] ScriptsList.tsx：已完成（连体列表行、Tag+StatusDot、PageHeader）
- [x] ReviewsList.tsx：已完成（连体列表行、Tag、详情弹窗 section 精简）
- [x] ScriptDetail.tsx：已完成（返回链接头部、StatusDot+Tag、StatStrip KPI、表格式数据记录、右对齐按钮）
- [x] AccountDetail.tsx：已重写（返回链接、StatusDot、StatStrip、连体脚本列表行、平台主页 ArrowUpRight 链接）
- [x] AIFeatures.tsx：已完成（改名“AI 助手”、去 Sparkles、按钮移到卡片头部右侧 size=sm、空结果虚线占位、使用说明改页脚注释）
- [ ] 全局 grep 'text-gray-\|bg-blue-\|bg-gradient' 清理残留
- [ ] Dashboard.tsx 检查未使用的 Tag import 并移除
- [ ] 截图验证（/ /dashboard /accounts /scripts /reviews /ai 共6页）
- [ ] pnpm test、保存 checkpoint、更新 todo.md、交付

注意事项：
- Dashboard.tsx 引入了 Meta.tsx 的 Tag 但可能未使用，最后检查移除未用 import
- Dashboard/其余页面均包在 DashboardLayout 内（AIFeatures 自己包了 DashboardLayout，其他页面在 App.tsx 里包）
- 测试命令：cd /home/ubuntu/talent-incubation-workbench && pnpm test
- 预览 URL 端口 3000

## 验证记录（2026-07-21）
- 已修复 Dashboard 无限加载：getStats 的 startDate/endDate 每次 render 生成新 Date 导致无限 refetch，已用 useMemo([timeRange]) 稳定引用。
- Dashboard 现在正常渲染：KPI StatStrip（31 账号 / 4 新增脚本 / 24,246 涨粉 / 322,547 播放）、爆款 TOP5 空状态、账号状态列表行均正常。
- "/" 路径对已登录管理员会重定向到 /dashboard（截图相同），属预期行为。
- 账号管理、复盘库、AI 助手、脚本库页面截图均正常，新设计（Ink/Paper、StatusDot、连体列表行、font-data 数字）生效。
- NotFound.tsx 已重写为 Ink/Paper 风格；全局已无 text-gray-/bg-blue-/bg-gradient 残留。
- tsc --noEmit 通过。
- 待办：pnpm test → checkpoint → 更新 todo.md → 交付。
