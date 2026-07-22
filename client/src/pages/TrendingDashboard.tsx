import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw, TrendingUp, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

type Platform = "抖音" | "微博" | "快手" | "B站";

const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: "抖音", label: "抖音", color: "bg-black" },
  { value: "微博", label: "微博", color: "bg-red-500" },
  { value: "快手", label: "快手", color: "bg-yellow-500" },
  { value: "B站", label: "B站", color: "bg-blue-500" },
];

export function TrendingDashboard() {
  const { user } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("抖音");
  const [refreshing, setRefreshing] = useState(false);

  // 获取所有平台的热榜数据
  const { data: allPlatformsData, isLoading: isLoadingAll, refetch: refetchAll } = trpc.trending.getAllPlatforms.useQuery({
    limit: 30,
  });

  // 获取单个平台的详细数据
  const { data: platformData, isLoading: isLoadingPlatform } = trpc.trending.getLatest.useQuery({
    platform: selectedPlatform,
    limit: 50,
  });

  // 采集热榜数据的 mutation
  const collectMutation = trpc.trending.collectTrending.useMutation({
    onSuccess: (data) => {
      setRefreshing(false);
      toast.success(`成功采集 ${data.count} 条热榜数据`);
      refetchAll();
    },
    onError: (error) => {
      setRefreshing(false);
      const errorMsg = error.message || "采集热榜数据失败";
      toast.error(errorMsg);
      console.error("Failed to collect trending data:", error);
    },
  });

  // 处理刷新
  const handleRefresh = async () => {
    if (user?.role !== "admin") {
      toast.error("只有管理员可以采集热榜数据");
      return;
    }
    setRefreshing(true);
    try {
      await collectMutation.mutateAsync({ platform: selectedPlatform });
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  // 计算热度排名变化
  const trendingItems = useMemo(() => {
    if (!platformData) return [];
    return platformData.sort((a, b) => a.rank - b.rank);
  }, [platformData]);

  // 获取热度最高的项目
  const topItems = useMemo(() => {
    if (!allPlatformsData) {
      return {
        "抖音": [],
        "微博": [],
        "快手": [],
        "B站": [],
      };
    }
    const result: Record<Platform, any[]> = {
      "抖音": [],
      "微博": [],
      "快手": [],
      "B站": [],
    };
    Object.entries(allPlatformsData).forEach(([platform, items]) => {
      result[platform as Platform] = (items as any[]).slice(0, 5);
    });
    return result;
  }, [allPlatformsData]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">热榜看板</h1>
          <p className="text-muted-foreground mt-2">实时追踪多平台热点话题，助力内容选题</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || collectMutation.isPending || user?.role !== "admin"}
          size="lg"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "刷新中..." : "刷新数据"}
        </Button>
      </div>

      {/* 权限提示 */}
      {user?.role !== "admin" && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            您没有采集权限。只有管理员可以手动采集热榜数据。系统会定期自动采集。
          </AlertDescription>
        </Alert>
      )}

      {/* 错误提示 */}
      {collectMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {collectMutation.error?.message || "获取热榜数据失败，请稍后重试"}
          </AlertDescription>
        </Alert>
      )}

      {/* 平台概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORMS.map((platform) => (
          <Card
            key={platform.value}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedPlatform(platform.value)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{platform.label}</CardTitle>
                <div className={`w-3 h-3 rounded-full ${platform.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold">
                  {topItems[platform.value]?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">热点话题数</div>
                <div className="space-y-1">
                  {topItems[platform.value]?.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="text-xs truncate text-muted-foreground">
                      {idx + 1}. {item.title}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 详细热榜列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {PLATFORMS.find((p) => p.value === selectedPlatform)?.label} 热榜
              </CardTitle>
              <CardDescription>
                实时热点排行榜，更新于 {new Date().toLocaleTimeString("zh-CN")}
              </CardDescription>
            </div>
            <Tabs defaultValue={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as Platform)}>
              <TabsList>
                {PLATFORMS.map((platform) => (
                  <TabsTrigger key={platform.value} value={platform.value}>
                    {platform.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPlatform ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : trendingItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">暂无热榜数据，请点击"刷新数据"获取最新信息</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trendingItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  {/* 排名 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                    {item.rank}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate hover:text-clip">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {item.category && (
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        热度: {item.hotValue}
                      </span>
                    </div>
                  </div>

                  {/* 热度指示 */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1 text-sm font-semibold text-orange-500">
                      <TrendingUp className="w-4 h-4" />
                      {item.hotValue}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.collectedAt).toLocaleTimeString("zh-CN")}
                    </p>
                  </div>

                  {/* 链接 */}
                  {item.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="flex-shrink-0"
                    >
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        查看
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 热榜历史 */}
      <Card>
        <CardHeader>
          <CardTitle>热榜趋势</CardTitle>
          <CardDescription>
            查看过去 7 天的热榜变化趋势
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>趋势分析功能即将上线，敬请期待...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
