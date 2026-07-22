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
import { Plus, FileText, Upload, AlertCircle, CheckCircle } from "lucide-react";
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
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    totalScripts: number;
    createdScripts: number;
  } | null>(null);
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
  const batchImportMutation = trpc.feishu.batchImportScripts.useMutation();

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
    setImportResult(null);
  };

  // Handle batch import (one-click import all scripts)
  const handleBatchImport = async () => {
    if (!selectedFile || !documentTitle.trim() || !uploadAccountId) {
      toast.error("请选择文件、输入文档标题并选择账号");
      return;
    }

    setIsImporting(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Content = (e.target?.result as string).split(",")[1] || "";
          const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase() as "md" | "txt" | "docx";

          const result = await batchImportMutation.mutateAsync({
            content: base64Content,
            fileName: selectedFile.name,
            fileType: fileExtension,
            documentTitle: documentTitle,
            accountId: uploadAccountId,
            topicTag: "其他",
            hookType: "其他",
          });

          if (result.success && result.createdScripts > 0) {
            setImportResult({
              success: true,
              totalScripts: result.totalScripts,
              createdScripts: result.createdScripts,
            });
            toast.success(`成功导入 ${result.createdScripts} 个脚本`);
            
            // Reset form after successful import
            setTimeout(() => {
              setSelectedFile(null);
              setDocumentTitle("");
              setUploadAccountId("");
              setImportResult(null);
              setOpen(false);
              refetch();
            }, 1500);
          } else {
            toast.error("未能导入任何脚本");
          }
        } catch (error) {
          console.error("Import error:", error);
          toast.error("导入脚本失败，请检查文件格式");
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("File read error:", error);
      toast.error("读取文件失败");
      setIsImporting(false);
    }
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

                <FormField
                  control={form.control}
                  name="topicTag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>内容类型</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择内容类型" />
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
                            <SelectValue placeholder="选择钩子类型" />
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

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>脚本内容</FormLabel>
                      <FormControl>
                        <Textarea placeholder="输入脚本内容" className="min-h-[200px]" {...field} />
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
                      <FormLabel>结尾（可选）</FormLabel>
                      <FormControl>
                        <Textarea placeholder="输入脚本结尾" className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "创建中…" : "创建脚本"}
                </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Local Upload Tab - Batch Import */}
              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-4">
                  {/* Account Selection */}
                  <div>
                    <Label htmlFor="upload-account">关联账号 *</Label>
                    <Select value={uploadAccountId} onValueChange={setUploadAccountId}>
                      <SelectTrigger id="upload-account" className="mt-1">
                        <SelectValue placeholder="选择账号" />
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
                      所有导入的脚本都将关联到此账号
                    </p>
                  </div>

                  {/* Document Title Input */}
                  <div>
                    <Label htmlFor="doc-title">文档标题（用于提取月份）*</Label>
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
                    <Label htmlFor="file-input">选择文件 *</Label>
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

                  {/* Import Success Message */}
                  {importResult?.success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">导入成功！</p>
                        <p className="text-sm text-green-800 mt-1">
                          成功导入 {importResult.createdScripts} 个脚本（共 {importResult.totalScripts} 个）
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Import Button */}
                  <Button
                    onClick={handleBatchImport}
                    disabled={!selectedFile || !documentTitle.trim() || !uploadAccountId || isImporting || batchImportMutation.isPending}
                    className="w-full"
                  >
                    {isImporting || batchImportMutation.isPending ? "导入中…" : "一键导入所有脚本"}
                  </Button>

                  {/* Info Message */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800">
                      系统将自动解析文档中的所有脚本并直接导入。脚本内容会保留源文档的排版格式（Markdown）。
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
        }
      />

      {/* Scripts List */}
      <Card>
        <CardHeader>
          <CardTitle>脚本列表</CardTitle>
          <CardDescription>
            {scripts?.length || 0} 个脚本
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : scripts && scripts.length > 0 ? (
            <div className="space-y-4">
              {scripts.map((script) => (
                <Card key={script.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/scripts/${script.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-base">{script.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{script.content}</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {script.topicTag && <Tag>{script.topicTag}</Tag>}
                          {script.hookType && <Tag>{script.hookType}</Tag>}
                          {script.status && <StatusDot status={script.status} />}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground flex-shrink-0">
                        <p className="text-xs mt-1">{new Date(script.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">暂无脚本</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
