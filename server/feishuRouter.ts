import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { parseDocument } from "./documentParser";
import { nanoid } from "nanoid";
import { feishuConfigs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

function isAdmin(userRole?: string): boolean {
  return userRole === "admin";
}

// Helper function to get Feishu access token
async function getFeishuAccessToken(appId: string, appSecret: string): Promise<string> {
  try {
    const response = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret,
      }),
    });

    const data = await response.json() as any;
    if (data.code !== 0) {
      throw new Error(`Failed to get access token: ${data.msg}`);
    }
    return data.tenant_access_token;
  } catch (error) {
    throw new Error(`Feishu API error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Helper function to get document content from Feishu API
async function getFeishuDocumentContent(docId: string, accessToken: string): Promise<string> {
  try {
    // Try multiple API endpoints to get document content
    const endpoints = [
      `https://open.feishu.cn/open-apis/doc/v2/${docId}/raw_content`,
      `https://open.feishu.cn/open-apis/docs/v2/${docId}/raw_content`,
    ];

    let lastError: Error | null = null;

    for (const url of endpoints) {
      try {
        console.log(`Trying Feishu API endpoint: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        console.log(`Feishu API response status: ${response.status}`);

        const data = await response.json() as any;
        console.log(`Feishu API response:`, JSON.stringify(data).substring(0, 500));
        
        if (data.code === 0 && data.data?.content) {
          const content = data.data.content;
          console.log(`Document content length: ${content.length}`);
          return content;
        } else if (data.code !== 0) {
          lastError = new Error(`API error (${data.code}): ${data.msg}`);
          console.log(`Endpoint ${url} failed, trying next...`);
          continue;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`Endpoint ${url} failed with error:`, lastError.message);
        continue;
      }
    }

    // If all endpoints failed, throw the last error
    if (lastError) {
      throw lastError;
    }

    throw new Error("No valid API endpoint returned document content");
  } catch (error) {
    console.error(`getFeishuDocumentContent error:`, error);
    throw new Error(`Failed to get document content: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export const feishuRouter = router({
  // Get Feishu configuration
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.user?.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    
    try {
      const database = await db.getDb();
      if (!database) {
        return null;
      }

      const config = await database
        .select()
        .from(feishuConfigs)
        .where(eq(feishuConfigs.userId, ctx.user.id))
        .limit(1);

      if (config.length === 0) {
        return null;
      }

      // Don't return the secret
      return {
        appId: config[0].appId,
      };
    } catch (error) {
      console.error("Failed to get Feishu config:", error);
      return null;
    }
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

      try {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Check if config already exists
        const existing = await database
          .select()
          .from(feishuConfigs)
          .where(eq(feishuConfigs.userId, ctx.user.id))
          .limit(1);

        if (existing.length > 0) {
          // Update existing config
          await database
            .update(feishuConfigs)
            .set({
              appId: input.appId,
              appSecret: input.appSecret,
              updatedAt: new Date(),
            })
            .where(eq(feishuConfigs.userId, ctx.user.id));
        } else {
          // Create new config
          await database.insert(feishuConfigs).values({
            id: nanoid(36),
            userId: ctx.user.id,
            appId: input.appId,
            appSecret: input.appSecret,
          });
        }

        return { success: true };
      } catch (error) {
        console.error("Failed to save Feishu config:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save configuration",
        });
      }
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

      try {
        await getFeishuAccessToken(input.appId, input.appSecret);
        return { success: true, message: "连接成功" };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Connection failed",
        });
      }
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
        // Get Feishu config from database
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const config = await database
          .select()
          .from(feishuConfigs)
          .where(eq(feishuConfigs.userId, ctx.user.id))
          .limit(1);

        if (config.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Feishu configuration not found. Please configure Feishu API first.",
          });
        }

        // Extract document ID from Feishu URL
        let urlMatch = input.documentUrl.match(/docs\/([a-zA-Z0-9]+)/);
        let docId = urlMatch?.[1];

        if (!docId) {
          urlMatch = input.documentUrl.match(/wiki\/([a-zA-Z0-9]+)/);
          docId = urlMatch?.[1];
        }

        if (!docId) {
          urlMatch = input.documentUrl.match(/base\/([a-zA-Z0-9]+)/);
          docId = urlMatch?.[1];
        }

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

        // Get access token
        const accessToken = await getFeishuAccessToken(config[0].appId, config[0].appSecret);

        // Get document content
        const content = await getFeishuDocumentContent(docId, accessToken);

        if (!content) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Document is empty or cannot be accessed",
          });
        }

        // Return as base64 like local upload
        return {
          content: Buffer.from(content).toString('base64')
        };
      } catch (error) {
        console.error("Feishu document parsing error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
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
