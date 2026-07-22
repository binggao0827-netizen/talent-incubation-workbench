import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { parseDocument } from "./documentParser";

function isAdmin(userRole?: string): boolean {
  return userRole === "admin";
}

export const feishuRouter = router({
  // Get Feishu configuration
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.user?.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    // TODO: Get from database (feishu_config table)
    return null;
  }),

  // Save Feishu configuration
  saveConfig: protectedProcedure
    .input(z.object({
      appId: z.string().min(1),
      appSecret: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!isAdmin(ctx.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // TODO: Save to database (feishu_config table)
      return { success: true };
    }),

  // Test Feishu connection
  testConnection: protectedProcedure
    .input(z.object({
      appId: z.string().min(1),
      appSecret: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!isAdmin(ctx.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // TODO: Call Feishu API to test connection
      return { success: true, message: "连接成功" };
    }),

  // Parse document from Feishu link
  parseFeishuDocument: protectedProcedure
    .input(z.object({
      documentUrl: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      // TODO: Call Feishu API to fetch document content
      // TODO: Parse and extract scripts
      return { scripts: [] };
    }),

  // Parse local document (base64 encoded content)
  parseLocalDocument: protectedProcedure
    .input(z.object({
      content: z.string(),
      fileName: z.string(),
      fileType: z.enum(["md", "txt", "docx"]),
      documentTitle: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      try {
        const scripts = await parseDocument(
          input.content,
          input.fileType,
          input.documentTitle
        );
        return { scripts };
      } catch (error) {
        console.error("Document parsing error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse document",
        });
      }
    }),
});
