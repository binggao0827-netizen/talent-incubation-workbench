import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
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

  const statusColors: Record<string, string> = {
    "草稿": "bg-gray-100 text-gray-800",
    "审核": "bg-yellow-100 text-yellow-800",
    "发布": "bg-green-100 text-green-800",
    "归档": "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">脚本库</h1>
          <p className="text-gray-600 mt-2">管理所有脚本，追踪选题与数据表现</p>
        </div>
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
                              {account.name} ({account.platform})
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

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "创建中..." : "创建脚本"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="搜索脚本..."
          className="max-w-xs"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Select value={filters.topicTag || "all"} onValueChange={(value) => setFilters({ ...filters, topicTag: value === "all" ? "" : value })}>
          <SelectTrigger className="w-40">
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
          <SelectTrigger className="w-40">
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
        <div className="space-y-3">
          {scripts.map((script) => (
            <Card
              key={script.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/scripts/${script.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{script.title}</h3>
                    <div className="flex gap-2 flex-wrap mb-3">
                      <Badge variant="outline">{script.topicTag}</Badge>
                      <Badge variant="outline">{script.hookType}</Badge>
                      <Badge className={statusColors[script.status || "草稿"]}>
                        {script.status || "草稿"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{script.content}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500 ml-4">
                    {script.publishDate
                      ? new Date(script.publishDate).toLocaleDateString("zh-CN")
                      : "未发布"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">还没有脚本，点击"新增脚本"开始</p>
            <Button onClick={() => setOpen(true)}>新增脚本</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
