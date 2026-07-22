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

  // Batch import scripts from local document (one-click import)
  batchImportScripts: protectedProcedure
    .input(z.object({
      content: z.string(),
      fileName: z.string(),
      fileType: z.enum(["md", "txt", "docx"]),
      documentTitle: z.string(),
      accountId: z.string().optional(),
      topicTag: z.string().optional(),
      hookType: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      try {
        // Parse document to extract scripts
        const scripts = await parseDocument(
          input.content,
          input.fileType,
          input.documentTitle
        );

        if (scripts.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No scripts found in document",
          });
        }

        // Create all scripts in batch
        const createdScripts = [];
        for (const script of scripts) {
          try {
            // Only create script if accountId is provided
            if (!input.accountId) {
              console.warn(`Skipping script ${script.scriptId}: accountId is required`);
              continue;
            }
            
            const created = await db.createScript({
              title: script.title,
              content: script.content,
              accountId: input.accountId,
              topicTag: (input.topicTag as any) || "其他",
              hookType: (input.hookType as any) || "其他",
              status: "草稿",
            });
            createdScripts.push(created);
          } catch (error) {
            console.error(`Failed to create script ${script.scriptId}:`, error);
            // Continue with next script even if one fails
          }
        }

        return {
          success: true,
          totalScripts: scripts.length,
          createdScripts: createdScripts.length,
          scripts: createdScripts,
        };
      } catch (error) {
        console.error("Batch import error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to import scripts",
        });
      }
    }),
});
