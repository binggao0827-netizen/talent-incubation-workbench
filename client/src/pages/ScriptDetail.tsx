import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { StatStrip, StatusDot, Tag } from "@/components/Meta";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowUpRight, Plus, BarChart3 } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-lg">
        <p className="text-sm text-muted-foreground mb-4">脚本不存在</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/scripts")}>返回脚本库</Button>
      </div>
    );
  }

  const latestMetric = metrics?.[0];
  const engagementRate = latestMetric
    ? (((latestMetric.comments || 0) + (latestMetric.shares || 0)) / (latestMetric.views || 1) * 100).toFixed(2)
    : "0";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/scripts")}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          脚本库
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">{script.title}</h1>
              <StatusDot status={script.status || "草稿"} />
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <Tag>{script.topicTag}</Tag>
              <Tag>{script.hookType}</Tag>
              <span className="font-data text-xs text-muted-foreground ml-1">
                {script.publishDate
                  ? new Date(script.publishDate).toLocaleDateString("zh-CN")
                  : "未发布"}
              </span>
            </div>
          </div>
          {script.videoUrl && (
            <a
              href={script.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border transition-colors duration-150 pt-2"
            >
              查看成片
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Metrics Summary */}
      {latestMetric && (
        <StatStrip
          items={[
            { label: "播放量", value: (latestMetric.views || 0).toLocaleString() },
            { label: "点赞", value: (latestMetric.likes || 0).toLocaleString() },
            { label: "评论", value: (latestMetric.comments || 0).toLocaleString() },
            { label: "涨粉", value: (latestMetric.newFollowers || 0).toLocaleString() },
            { label: "互动率", value: `${engagementRate}%` },
          ]}
        />
      )}

      {/* Script Content */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium">脚本内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">正文</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{script.content}</p>
          </div>
          {script.ending && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">结尾</p>
              <p className="text-sm leading-relaxed">{script.ending}</p>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Metrics Timeline */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium">数据记录</CardTitle>
          <CardDescription className="text-xs mt-1">发布后各阶段的数据表现</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics && metrics.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-4 gap-4 px-4 py-2.5 bg-muted/60 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <span>日期</span>
                <span className="text-right">播放</span>
                <span className="text-right">点赞</span>
                <span className="text-right">涨粉</span>
              </div>
              {metrics.map((metric, idx) => (
                <div
                  key={metric.id}
                  className={`grid grid-cols-4 gap-4 px-4 py-3 text-sm ${idx > 0 ? "border-t border-border" : "border-t border-border"}`}
                >
                  <span className="font-data text-xs text-muted-foreground self-center">
                    {new Date(metric.recordDate).toLocaleDateString("zh-CN")}
                  </span>
                  <span className="font-data text-right">{(metric.views || 0).toLocaleString()}</span>
                  <span className="font-data text-right">{(metric.likes || 0).toLocaleString()}</span>
                  <span className="font-data text-right">{(metric.newFollowers || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border rounded-lg">
              <BarChart3 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground mb-4">还没有数据记录</p>
              <Button onClick={() => setMetricsOpen(true)} variant="outline" size="sm">
                录入数据
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
