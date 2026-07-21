import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader, StatStrip, StatusDot } from "@/components/Meta";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

  // Calculate date range (memoized to keep query input references stable)
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (timeRange === "week") {
      start.setDate(end.getDate() - 7);
    } else {
      start.setMonth(end.getMonth() - 1);
    }
    return { startDate: start, endDate: end };
  }, [timeRange]);

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery({
    startDate,
    endDate,
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">仅管理员可访问看板</p>
      </div>
    );
  }

  const isLoading = accountsLoading || scriptsLoading || statsLoading;

  // 基于真实 TOP 脚本数据构建图表；无数据时为空
  const chartData = (topScripts || []).map((item) => ({
    name:
      item.script.title.length > 8
        ? item.script.title.slice(0, 8) + "…"
        : item.script.title,
    views: item.metric?.views || 0,
    followers: item.metric?.newFollowers || 0,
  }));

  const chartTooltipStyle = {
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--card)",
    boxShadow: "none",
    fontSize: 12,
  } as const;

  return (
    <div className="space-y-8">
      <PageHeader
        title="看板"
        description="团队内容表现与数据趋势"
        actions={
          <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/50">
            {([
              { key: "week", label: "本周" },
              { key: "month", label: "本月" },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTimeRange(opt.key)}
                className={`px-3 py-1 rounded text-sm transition-colors duration-150 ${
                  timeRange === opt.key
                    ? "bg-card text-foreground border border-border font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          <StatStrip
            items={[
              {
                label: "总账号数",
                value: stats?.totalAccounts || 0,
                hint: `${accounts?.filter((a) => a.status === "成熟").length || 0} 个成熟账号`,
              },
              {
                label: "新增脚本",
                value: stats?.newScriptsCount || 0,
                hint: `${timeRange === "week" ? "本周" : "本月"}新增`,
              },
              {
                label: "总涨粉",
                value: stats?.totalNewFollowers || 0,
                hint: `${timeRange === "week" ? "本周" : "本月"}涨粉数`,
              },
              {
                label: "总播放量",
                value: stats?.totalViews || 0,
                hint: `${timeRange === "week" ? "本周" : "本月"}播放量`,
              },
            ]}
          />

          {/* Charts —— 基于 TOP 脚本真实数据 */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">播放量对比</CardTitle>
                  <CardDescription className="text-xs">TOP 脚本最近一次录入的播放量</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="var(--signal)"
                        name="播放量"
                        strokeWidth={1.75}
                        dot={{ r: 2.5, fill: "var(--signal)", strokeWidth: 0 }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">涨粉对比</CardTitle>
                  <CardDescription className="text-xs">TOP 脚本带来的新增粉丝</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
                      <Bar dataKey="followers" fill="var(--foreground)" name="涨粉" radius={[3, 3, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Scripts —— 排名表格行 */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">爆款内容 TOP 5</CardTitle>
              <CardDescription className="text-xs">播放量最高的脚本</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {topScripts && topScripts.length > 0 ? (
                <div>
                  {topScripts.map((item, idx) => (
                    <div
                      key={item.script.id}
                      className="flex items-center gap-4 px-6 py-3 border-t border-border hover:bg-accent/60 cursor-pointer transition-colors duration-150"
                      onClick={() => navigate(`/scripts/${item.script.id}`)}
                    >
                      <span className="font-data text-xs text-muted-foreground w-5 text-right shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate">{item.script.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.script.topicTag} · {item.script.hookType}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-data text-sm font-medium">
                          {(item.metric?.views || 0).toLocaleString()}
                        </p>
                        <p className="text-[11px] text-muted-foreground">播放量</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-t border-border">
                  <p className="text-sm text-muted-foreground">暂无数据，发布脚本并录入数据后展示</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Status —— 表格行 */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">账号状态</CardTitle>
              <CardDescription className="text-xs">各账号的运营状态</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {accounts && accounts.length > 0 ? (
                <div>
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-4 px-6 py-3 border-t border-border hover:bg-accent/60 cursor-pointer transition-colors duration-150"
                      onClick={() => navigate(`/accounts/${account.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate">{account.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {account.platform} · {account.category}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-data text-sm font-medium">
                          {(account.followerCount || 0).toLocaleString()}
                        </p>
                        <p className="text-[11px] text-muted-foreground">粉丝</p>
                      </div>
                      <StatusDot status={account.status || "孵化中"} className="w-16 justify-end" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-t border-border">
                  <p className="text-sm text-muted-foreground">暂无账号</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
