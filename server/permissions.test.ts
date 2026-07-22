import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TRPCError } from "@trpc/server";

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

function createEditorContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "editor-user",
    email: "editor@example.com",
    name: "Editor User",
    loginMethod: "manus",
    role: "user",
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

describe("permission control", () => {
  let testCreatorId: string = "";
  let testAccountId: string = "";

  beforeAll(async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test creator
    testCreatorId = await caller.creators.create({
      name: "Test Creator",
      description: "Test creator for permissions",
      status: "孵化中",
    });

    // Create a test account
    testAccountId = await caller.accounts.create({
      creatorId: testCreatorId,
      platform: "抖音",
      accountName: "Test Account",
      followerCount: 5000,
      status: "孵化中",
    });
  });

  it("admin can create accounts", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const accountId = await caller.accounts.create({
      creatorId: testCreatorId,
      platform: "抖音",
      accountName: "Admin Created Account",
      followerCount: 10000,
      homepageUrl: "https://douyin.com/admin",
      status: "孵化中",
    });

    expect(typeof accountId).toBe("string");
    expect(accountId.length).toBeGreaterThan(0);
  });

  it("admin can list all accounts", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.accounts.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("editor can list accounts", async () => {
    const ctx = createEditorContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.accounts.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can create scripts", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    if (!testAccountId) {
      throw new Error("testAccountId not set");
    }

    const scriptId = await caller.scripts.create({
      title: "Admin Script",
      content: "Admin content",
      topicTag: "其他",
      hookType: "其他",
      accountId: testAccountId,
      status: "草稿",
    });

    expect(typeof scriptId).toBe("string");
    expect(scriptId.length).toBeGreaterThan(0);
  });

  it("editor can create scripts", async () => {
    const ctx = createEditorContext();
    const caller = appRouter.createCaller(ctx);

    if (!testAccountId) {
      throw new Error("testAccountId not set");
    }

    const scriptId = await caller.scripts.create({
      title: "Editor Script",
      content: "Editor content",
      topicTag: "其他",
      hookType: "其他",
      accountId: testAccountId,
      status: "草稿",
    });

    expect(typeof scriptId).toBe("string");
    expect(scriptId.length).toBeGreaterThan(0);
  });
});
