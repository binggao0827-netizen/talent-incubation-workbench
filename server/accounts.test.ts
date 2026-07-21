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

describe("accounts router", () => {
  it("admin can list all accounts", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.accounts.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("admin can create account", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const accountId = await caller.accounts.create({
      name: "Test Account",
      platform: "抖音",
      category: "美妆",
      followerCount: 10000,
      accountUrl: "https://douyin.com/test",
    });

    expect(typeof accountId).toBe("string");
    expect(accountId.length).toBeGreaterThan(0);
  });

  it("account can be fetched by ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const accountId = await caller.accounts.create({
      name: "Beauty Account",
      platform: "小红书",
      category: "美妆",
      followerCount: 50000,
      accountUrl: "https://xiaohongshu.com/beauty",
      assignedEditor: "Alice",
    });

    const account = await caller.accounts.getById(accountId);

    expect(account.name).toBe("Beauty Account");
    expect(account.platform).toBe("小红书");
    expect(account.category).toBe("美妆");
    expect(account.followerCount).toBe(50000);
  });
});
