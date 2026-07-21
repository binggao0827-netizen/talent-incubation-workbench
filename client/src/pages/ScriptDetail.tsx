import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, BarChart3 } from "lucide-react";
import { useState } from "react";
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

const metricsFormSchema = z.object({
  views: z.number().optional(),
  likes: z.number().optional(),
  comments: z.number().optional(),
  shares: z.number().optional(),
  newFollowers: z.number().optional(),
  completionRate: z.string().optional(),
  recordDate: z.string(),
});

type MetricsFormValues = z.infer<typeof metricsFormSchema>;

interface ScriptDetailProps {
  scriptId: string;
}

export default function ScriptDetail({ scriptId }: ScriptDetailProps) {
  const [, navigate] = useLocation();
  const [metricsOpen, setMetricsOpen] = useState(false);

  const { data: script, isLoading } = trpc.scripts.getById.useQuery(scriptId);
  const { data: metrics, refetch: refetchMetrics } = trpc.metrics.getByScriptId.useQuery(scriptId);
  const createMetricsMutation = trpc.metrics.create.useMutation();

  const form = useForm<MetricsFormValues>({
    resolver: zodResolver(metricsFormSchema),
    defaultValues: {
      recordDate: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: MetricsFormValues) => {
    try {
      await createMetricsMutation.mutateAsync({
        scriptId,
        ...data,
        recordDate: new Date(data.recordDate),
      } as any);
      toast.success("数据录入成功");
      form.reset();
      setMetricsOpen(false);
      refetchMetrics();
    } catch (error) {
      toast.error("录入失败，请重试");
    }
  };

  const statusColors: Record<string, string> = {
    "草稿": "bg-gray-100 text-gray-800",
    "审核": "bg-yellow-100 text-yellow-800",
    "发布": "bg-green-100 text-green-800",
    "归档": "bg-gray-100 text-gray-800",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">脚本不存在</p>
        <Button onClick={() => navigate("/scripts")}>返回脚本列表</Button>
      </div>
    );
  }

  const latestMetric = metrics?.[0];
  const engagementRate = latestMetric
    ? (((latestMetric.comments || 0) + (latestMetric.shares || 0)) / (latestMetric.views || 1) * 100).toFixed(2)
    : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/scripts")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{script.title}</h1>
          <p className="text-gray-600 mt-1">
            {script.publishDate
              ? new Date(script.publishDate).toLocaleDateString("zh-CN")
              : "未发布"}
          </p>
        </div>
        <Badge className={statusColors[script.status || "草稿"]}>
          {script.status || "草稿"}
        </Badge>
      </div>

      {/* Script Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>脚本内容</CardTitle>
              <CardDescription>选题标签：{script.topicTag} · 钩子类型：{script.hookType}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-gray-600">正文</Label>
            <p className="mt-2 text-gray-800 whitespace-pre-wrap">{script.content}</p>
          </div>
          {script.ending && (
            <div>
              <Label className="text-sm text-gray-600">结尾</Label>
              <p className="mt-2 text-gray-800">{script.ending}</p>
            </div>
          )}
          {script.videoUrl && (
            <div>
              <Label className="text-sm text-gray-600">成片链接</Label>
              <a
                href={script.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                查看视频
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics Summary */}
      {latestMetric && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">播放量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(latestMetric.views || 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">点赞</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(latestMetric.likes || 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">评论</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(latestMetric.comments || 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">涨粉</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(latestMetric.newFollowers || 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">互动率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{engagementRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Metrics Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>数据记录</CardTitle>
            <CardDescription>脚本发布后的各阶段数据表现</CardDescription>
          </div>
          <Dialog open={metricsOpen} onOpenChange={setMetricsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                录入数据
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>录入数据反馈</DialogTitle>
                <DialogDescription>
                  记录该脚本的发布后数据表现
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="recordDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>数据日期</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="views"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>播放量</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="likes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>点赞</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>评论</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shares"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>转发</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newFollowers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>涨粉</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="completionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>完播率 (%)</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={createMetricsMutation.isPending}>
                    {createMetricsMutation.isPending ? "录入中..." : "确认录入"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {metrics && metrics.length > 0 ? (
            <div className="space-y-3">
              {metrics.map((metric, idx) => (
                <div
                  key={metric.id}
                  className="flex items-start justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      第 {idx + 1} 次录入 · {new Date(metric.recordDate).toLocaleDateString("zh-CN")}
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                      <div>播放：{(metric.views || 0).toLocaleString()}</div>
                      <div>点赞：{(metric.likes || 0).toLocaleString()}</div>
                      <div>涨粉：{(metric.newFollowers || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">还没有数据记录</p>
              <Button onClick={() => setMetricsOpen(true)} size="sm">
                录入数据
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
