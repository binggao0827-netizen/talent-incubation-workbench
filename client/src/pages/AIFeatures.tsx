import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import DashboardLayout from "@/components/DashboardLayout";

export default function AIFeatures() {
  const [weeklyReport, setWeeklyReport] = useState<string | null>(null);
  const [scriptAnalysis, setScriptAnalysis] = useState<string | null>(null);
  const [topicIdeas, setTopicIdeas] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  const generateWeeklyReportMutation = trpc.ai.generateWeeklyReport.useMutation({
    onSuccess: (data) => {
      const content = typeof data.report === 'string' ? data.report : JSON.stringify(data.report);
      setWeeklyReport(content);
      setLoadingReport(false);
      toast.success("周报生成成功！");
    },
    onError: () => {
      setLoadingReport(false);
      toast.error("周报生成失败，请重试");
    },
  });

  const analyzeTopScriptsMutation = trpc.ai.analyzeTopScripts.useMutation({
    onSuccess: (data) => {
      const content = typeof data.analysis === 'string' ? data.analysis : JSON.stringify(data.analysis);
      setScriptAnalysis(content);
      setLoadingAnalysis(false);
      toast.success("规律分析完成！");
    },
    onError: () => {
      setLoadingAnalysis(false);
      toast.error("规律分析失败，请重试");
    },
  });

  const generateTopicIdeasMutation = trpc.ai.generateTopicIdeas.useMutation({
    onSuccess: (data) => {
      const content = typeof data.ideas === 'string' ? data.ideas : JSON.stringify(data.ideas);
      setTopicIdeas(content);
      setLoadingIdeas(false);
      toast.success("选题脑暴完成！");
    },
    onError: () => {
      setLoadingIdeas(false);
      toast.error("选题脑暴失败，请重试");
    },
  });

  const handleGenerateWeeklyReport = () => {
    setLoadingReport(true);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    generateWeeklyReportMutation.mutate({
      weekStart,
      weekEnd,
    });
  };

  const handleAnalyzeTopScripts = () => {
    setLoadingAnalysis(true);
    analyzeTopScriptsMutation.mutate();
  };

  const handleGenerateTopicIdeas = () => {
    setLoadingIdeas(true);
    generateTopicIdeasMutation.mutate({});
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI 智能功能</h1>
          <p className="text-muted-foreground mt-2">
            利用 AI 能力提升内容创作效率，自动生成周报、分析规律、脑暴选题
          </p>
        </div>

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">周报生成</TabsTrigger>
            <TabsTrigger value="analysis">规律分析</TabsTrigger>
            <TabsTrigger value="ideas">选题脑暴</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI 周报生成
                </CardTitle>
                <CardDescription>
                  基于本周发布的脚本和数据表现，AI 自动生成结构化周报
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGenerateWeeklyReport}
                  disabled={loadingReport}
                  className="w-full"
                >
                  {loadingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      生成本周周报
                    </>
                  )}
                </Button>

                {weeklyReport && (
                  <div className="mt-6 p-4 bg-muted rounded-lg border">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{weeklyReport}</Streamdown>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  爆款规律分析
                </CardTitle>
                <CardDescription>
                  分析表现最好的脚本，找出成功的共同规律
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleAnalyzeTopScripts}
                  disabled={loadingAnalysis}
                  className="w-full"
                >
                  {loadingAnalysis ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      开始分析
                    </>
                  )}
                </Button>

                {scriptAnalysis && (
                  <div className="mt-6 p-4 bg-muted rounded-lg border">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{scriptAnalysis}</Streamdown>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ideas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  选题脑暴
                </CardTitle>
                <CardDescription>
                  基于历史数据和当前热点，AI 为你生成 10 个创意选题
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGenerateTopicIdeas}
                  disabled={loadingIdeas}
                  className="w-full"
                >
                  {loadingIdeas ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      脑暴中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      生成选题创意
                    </>
                  )}
                </Button>

                {topicIdeas && (
                  <div className="mt-6 p-4 bg-muted rounded-lg border">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{topicIdeas}</Streamdown>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • <strong>周报生成</strong>：每周自动汇总脚本、数据和复盘，生成结构化周报
            </p>
            <p>
              • <strong>规律分析</strong>：分析过去表现最好的脚本，提取成功规律和改进建议
            </p>
            <p>
              • <strong>选题脑暴</strong>：结合历史数据和热点话题，为下一步创作提供灵感
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
