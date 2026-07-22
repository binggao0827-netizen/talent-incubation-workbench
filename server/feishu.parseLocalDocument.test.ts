import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("feishu.parseLocalDocument", () => {
  it("should parse markdown file with multiple scripts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create markdown content
    const markdownContent = `# 2026年5月脚本

## 选题一：《医美黑科技 - 冷冻溶脂的真相》

冷冻溶脂真的有效吗？我们邀请了三位医美医生，用真实数据和案例为你揭秘这项火爆的医美项目。

从原理到效果，从价格到风险，这一期我们全面对标国际标准，让你了解什么是真正的医美黑科技。

## 选题二：《素颜霜真的能变白吗？3000元vs30元对比测试》

小红书爆火的素颜霜，真的值那个价吗？我们买来了市面上最火的5款产品，从成分、效果、持久度三个维度做了详细对比。

结果可能会颠覆你的认知。`;

    const base64Content = Buffer.from(markdownContent).toString("base64");

    const result = await caller.feishu.parseLocalDocument({
      content: base64Content,
      fileName: "test-scripts.md",
      fileType: "md",
      documentTitle: "2026年5月脚本",
    });

    expect(result.scripts).toBeDefined();
    expect(result.scripts.length).toBeGreaterThan(0);
    expect(result.scripts[0]).toMatchObject({
      scriptId: expect.stringMatching(/^\d{2}-\d{2}$/),
      title: expect.any(String),
      content: expect.any(String),
    });
  });

  it("should extract month correctly from document title", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const markdownContent = `选题一：《测试脚本》\n测试内容`;
    const base64Content = Buffer.from(markdownContent).toString("base64");

    const result = await caller.feishu.parseLocalDocument({
      content: base64Content,
      fileName: "test.md",
      fileType: "md",
      documentTitle: "2026年7月脚本",
    });

    expect(result.scripts).toBeDefined();
    if (result.scripts.length > 0) {
      expect(result.scripts[0].scriptId).toMatch(/^07-/);
    }
  });

  it("should handle plain text files", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const textContent = `选题一：《测试脚本1》\n内容1\n\n选题二：《测试脚本2》\n内容2`;
    const base64Content = Buffer.from(textContent).toString("base64");

    const result = await caller.feishu.parseLocalDocument({
      content: base64Content,
      fileName: "test.txt",
      fileType: "txt",
      documentTitle: "5月",
    });

    expect(result.scripts).toBeDefined();
    expect(result.scripts.length).toBeGreaterThanOrEqual(1);
  });

  it("should require authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const base64Content = Buffer.from("test").toString("base64");

    try {
      await caller.feishu.parseLocalDocument({
        content: base64Content,
        fileName: "test.md",
        fileType: "md",
        documentTitle: "test",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });
});
