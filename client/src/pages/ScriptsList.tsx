import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader, StatusDot, Tag } from "@/components/Meta";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";
import { Plus, FileText } from "lucide-react";
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

export default function ScriptsList() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({
    topicTag: "",
    status: "",
    search: "",
  });

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

  const form = useForm<ScriptFormValues>({
    resolver: zodResolver(scriptFormSchema),
    defaultValues: {
      status: "草稿",
    },
  });

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
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新增脚本</DialogTitle>
              <DialogDescription>
                填写脚本信息，系统将为您记录选题、钩子与内容。
              </DialogDescription>
            </DialogHeader>
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
