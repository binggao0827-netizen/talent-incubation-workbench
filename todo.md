# Project TODO

## 已完成项

- [x] 项目初始化（web-db-user 模板）
- [x] 设计整体架构和技术方案
- [x] 确认设计风格（现代极简 SaaS）

---

## UI 精细化改造（已完成）

- [x] 制定设计 token 系统（色彩、字体、间距、圆角、阴影）
- [x] 更新 index.css 全局设计变量与基础样式
- [x] DashboardLayout 侧边栏视觉升级
- [x] Home 着陆页去 AI 感改造
- [x] AccountsList / AccountDetail 页面精细化
- [x] ScriptsList / ScriptDetail 页面精细化
- [x] ReviewsList 页面精细化
- [x] Dashboard 老板看板图表与 KPI 卡片精细化
- [x] AIFeatures 页面去除过度装饰（渐变、emoji 图标等）
- [x] 数据展示使用等宽数字字体（tabular-nums）
- [x] 截图验证改造效果
- [x] 修复 Dashboard 无限加载（getStats 查询入参引用不稳定，已用 useMemo 修复）
- [x] NotFound 页面对齐新设计语言
- [x] 保存新检查点并交付

---

## 品牌调整（已完成）

- [x] 侧边栏 Logo 墨块字符更新为「M」
- [x] 副标题更新为「MLSX Creator Hub」
- [x] Logo 墨块隐藏、副标题字号放大至 16px
- [x] 主副标题调换（主：美丽视线 Creator Hub，副：达人孵化工作台）

---

## 账号管理优化（已完成）

- [x] 确认方案 A：创作者+平台账号二层模型
- [x] 更新 schema：创建 creators、修改 accounts 添加 homepage_url、创建 content_types 表、实现二层模型
- [x] 清空旧数据（不迁移，仅保留新 schema）
- [x] 更新后端 API：创作者管理、平台账号管理、内容类型管理
- [x] 重构前端 UI：账号列表新增表单（创作者选择、内容类型多选、主页链接）、修复其他页面字段引用
- [x] 创建创作者管理页面（CRUD）
- [x] 创建内容类型管理页面（支持自定义编辑）
- [x] 更新单元测试到新 API 结构
- [x] 所有 14 个单元测试通过
- [x] 保存新检查点并交付

---

## 飞书与本地文档集成（进行中 - 框架已搭建）

功能需求已确认，设计方案已完成，框架代码已创建。

**已完成：**
- [x] 创建飞书集成设置页面框架（FeishuSettings.tsx - 含详细用户指引）
- [x] 创建文档解析工具框架（documentParser.ts - 支持 .md/.txt/.docx/.pdf）
- [x] 创建后端飞书路由框架（feishuRouter.ts）
- [x] 安装必要依赖包（pdf-parse、mammoth）

**待完成：**
- [ ] 完整实现飞书 API 调用逻辑（OAuth、文档读取）
- [ ] 完整实现文档解析逻辑（月份提取、选题识别、序号生成）
- [ ] 在脚本创建表单中集成双上传方式 Tab 切换
- [ ] 前后端集成测试
- [ ] 保存最终检查点

---

## 其他规划功能（未开始）

- [ ] AI 周报存入复盘库
- [ ] 热榜抓取与定时任务
- [ ] 数据导出与分析
