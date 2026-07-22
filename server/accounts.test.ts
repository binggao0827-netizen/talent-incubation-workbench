import { describe, expect, it, beforeAll } from "vitest";
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
  let testCreatorId: string;
  let testContentTypeId: string;

  beforeAll(async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test creator
    testCreatorId = await caller.creators.create({
      name: "Test Creator",
      description: "Test creator for accounts",
      status: "孵化中",
    });

    // Create a test content type
    testContentTypeId = await caller.contentTypes.create({
      name: "Test Type",
      description: "Test content type",
    });
  });

  it("admin can list all accounts", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.accounts.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can create account", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const accountId = await caller.accounts.create({
      creatorId: testCreatorId,
      platform: "抖音",
      accountName: "Test Account",
      followerCount: 10000,
      homepageUrl: "https://douyin.com/test",
      status: "孵化中",
      contentTypeIds: [testContentTypeId],
    });

    expect(typeof accountId).toBe("string");
    expect(accountId.length).toBeGreaterThan(0);
  });

  it("account can be fetched by ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const accountId = await caller.accounts.create({
      creatorId: testCreatorId,
      platform: "小红书",
      accountName: "Beauty Account",
      followerCount: 50000,
      homepageUrl: "https://xiaohongshu.com/beauty",
      status: "孵化中",
      contentTypeIds: [testContentTypeId],
    });

    const account = await caller.accounts.getById(accountId);

    expect(account.accountName).toBe("Beauty Account");
    expect(account.platform).toBe("小红书");
    expect(account.followerCount).toBe(50000);
  });
});
