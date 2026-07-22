import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { AlertCircle, RefreshCw, TrendingUp, Lock, Search, ArrowUpDown, X, Filter, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

type Platform = "抖音" | "微博" | "快手" | "B站";

const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: "抖音", label: "抖音", color: "bg-black" },
  { value: "微博", label: "微博", color: "bg-red-500" },
  { value: "快手", label: "快手", color: "bg-yellow-500" },
  { value: "B站", label: "B站", color: "bg-blue-500" },
];

// 平台热榜链接
const PLATFORM_URLS: Record<Platform, string> = {
  "抖音": "https://www.douyin.com/search?keyword=%s&type=general",
  "微博": "https://s.weibo.com/weibo?q=%s",
  "快手": "https://www.kuaishou.com/search?keyword=%s",
  "B站": "https://search.bilibili.com/all?keyword=%s",
};

export function TrendingDashboard() {
  const { user } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("抖音");
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "heat">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minHeat, setMinHeat] = useState<number | null>(null);

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
      toast.error(error.message || "采集失败");
    },
  });

  const handleCollect = async () => {
    if (!user || user.role !== "admin") {
      toast.error("只有管理员可以采集数据");
      return;
    }
    setRefreshing(true);
    await collectMutation.mutateAsync({ platform: selectedPlatform });
  };

  // 获取当前平台的数据
  const currentData = platformData || [];
  
  // 调试：输出数据中是否包含 imageUrl
  if (currentData.length > 0 && currentData[0]) {
    console.log('First item data:', currentData[0]);
  }

  // 获取所有分类
  const allCategories = Array.from(
    new Set(currentData.map((item: any) => item.category).filter(Boolean))
  );

  // 过滤和排序数据
  let filteredData = currentData.filter((item: any) => {
    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesHeat = !minHeat || item.hotValue >= minHeat;

    return matchesSearch && matchesCategory && matchesHeat;
  });

  // 排序
  filteredData = [...filteredData].sort((a: any, b: any) => {
    let aVal = sortBy === "rank" ? a.rank : a.hotValue;
    let bVal = sortBy === "rank" ? b.rank : b.hotValue;

    if (sortOrder === "asc") {
      return aVal - bVal;
    } else {
      return bVal - aVal;
    }
  });

  // 权限检查
  if (!user) {
    return (
      <div className="space-y-4">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>请先登录查看热榜数据</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="space-y-4">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>只有管理员可以查看热榜看板</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isLoading = isLoadingAll || isLoadingPlatform;

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">热榜看板</h1>
          <p className="text-muted-foreground mt-2">实时追踪多平台热点话题，助力内容选题</p>
        </div>
        {user?.role === "admin" && (
          <Button
            onClick={handleCollect}
            disabled={refreshing || collectMutation.isPending}
            size="lg"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "采集中..." : "刷新数据"}
          </Button>
        )}
      </div>

      {/* 平台概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORMS.map((platform) => {
          const count = allPlatformsData?.[platform.value]?.length || 0;
          return (
            <Card key={platform.value}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{platform.label}</p>
                    <p className="text-2xl font-bold mt-2">{count}</p>
                    <p className="text-xs text-muted-foreground mt-1">热点话题数</p>
                  </div>
                  <div className={`${platform.color} rounded-lg p-3`}>
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 热榜列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedPlatform}热榜</CardTitle>
              <CardDescription>
                实时热点话题排行，共 {filteredData.length} 条，更新于 {new Date().toLocaleTimeString('zh-CN')}
              </CardDescription>
            </div>
            <Tabs value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as Platform)}>
              <TabsList>
                {PLATFORMS.map((p) => (
                  <TabsTrigger key={p.value} value={p.value}>
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 搜索和筛选 */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索标题、描述、分类..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
                title={`按${sortBy === "rank" ? "排名" : "热度"}${sortOrder === "asc" ? "升序" : "降序"}`}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              {(searchQuery || selectedCategory || minHeat) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory(null);
                    setMinHeat(null);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  重置筛选
                </Button>
              )}
            </div>

            {/* 高级筛选 */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">分类:</span>
              </div>
              {allCategories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedCategory(selectedCategory === category ? null : category)
                  }
                >
                  {category}
                </Badge>
              ))}
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-muted-foreground">最低热度:</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={minHeat || ""}
                  onChange={(e) => setMinHeat(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          {/* 热榜列表 - 卡片式表格 */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">没有找到匹配的热榜数据</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* 表头 - 梁面不显示 */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted rounded-lg font-semibold text-sm">
                <div className="col-span-1">排名</div>
                <div className="col-span-1">封面</div>
                <div className="col-span-5">炭点标题</div>
                <div className="col-span-2">炭度</div>
                <div className="col-span-2">视频数</div>
                <div className="col-span-1">操作</div>
              </div>

              {/* 数据行 - 梁面表格布局 */}
              {filteredData.map((item: any, index: number) => (
                <div key={item.id} className="space-y-2">
                  <a
                    href={PLATFORM_URLS[selectedPlatform].replace("%s", encodeURIComponent(item.title))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-card border rounded-lg hover:bg-accent transition-colors items-center cursor-pointer"
                  >
                  {/* 排名 */}
                  <div className="col-span-1">
                    <div className="flex items-center justify-center">
                      <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white font-bold text-lg w-8 h-8 rounded-full flex items-center justify-center">
                        {item.rank}
                      </div>
                    </div>
                  </div>

                  {/* 封面 */}
                  <div className="col-span-1">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* 标题和分类 */}
                  <div className="col-span-5">
                    <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                    {item.category && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {item.category}
                      </Badge>
                    )}
                  </div>

                  {/* 热度 */}
                  <div className="col-span-2">
                    <div className="text-right">
                      <p className="font-bold text-pink-500">
                        {item.hotValue > 1000000
                          ? (item.hotValue / 1000000).toFixed(1) + "M"
                          : item.hotValue > 1000
                          ? (item.hotValue / 1000).toFixed(1) + "K"
                          : item.hotValue}
                      </p>
                    </div>
                  </div>

                  {/* 视频数 */}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground text-center">-</p>
                  </div>

                  {/* 操作 */}
                  <div className="col-span-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.preventDefault();
                        const url = PLATFORM_URLS[selectedPlatform].replace("%s", encodeURIComponent(item.title));
                        window.open(url, "_blank");
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  </a>

                  {/* 移动端卡片 */}
                  <a
                    href={PLATFORM_URLS[selectedPlatform].replace("%s", encodeURIComponent(item.title))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="md:hidden bg-card border rounded-lg p-4 space-y-3 block hover:bg-accent transition-colors"
                  >
                  <div className="flex items-start gap-3">
                    {/* 排名 */}
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white font-bold text-lg w-8 h-8 rounded-full flex items-center justify-center">
                        {item.rank}
                      </div>
                    </div>
                    {/* 封面 */}
                    <div className="flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-12 h-12 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {/* 标题和炭度 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2 hover:text-pink-500 transition-colors">
                        {item.title}
                      </p>
                      {item.category && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {item.category}
                        </Badge>
                      )}
                      <p className="font-bold text-pink-500 mt-2">
                        {item.hotValue > 1000000
                          ? (item.hotValue / 1000000).toFixed(1) + "M"
                          : item.hotValue > 1000
                          ? (item.hotValue / 1000).toFixed(1) + "K"
                          : item.hotValue}
                      </p>
                    </div>
                  </div>
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 趋势分析占位符 */}
      <Card>
        <CardHeader>
          <CardTitle>热榜趋势</CardTitle>
          <CardDescription>查看过去 7 天的热榜变化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">趋势分析功能即将上线，敬请期待...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
