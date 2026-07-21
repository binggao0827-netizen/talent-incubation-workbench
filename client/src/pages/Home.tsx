import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";

const CAPABILITIES = [
  {
    index: "01",
    title: "账号管理",
    description: "多平台达人账号统一管理，粉丝增长与运营状态一目了然。",
  },
  {
    index: "02",
    title: "脚本库",
    description: "结构化脚本录入，选题标签与钩子类型系统分类，可检索、可复用。",
  },
  {
    index: "03",
    title: "数据反馈",
    description: "脚本与数据强绑定，播放、涨粉、互动的长尾表现完整留存。",
  },
  {
    index: "04",
    title: "复盘库",
    description: "按周沉淀总结，让经验从个人记忆变成团队资产。",
  },
];

const AI_CAPABILITIES = [
  {
    title: "AI 周报",
    description: "基于当周真实数据自动生成结构化周报：亮点、问题、下一步建议。",
  },
  {
    title: "规律分析",
    description: "拆解爆款内容的共性，找出选题与钩子的最优组合。",
  },
  {
    title: "选题脑暴",
    description: "结合历史数据表现，为编导提供有依据的选题方向。",
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-border border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-xs">达</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">达人孵化工作台</span>
          </div>
          <Button onClick={() => startLogin()} variant="outline" size="sm">
            登录
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <span className="rec-dot rec-dot-live" aria-hidden="true" />
            为短视频内容团队而建
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.15]">
            让每一条脚本，
            <br />
            都成为可复用的资产。
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-6 leading-relaxed">
            结构化沉淀脚本与数据，AI 驱动规律分析与选题脑暴。
            账号、脚本、数据、复盘，一个工作台全部管起来。
          </p>
          <div className="flex items-center gap-4 mt-10">
            <Button onClick={() => startLogin()} size="lg" className="gap-2">
              开始使用
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Button>
          </div>
        </div>
      </section>

      {/* Capabilities —— 编号目录式 */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground mb-10">
            核心能力
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
            {CAPABILITIES.map((item) => (
              <div
                key={item.index}
                className="flex gap-5 py-6 border-b border-border"
              >
                <span className="font-data text-xs text-muted-foreground pt-1 shrink-0">
                  {item.index}
                </span>
                <div>
                  <h3 className="font-medium text-base">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI —— 深色反转块 */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground/60 mb-10">
            AI 能力
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {AI_CAPABILITIES.map((item) => (
              <div key={item.title}>
                <h3 className="font-medium text-base">{item.title}</h3>
                <p className="text-sm text-primary-foreground/70 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-14 pt-8 border-t border-primary-foreground/15 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p className="text-sm text-primary-foreground/70">
              从记录到洞察，让数据替团队说话。
            </p>
            <Button
              onClick={() => startLogin()}
              variant="secondary"
              className="gap-2 w-fit"
            >
              立即开始
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-muted-foreground">
          <p>达人孵化工作台</p>
          <p>© 2026</p>
        </div>
      </footer>
    </div>
  );
}
