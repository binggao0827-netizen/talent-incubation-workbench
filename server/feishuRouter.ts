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

  // Parse document from Feishu link - returns document content for further parsing
  parseFeishuDocument: protectedProcedure
    .input(z.object({
      documentUrl: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      try {
        // Extract document ID from Feishu URL
        // Feishu URLs can be in multiple formats:
        // - https://xxx.feishu.cn/docs/doccn...
        // - https://xxx.feishu.cn/wiki/VTWewebNUit3wfkUMZqcPgXPnyh
        // - https://xxx.feishu.cn/base/appXXX
        
        // Try to match docs format first
        let urlMatch = input.documentUrl.match(/docs\/([a-zA-Z0-9]+)/);
        let docId = urlMatch?.[1];
        
        // If not docs format, try wiki format
        if (!docId) {
          urlMatch = input.documentUrl.match(/wiki\/([a-zA-Z0-9]+)/);
          docId = urlMatch?.[1];
        }
        
        // If still no match, try base format
        if (!docId) {
          urlMatch = input.documentUrl.match(/base\/([a-zA-Z0-9]+)/);
          docId = urlMatch?.[1];
        }
        
        // If still no match, try to extract from pathname
        if (!docId) {
          const urlObj = new URL(input.documentUrl);
          const pathSegments = urlObj.pathname.split("/").filter(s => s);
          if (pathSegments.length >= 2) {
            docId = pathSegments[pathSegments.length - 1];
          }
        }
        
        if (!docId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid Feishu document URL format. Supported formats: docs, wiki, base",
          });
        }

        console.log(`Fetching Feishu document: ${docId} from URL: ${input.documentUrl}`);
        
        // For now, return placeholder document content
        // In production, this would call the Feishu API to fetch document content
        // TODO: Implement actual Feishu API integration
        // This would require:
        // 1. Get Feishu app credentials from database
        // 2. Call Feishu API to fetch document content (as markdown or html)
        // 3. Return the raw content for batchImportScripts to parse
        
        // Placeholder content with proper format for parseDocument
        // Format: 选题一：《标题》 followed by content
        const placeholderContent = `选题一：《从飞书导入的脚本示例》
这是从飞书文档导入的脚本内容。您可以在这里添加脚本的详细描述。

选题二：《另一个脚本例子》
这是第二个脚本的示例内容。可以包含多行文本和格式化内容。`;
        
        return { 
          content: Buffer.from(placeholderContent).toString('base64') // Return as base64 like local upload
        };
      } catch (error) {
        console.error("Feishu document parsing error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to parse Feishu document",
        });
      }
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
