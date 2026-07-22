import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader, StatusDot, Tag } from "@/components/Meta";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { Plus, FileText, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const scriptFormSchema = z.object({
  accountId: z.string().min(1, "请选择账号"),
  title: z.string().min(1, "脚本标题不能为空"),
  topicTag: z.enum(["剧情", "测评", "教程", "种草", "搞笑", "知识", "其他"]),
  hookType: z.enum(["提问式", "悬念式", "痛点式", "反转式", "数据式", "其他"]),
  content: z.string().min(1, "脚本内容不能为空"),
  ending: z.string().optional(),
  publishDate: z.string().optional(),
  videoUrl: z.string().optional(),
  creator: z.string().optional(),
  status: z.enum(["草稿", "审核", "发布", "归档"]).optional(),
});

type ScriptFormValues = z.infer<typeof scriptFormSchema>;

interface ParsedScript {
  scriptId: string;
  title: string;
  content: string;
  contentType?: string;
}

export default function ScriptsList() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [filters, setFilters] = useState({
    topicTag: "",
    status: "",
    search: "",
  });
  
  // Local upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [uploadAccountId, setUploadAccountId] = useState("");
  const [parsedScripts, setParsedScripts] = useState<ParsedScript[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [selectedScriptIndex, setSelectedScriptIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: scripts, isLoading, refetch } = trpc.scripts.list.useQuery(
    filters.topicTag || filters.status || filters.search
      ? {
          topicTag: filters.topicTag || undefined,
          status: filters.status || undefined,
          search: filters.search || undefined,
        }
      : {}
  );

  const { data: accounts } = trpc.accounts.list.useQuery({});
  const createMutation = trpc.scripts.create.useMutation();
  const parseDocumentMutation = trpc.feishu.parseLocalDocument.useMutation();

  const form = useForm<ScriptFormValues>({
    resolver: zodResolver(scriptFormSchema),
    defaultValues: {
      status: "草稿",
    },
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [".md", ".txt", ".docx"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      toast.error("仅支持 .md、.txt、.docx 格式");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件大小不能超过 10MB");
      return;
    }

    setSelectedFile(file);
  };

  // Handle file upload and parsing
  const handleUploadAndParse = async () => {
    if (!selectedFile || !documentTitle.trim()) {
      toast.error("请选择文件并输入文档标题");
      return;
    }

    setIsParsingFile(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Content = (e.target?.result as string).split(",")[1] || "";
          const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase() as "md" | "txt" | "docx";

          const result = await parseDocumentMutation.mutateAsync({
            content: base64Content,
            fileName: selectedFile.name,
            fileType: fileExtension,
            documentTitle: documentTitle,
          });

          if (result.scripts && result.scripts.length > 0) {
            setParsedScripts(result.scripts);
            setSelectedScriptIndex(0);
            toast.success(`成功解析 ${result.scripts.length} 个脚本`);
          } else {
            toast.error("未能从文档中解析出脚本");
          }
        } catch (error) {
          console.error("Parse error:", error);
          toast.error("解析文档失败，请检查文件格式");
        } finally {
          setIsParsingFile(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("File read error:", error);
      toast.error("读取文件失败");
      setIsParsingFile(false);
    }
  };

  // Fill form with selected script
  const handleSelectScript = (script: ParsedScript) => {
    form.setValue("title", script.title);
    form.setValue("content", script.content);
    if (uploadAccountId) {
      form.setValue("accountId", uploadAccountId);
    }
    setActiveTab("manual");
    toast.success("已填充脚本信息，请完成其他字段后提交");
  };

  const onSubmit = async (data: ScriptFormValues) => {
    try {
      const submitData = {
        ...data,
        publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
      };
      await createMutation.mutateAsync(submitData as any);
      toast.success("脚本创建成功");
      form.reset();
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("创建失败，请重试");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="脚本库"
        description="管理脚本，追踪选题与数据表现"
        actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              新增脚本
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新增脚本</DialogTitle>
              <DialogDescription>
                手动创建或从本地文档导入脚本信息。
              </DialogDescription>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">手动创建</TabsTrigger>
                <TabsTrigger value="upload">本地上传</TabsTrigger>
              </TabsList>

              {/* Manual Creation Tab */}
              <TabsContent value="manual" className="space-y-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>关联账号</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择账号" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.accountName} ({account.platform})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>脚本标题</FormLabel>
                      <FormControl>
                        <Input placeholder="输入脚本标题" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="topicTag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>选题标签</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择标签" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="剧情">剧情</SelectItem>
                            <SelectItem value="测评">测评</SelectItem>
                            <SelectItem value="教程">教程</SelectItem>
                            <SelectItem value="种草">种草</SelectItem>
                            <SelectItem value="搞笑">搞笑</SelectItem>
                            <SelectItem value="知识">知识</SelectItem>
                            <SelectItem value="其他">其他</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hookType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>钩子类型</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择钩子" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="提问式">提问式</SelectItem>
                            <SelectItem value="悬念式">悬念式</SelectItem>
                            <SelectItem value="痛点式">痛点式</SelectItem>
                            <SelectItem value="反转式">反转式</SelectItem>
                            <SelectItem value="数据式">数据式</SelectItem>
                            <SelectItem value="其他">其他</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>脚本正文</FormLabel>
                      <FormControl>
                        <Textarea placeholder="输入脚本内容" className="min-h-24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ending"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>脚本结尾（可选）</FormLabel>
                      <FormControl>
                        <Input placeholder="输入脚本结尾" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "创建中…" : "创建脚本"}
                    </Button>
                  </div>
                </form>
              </Form>
              </TabsContent>

              {/* Local Upload Tab */}
              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-4">
                  {/* Account Selection */}
                  <div>
                    <Label htmlFor="upload-account">关联账号</Label>
                    <Select value={uploadAccountId} onValueChange={setUploadAccountId}>
                      <SelectTrigger id="upload-account" className="mt-1">
                        <SelectValue placeholder="选择账号（可选）" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.accountName} ({account.platform})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      选择一个账号，解析后的脚本将自动关联此账号
                    </p>
                  </div>

                  {/* Document Title Input */}
                  <div>
                    <Label htmlFor="doc-title">文档标题（用于提取月份）</Label>
                    <Input
                      id="doc-title"
                      placeholder="例如：2026年5月脚本、5月"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      标题中需要包含月份信息（如"5月"或"2026年5月"），系统将自动提取用于脚本编号
                    </p>
                  </div>

                  {/* File Upload Area */}
                  <div>
                    <Label htmlFor="file-input">选择文件</Label>
                    <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="file-input"
                        accept=".md,.txt,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm font-medium">
                        {selectedFile ? selectedFile.name : "点击选择或拖拽文件"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        支持 .md、.txt、.docx 格式，文件大小不超过 10MB
                      </p>
                    </div>
                  </div>

                  {/* Parse Button */}
                  <Button
                    onClick={handleUploadAndParse}
                    disabled={!selectedFile || !documentTitle.trim() || isParsingFile || parseDocumentMutation.isPending}
                    className="w-full"
                  >
                    {isParsingFile || parseDocumentMutation.isPending ? "解析中…" : "解析文档"}
                  </Button>

                  {/* Parsed Scripts List */}
                  {parsedScripts.length > 0 && (
                    <div className="space-y-2">
                      <Label>解析结果（{parsedScripts.length} 个脚本）</Label>
                      <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                        {parsedScripts.map((script, idx) => (
                          <div
                            key={idx}
                            className={`p-3 border-b border-border last:border-b-0 cursor-pointer transition-colors ${
                              selectedScriptIndex === idx
                                ? "bg-accent/20 border-l-2 border-l-accent"
                                : "hover:bg-accent/10"
                            }`}
                            onClick={() => {
                              setSelectedScriptIndex(idx);
                              handleSelectScript(script);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{script.scriptId}: {script.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{script.content}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectScript(script);
                                }}
                              >
                                使用
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {parseDocumentMutation.isError && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-destructive">解析失败</p>
                        <p className="text-xs text-destructive/80 mt-0.5">
                          {(parseDocumentMutation.error as any)?.message || "请检查文件格式是否正确"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="搜索脚本…"
          className="max-w-xs h-9"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Select value={filters.topicTag || "all"} onValueChange={(value) => setFilters({ ...filters, topicTag: value === "all" ? "" : value })}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="选题标签" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部标签</SelectItem>
            <SelectItem value="剧情">剧情</SelectItem>
            <SelectItem value="测评">测评</SelectItem>
            <SelectItem value="教程">教程</SelectItem>
            <SelectItem value="种草">种草</SelectItem>
            <SelectItem value="搞笑">搞笑</SelectItem>
            <SelectItem value="知识">知识</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status || "all"} onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? "" : value })}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="脚本状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="草稿">草稿</SelectItem>
            <SelectItem value="审核">审核</SelectItem>
            <SelectItem value="发布">发布</SelectItem>
            <SelectItem value="归档">归档</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scripts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : scripts && scripts.length > 0 ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {scripts.map((script, idx) => (
            <div
              key={script.id}
              className={`cursor-pointer px-5 py-4 hover:bg-accent/60 transition-colors duration-150 group ${
                idx > 0 ? "border-t border-border" : ""
              }`}
              onClick={() => navigate(`/scripts/${script.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm font-medium group-hover:underline underline-offset-4 decoration-border">
                      {script.title}
                    </h3>
                    <StatusDot status={script.status || "草稿"} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Tag>{script.topicTag}</Tag>
                    <Tag>{script.hookType}</Tag>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-2">{script.content}</p>
                </div>
                <span className="font-data text-xs text-muted-foreground shrink-0 pt-0.5">
                  {script.publishDate
                    ? new Date(script.publishDate).toLocaleDateString("zh-CN")
                    : "未发布"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground mb-4">还没有脚本，点击“新增脚本”开始</p>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>新增脚本</Button>
        </div>
      )}
    </div>
  );
}
