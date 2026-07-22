# 达人孵化工作台 - 任务交接指南

## 当前状态（检查点：340366e6）

### ✅ 已完成的功能

1. **UI 精细化改造**
   - Ink/Paper 设计系统（纸白底色 + 墨黑主色 + 朱砂强调色）
   - 全部 9 个页面重构
   - 等宽数字字体（tabular-nums）应用

2. **品牌调整**
   - 侧边栏品牌改为「美丽视线 Creator Hub」

3. **账号管理优化**
   - 创作者+平台账号二层模型
   - 内容类型自定义管理（8 个医美垂类预置）
   - 主页链接字段
   - 创作者管理页面（CRUD）
   - 内容类型管理页面（CRUD）

4. **飞书与本地文档集成（框架已搭建）**
   - ✅ FeishuSettings 页面已创建、路由已注册、侧边栏导航已添加
   - ✅ 文档解析工具已实现（documentParser.ts - 支持 .md/.txt/.docx）
   - ✅ 后端飞书路由框架已创建（feishuRouter.ts）
   - ✅ 后端 API 端点 `feishu.parseLocalDocument` 已实现

### ⏳ 待完成的工作

**优先级 1：脚本创建表单集成（下一步）**
- [ ] 在 ScriptsList.tsx 中添加本地上传 Tab
- [ ] 实现文件上传逻辑（.md/.txt/.docx）
- [ ] 调用 `trpc.feishu.parseLocalDocument` 解析文档
- [ ] 显示解析结果列表，用户选择脚本
- [ ] 自动填充脚本表单（标题、内容、序号）
- [ ] 前后端集成测试

**优先级 2：飞书 API 集成（后续优化）**
- [ ] 实现飞书 OAuth 流程
- [ ] 实现 `feishu.parseFeishuDocument` 端点
- [ ] 在脚本创建表单中添加飞书链接 Tab

**优先级 3：其他规划功能**
- [ ] AI 周报存入复盘库
- [ ] 热榜抓取与定时任务
- [ ] 数据导出与分析

---

## 如何在下一个会话中继续

### 方式 1：直接告诉 Agent 继续任务

```
请继续完成「达人孵化工作台」的飞书与本地文档集成功能。
当前进度：
- 文档解析工具已实现
- 后端 API 已创建
- 需要在脚本创建表单中集成本地上传 Tab

从 ScriptsList.tsx 开始，添加本地文件上传功能。
```

### 方式 2：提供具体的技术细节

```
继续开发脚本创建表单的本地文档上传功能：

1. 在 ScriptsList.tsx 中的脚本创建 Dialog 中添加 Tab 切换
   - Tab 1: 手动创建（现有）
   - Tab 2: 本地上传（新增）

2. 本地上传 Tab 需要：
   - 文件选择器（支持 .md/.txt/.docx）
   - 文档标题输入框（用于提取月份）
   - 上传按钮

3. 后端调用：
   - 将文件转换为 base64
   - 调用 trpc.feishu.parseLocalDocument
   - 显示解析结果（脚本列表）

4. 用户选择脚本后：
   - 自动填充表单（标题、内容）
   - 保存脚本

参考文件：
- client/src/pages/ScriptsList.tsx（需要修改）
- server/feishuRouter.ts（已实现 parseLocalDocument）
- server/documentParser.ts（已实现解析逻辑）
```

### 方式 3：使用 todo.md 中的任务列表

```
请查看 todo.md 中「飞书与本地文档集成」部分的待完成项，
按照列表顺序完成每一项，并在完成后标记为 [x]。
```

---

## 关键文件位置

| 文件 | 用途 | 状态 |
|------|------|------|
| `client/src/pages/ScriptsList.tsx` | 脚本列表和创建表单 | ⏳ 需要修改 |
| `server/feishuRouter.ts` | 飞书/文档 API 路由 | ✅ 已实现 |
| `server/documentParser.ts` | 文档解析工具 | ✅ 已实现 |
| `client/src/pages/FeishuSettings.tsx` | 飞书集成设置页面 | ✅ 已创建 |
| `todo.md` | 任务追踪 | ✅ 已更新 |

---

## 测试数据

- 当前数据库为空（新 schema）
- 可以使用飞书文档链接进行测试：https://cveommdnqw9.feishu.cn/wiki/N03PwyFL4iaUoSkrkdXccVOfn0J
- 或创建本地 Markdown 文件进行测试

---

## 注意事项

1. **PDF 支持暂时移除**
   - 由于 pdf-parse 模块导出问题，暂时只支持 .md/.txt/.docx
   - 可在后续优化中重新添加

2. **飞书 API 集成暂未实现**
   - 需要用户提供飞书应用的 App ID 和 App Secret
   - 需要实现 OAuth 流程

3. **所有测试通过**
   - 14 个单元测试全部通过
   - TypeScript 无错误

---

## 快速开始命令

```bash
# 进入项目目录
cd /home/ubuntu/talent-incubation-workbench

# 查看当前任务
cat todo.md

# 查看关键文件
cat server/feishuRouter.ts
cat server/documentParser.ts
cat client/src/pages/ScriptsList.tsx

# 运行测试
pnpm test

# 启动开发服务器
pnpm dev
```

---

## 最后的话

所有框架和工具已准备就绪。下一步只需要在脚本创建表单中集成文件上传 UI，
然后调用现有的后端 API 即可。工作量中等，预计 1-2 小时可完成。

祝开发顺利！
