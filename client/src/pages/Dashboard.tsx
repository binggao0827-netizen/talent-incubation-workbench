import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { BarChart3, Users, TrendingUp, FileText } from "lucide-react";
import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");

  const { data: accounts, isLoading: accountsLoading } = trpc.accounts.list.useQuery({});
  const { data: topScripts, isLoading: scriptsLoading } = trpc.dashboard.getTopScripts.useQuery({
    metric: "views",
    limit: 5,
  });

  // Calculate date range
  const now = new Date();
  const startDate = new Date();
  if (timeRange === "week") {
    startDate.setDate(now.getDate() - 7);
  } else {
    startDate.setMonth(now.getMonth() - 1);
  }

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery({
    startDate,
    endDate: now,
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">仅管理员可访问看板</p>
      </div>
    );
  }

  const isLoading = accountsLoading || scriptsLoading || statsLoading;

  // Generate mock data for charts
  const generateChartData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
        views: Math.floor(Math.random() * 50000) + 10000,
        followers: Math.floor(Math.random() * 5000) + 1000,
      });
    }
    return data;
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">老板看板</h1>
          <p className="text-gray-600 mt-2">实时掌握团队内容表现和数据趋势</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange("week")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === "week"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            本周
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === "month"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            本月
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  总账号数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalAccounts || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {accounts?.filter(a => a.status === "成熟").length || 0} 个成熟账号
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  新增脚本
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.newScriptsCount || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {timeRange === "week" ? "本周" : "本月"}新增
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  总涨粉
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(stats?.totalNewFollowers || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {timeRange === "week" ? "本周" : "本月"}涨粉数
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  总播放量
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(stats?.totalViews || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {timeRange === "week" ? "本周" : "本月"}播放量
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Views Trend */}
            <Card>
              <CardHeader>
                <CardTitle>播放量趋势</CardTitle>
                <CardDescription>过去 7 天的播放量变化</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#3b82f6"
                      name="播放量"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Followers Trend */}
            <Card>
              <CardHeader>
                <CardTitle>涨粉趋势</CardTitle>
                <CardDescription>过去 7 天的涨粉变化</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="followers" fill="#10b981" name="涨粉" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Scripts */}
          <Card>
            <CardHeader>
              <CardTitle>爆款内容 TOP 5</CardTitle>
              <CardDescription>播放量最高的脚本</CardDescription>
            </CardHeader>
            <CardContent>
              {topScripts && topScripts.length > 0 ? (
                <div className="space-y-3">
                  {topScripts.map((item, idx) => (
                    <div
                      key={item.script.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/scripts/${item.script.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            #{idx + 1}
                          </Badge>
                          <h3 className="font-medium">{item.script.title}</h3>
                        </div>
                        <div className="flex gap-2 text-sm text-gray-600">
                          <span>{item.script.topicTag}</span>
                          <span>·</span>
                          <span>{item.script.hookType}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {(item.metric?.views || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">播放量</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">暂无数据</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>账号状态</CardTitle>
              <CardDescription>各账号的运营状态</CardDescription>
            </CardHeader>
            <CardContent>
              {accounts && accounts.length > 0 ? (
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/accounts/${account.id}`)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{account.name}</h3>
                        <p className="text-sm text-gray-600">
                          {account.platform} · {account.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">
                            {(account.followerCount || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">粉丝</p>
                        </div>
                        <Badge
                          className={
                            account.status === "成熟"
                              ? "bg-green-100 text-green-800"
                              : account.status === "孵化中"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {account.status || "孵化中"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">暂无账号</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
