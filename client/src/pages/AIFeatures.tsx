import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/Meta";
import { trpc } from "@/lib/trpc";
import { Loader2, Save } from "lucide-react";
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
  const [savingDraft, setSavingDraft] = useState(false);

  const createScriptMutation = trpc.scripts.create.useMutation({
    onSuccess: () => {
      setSavingDraft(false);
      toast.success("脚本已保存为草稿！");
      setTopicIdeas(null);
    },
    onError: () => {
      setSavingDraft(false);
      toast.error("保存失败，请重试");
    },
  });

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

  const handleSaveAsDraft = () => {
    if (!topicIdeas) return;
    setSavingDraft(true);
    
    // 从脑暴内容中提取标题（第一行）
    const lines = topicIdeas.split('\n').filter(l => l.trim());
    const title = lines[0]?.replace(/^#+\s*/, '').substring(0, 100) || '脑暴选题';
    
    createScriptMutation.mutate({
      title,
      content: topicIdeas,
      topicTag: '其他' as const,
      hookType: '其他' as const,
      accountId: '',
      status: '草稿' as const,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="AI 助手"
          description="基于工作台已有数据生成周报、分析规律、脑暴选题"
        />

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList>
            <TabsTrigger value="weekly">周报生成</TabsTrigger>
            <TabsTrigger value="analysis">规律分析</TabsTrigger>
            <TabsTrigger value="ideas">选题脑暴</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4 mt-4">
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm font-medium">周报生成</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      汇总本周发布的脚本与数据表现，生成结构化周报
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleGenerateWeeklyReport}
                    disabled={loadingReport}
                    size="sm"
                    className="shrink-0"
                  >
                    {loadingReport ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        生成中…
                      </>
                    ) : (
                      "生成本周周报"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>

                {weeklyReport ? (
                  <div className="p-5 bg-muted/50 rounded-lg border border-border">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{weeklyReport}</Streamdown>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
                    生成结果将显示在这里
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm font-medium">爆款规律分析</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      分析表现最好的脚本，提取成功的共同规律
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleAnalyzeTopScripts}
                    disabled={loadingAnalysis}
                    size="sm"
                    className="shrink-0"
                  >
                    {loadingAnalysis ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        分析中…
                      </>
                    ) : (
                      "开始分析"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {scriptAnalysis ? (
                  <div className="p-5 bg-muted/50 rounded-lg border border-border">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{scriptAnalysis}</Streamdown>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
                    分析结果将显示在这里
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ideas" className="space-y-4 mt-4">
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm font-medium">选题脑暴</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      结合历史数据与热点，生成 10 个创意选题
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleGenerateTopicIdeas}
                    disabled={loadingIdeas}
                    size="sm"
                    className="shrink-0"
                  >
                    {loadingIdeas ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        脑暴中…
                      </>
                    ) : (
                      "生成选题创意"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {topicIdeas ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-muted/50 rounded-lg border border-border">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <Streamdown>{topicIdeas}</Streamdown>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveAsDraft}
                        disabled={savingDraft}
                        variant="outline"
                        size="sm"
                      >
                        {savingDraft ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            保存中…
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            存为草稿脚本
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
                    选题创意将显示在这里
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="border-t border-border pt-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            周报生成汇总本周脚本、数据与复盘；规律分析提取历史爆款的共性与改进建议；选题脑暴结合已有数据与热点提供创作灵感。生成结果仅供参考，建议结合实际情况使用。
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
