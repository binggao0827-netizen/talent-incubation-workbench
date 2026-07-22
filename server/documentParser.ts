import { readFile } from "fs/promises";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import * as mammoth from "mammoth";

export interface ParsedScript {
  scriptId: string; // Format: MM-NN (e.g., 05-01)
  title: string;
  content: string;
  contentType?: string;
}

/**
 * Extract month from document title
 * Matches: "5月", "2026年7月", "2026年5月脚本"
 */
function extractMonth(title: string): string {
  const monthMatch = title.match(/(\d{1,2})月|(\d{4})年(\d{1,2})月/);
  if (monthMatch) {
    const month = monthMatch[1] || monthMatch[3];
    return String(month).padStart(2, "0");
  }
  return "00";
}

/**
 * Extract scripts from text content
 * Matches: "选题一：《标题》", "选题二《标题》", "选题三：标题"
 * 
 * Preserves Markdown formatting:
 * - Headers (##, ###, etc.)
 * - Lists (-, *, +)
 * - Bold, italic, code
 * - Line breaks and paragraphs
 */
function extractScripts(content: string, monthPrefix: string): ParsedScript[] {
  const scripts: ParsedScript[] = [];
  
  // Split by script markers: 选题一、选题二、etc.
  // This pattern matches the script title line
  const scriptPattern = /选题[一二三四五六七八九十]+：?《?(.+?)》?(?=\n|选题|$)/g;
  let match;
  let scriptIndex = 1;

  while ((match = scriptPattern.exec(content)) !== null) {
    const title = match[1].trim();
    
    // Find content for this script (from current position to next script or end)
    const currentPos = match.index + match[0].length;
    const nextScriptMatch = /选题[一二三四五六七八九十]+/.exec(content.substring(currentPos));
    const contentEnd = nextScriptMatch ? currentPos + nextScriptMatch.index : content.length;
    
    let scriptContent = content.substring(currentPos, contentEnd).trim();
    
    // Preserve formatting: keep line breaks, indentation, and Markdown syntax
    // Remove leading/trailing empty lines but keep internal structure
    scriptContent = scriptContent
      .split('\n')
      .map(line => line.trimEnd()) // Remove trailing spaces but keep leading
      .join('\n')
      .replace(/^\n+/, '') // Remove leading empty lines
      .replace(/\n+$/, ''); // Remove trailing empty lines

    scripts.push({
      scriptId: `${monthPrefix}-${String(scriptIndex).padStart(2, "0")}`,
      title,
      content: scriptContent || "（内容待补充）",
    });

    scriptIndex++;
  }

  return scripts;
}

/**
 * Parse Markdown content
 * Preserves formatting: headers, lists, bold, italic, code, etc.
 */
export async function parseMarkdown(content: string, documentTitle: string): Promise<ParsedScript[]> {
  const monthPrefix = extractMonth(documentTitle);
  return extractScripts(content, monthPrefix);
}

/**
 * Parse plain text content
 * Preserves line breaks and structure
 */
export async function parseText(content: string, documentTitle: string): Promise<ParsedScript[]> {
  const monthPrefix = extractMonth(documentTitle);
  return extractScripts(content, monthPrefix);
}

/**
 * Parse DOCX content
 * Extracts text while preserving structure and line breaks
 */
export async function parseDocx(buffer: Buffer, documentTitle: string): Promise<ParsedScript[]> {
  try {
    // Use extractRawText to get text content
    // This preserves line breaks and structure
    const result = await mammoth.extractRawText({ buffer });
    const monthPrefix = extractMonth(documentTitle);
    return extractScripts(result.value, monthPrefix);
  } catch (error) {
    console.error("Failed to parse DOCX:", error);
    throw new Error("Failed to parse DOCX file");
  }
}

/**
 * Main parser function - dispatches to appropriate parser based on file type
 */
export async function parseDocument(
  fileContent: string, // base64 encoded
  fileType: "md" | "txt" | "docx",
  documentTitle: string
): Promise<ParsedScript[]> {
  try {
    // Decode base64
    const buffer = Buffer.from(fileContent, "base64");

    switch (fileType) {
      case "md":
      case "txt":
        return await parseMarkdown(buffer.toString("utf-8"), documentTitle);
      case "docx":
        return await parseDocx(buffer, documentTitle);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error("Document parsing error:", error);
    throw error;
  }
}
