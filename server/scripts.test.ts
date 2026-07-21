import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("scripts router", () => {
  it("admin can list scripts", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scripts.list({});

    expect(Array.isArray(result)).toBe(true);
  });

  it("script creation returns ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const scriptId = await caller.scripts.create({
      title: "Test Script",
      content: "Test content",
      topicTag: "其他",
      hookType: "其他",
      accountId: "1",
      status: "草稿",
    });

    expect(typeof scriptId).toBe("string");
    expect(scriptId.length).toBeGreaterThan(0);
  });

  it("scripts can be filtered by status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const draftScripts = await caller.scripts.list({ status: "草稿" });

    expect(Array.isArray(draftScripts)).toBe(true);
    draftScripts.forEach((script) => {
      expect(script.status).toBe("草稿");
    });
  });

  it("scripts can be filtered by topic tag", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const scripts = await caller.scripts.list({ topicTag: "教程" });

    expect(Array.isArray(scripts)).toBe(true);
    scripts.forEach((script) => {
      expect(script.topicTag).toBe("教程");
    });
  });

  it("script creation stores all fields", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const scriptId = await caller.scripts.create({
      title: "Complete Script",
      content: "Full content here",
      topicTag: "知识",
      hookType: "提问式",
      accountId: "1",
      status: "草稿",
    });

    // Verify the script was created by fetching it
    const script = await caller.scripts.getById(scriptId);
    expect(script.title).toBe("Complete Script");
    expect(script.content).toBe("Full content here");
    expect(script.topicTag).toBe("知识");
    expect(script.hookType).toBe("提问式");
  });
});
