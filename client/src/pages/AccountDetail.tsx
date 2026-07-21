import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatStrip, StatusDot, Tag } from "@/components/Meta";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

interface AccountDetailProps {
  accountId: string;
}

export default function AccountDetail({ accountId }: AccountDetailProps) {
  const [, navigate] = useLocation();
  const { data: account, isLoading } = trpc.accounts.getById.useQuery(accountId);
  const { data: scripts } = trpc.scripts.list.useQuery({ accountId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-lg">
        <p className="text-sm text-muted-foreground mb-4">账号不存在</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/accounts")}>
          返回账号列表
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/accounts")}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          账号管理
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{account.name}</h1>
              <StatusDot status={account.status || "孵化中"} />
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              {account.platform} · {account.category}
              {account.assignedEditor && <> · 编导 {account.assignedEditor}</>}
            </p>
          </div>
          {account.accountUrl && (
            <a
              href={account.accountUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border transition-colors duration-150 pt-2"
            >
              平台主页
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <StatStrip
        items={[
          {
            label: "当前粉丝",
            value: (account.followerCount || 0).toLocaleString(),
          },
          {
            label: "脚本总数",
            value: String(scripts?.length || 0),
          },
          {
            label: "已发布",
            value: String(scripts?.filter((s) => s.status === "发布").length || 0),
          },
        ]}
      />

      {/* Scripts */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-medium">脚本列表</h2>
          <span className="font-data text-xs text-muted-foreground">
            {scripts?.length || 0} 条
          </span>
        </div>
        {scripts && scripts.length > 0 ? (
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
                      <p className="text-sm font-medium group-hover:underline underline-offset-4 decoration-border">
                        {script.title}
                      </p>
                      <StatusDot status={script.status || "草稿"} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Tag>{script.topicTag}</Tag>
                      <Tag>{script.hookType}</Tag>
                    </div>
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
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground mb-4">还没有脚本</p>
            <Button variant="outline" size="sm" onClick={() => navigate("/scripts")}>
              创建脚本
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
