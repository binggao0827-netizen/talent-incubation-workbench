import { describe, expect, it } from "vitest";
import { parseDocument } from "./documentParser";

describe("batch import functionality", () => {
  it("should parse markdown with preserved formatting", async () => {
    const content = `# 5月脚本

选题一：**这是一个加粗的标题**
这是脚本内容
- 列表项1
- 列表项2

选题二：《另一个脚本》
这是第二个脚本的内容
包含多行文本
`;

    const base64Content = Buffer.from(content).toString("base64");
    const scripts = await parseDocument(base64Content, "md", "5月脚本");

    expect(scripts).toHaveLength(2);
    expect(scripts[0]).toEqual({
      scriptId: "05-01",
      title: "**这是一个加粗的标题**",
      content: expect.stringContaining("这是脚本内容"),
    });
    expect(scripts[1]).toEqual({
      scriptId: "05-02",
      title: "另一个脚本",
      content: expect.stringContaining("这是第二个脚本的内容"),
    });
  });

  it("should preserve line breaks and indentation", async () => {
    const content = `选题一：标题一
第一行内容
  缩进的内容
第三行内容

选题二：标题二
另一个脚本`;

    const base64Content = Buffer.from(content).toString("base64");
    const scripts = await parseDocument(base64Content, "md", "5月");

    expect(scripts).toHaveLength(2);
    // Check that line breaks are preserved
    expect(scripts[0].content).toContain("\n");
    expect(scripts[0].content).toContain("缩进的内容");
  });

  it("should extract month from various formats", async () => {
    const testCases = [
      { title: "5月脚本", expectedMonth: "05" },
      { title: "2026年5月", expectedMonth: "05" },
      { title: "12月脚本库", expectedMonth: "12" },
      { title: "2026年12月脚本", expectedMonth: "12" },
    ];

    for (const testCase of testCases) {
      const content = `选题一：测试\n内容`;
      const base64Content = Buffer.from(content).toString("base64");
      const scripts = await parseDocument(base64Content, "md", testCase.title);

      expect(scripts[0].scriptId).toBe(`${testCase.expectedMonth}-01`);
    }
  });

  it("should handle empty content gracefully", async () => {
    const content = `选题一：标题
`;

    const base64Content = Buffer.from(content).toString("base64");
    const scripts = await parseDocument(base64Content, "md", "5月");

    expect(scripts).toHaveLength(1);
    expect(scripts[0].content).toBe("（内容待补充）");
  });

  it("should support multiple scripts in one document", async () => {
    const content = `5月脚本库

选题一：《开箱评测》
这是一个开箱评测脚本
- 产品介绍
- 使用体验
- 总体评价

选题二：《生活技巧》
这是一个生活技巧脚本
1. 第一个技巧
2. 第二个技巧

选题三：《故事分享》
这是一个故事分享脚本
讲述一个有趣的故事...

选题四：《知识科普》
这是一个知识科普脚本
科学知识介绍`;

    const base64Content = Buffer.from(content).toString("base64");
    const scripts = await parseDocument(base64Content, "md", "5月脚本库");

    expect(scripts).toHaveLength(4);
    expect(scripts[0].scriptId).toBe("05-01");
    expect(scripts[1].scriptId).toBe("05-02");
    expect(scripts[2].scriptId).toBe("05-03");
    expect(scripts[3].scriptId).toBe("05-04");

    // Verify titles
    expect(scripts[0].title).toBe("开箱评测");
    expect(scripts[1].title).toBe("生活技巧");
    expect(scripts[2].title).toBe("故事分享");
    expect(scripts[3].title).toBe("知识科普");

    // Verify content preservation
    expect(scripts[0].content).toContain("- 产品介绍");
    expect(scripts[1].content).toContain("1. 第一个技巧");
  });

  it("should not include markdown headers in script content", async () => {
    const content = `# 5月脚本库
## 选题一：《美容护肤的常见误区》
这是一个关于美容护肤的脚本内容。
- 误区一：过度清洁
- 误区二：忽视防晒
- 误区三：频繁更换产品
## 选题二：《医美项目对比分析》
医美项目的详细对比内容。
1. 项目A的特点
2. 项目B的优势
3. 项目C的适用人群
## 选题三：《皮肤问题解决方案》
针对不同皮肤问题的解决方案。
**重点内容：**
- 敏感肌护理
- 痘痘肌治疗
- 衰老肌抗衰`;

    const base64Content = Buffer.from(content).toString("base64");
    const scripts = await parseDocument(base64Content, "md", "5月脚本库");

    expect(scripts).toHaveLength(3);
    
    // Verify that script content does NOT contain trailing ## markers
    expect(scripts[0].content).not.toContain("##");
    expect(scripts[1].content).not.toContain("##");
    expect(scripts[2].content).not.toContain("##");
    
    // Verify that content is preserved correctly
    expect(scripts[0].content).toContain("- 误区一：过度清洁");
    expect(scripts[1].content).toContain("1. 项目A的特点");
    expect(scripts[2].content).toContain("- 敏感肌护理");
  });
});
