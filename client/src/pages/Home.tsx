import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { BarChart3, Users, FileText, BookOpen, Sparkles } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">达</span>
            </div>
            <span className="font-semibold">达人孵化工作台</span>
          </div>
          <Button onClick={() => startLogin()} variant="default">
            登录
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold tracking-tight">
              短视频团队的内容管理与数据分析平台
            </h1>
            <p className="text-xl text-gray-600">
              结构化沉淀脚本与数据，AI 驱动的规律分析与选题脑暴，让每一次创作都成为可复用的资产。
            </p>
            <div className="flex gap-4 pt-4">
              <Button onClick={() => startLogin()} size="lg" className="shadow-lg">
                开始使用
              </Button>
              <Button variant="outline" size="lg">
                了解更多
              </Button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 flex items-center justify-center min-h-96">
            <div className="text-center space-y-4">
              <BarChart3 className="w-24 h-24 mx-auto text-blue-500 opacity-50" />
              <p className="text-gray-500 font-medium">可视化数据看板</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                title: "账号管理",
                description: "多平台达人账号统一管理，实时追踪粉丝增长",
              },
              {
                icon: FileText,
                title: "脚本库",
                description: "结构化脚本录入，选题标签与钩子类型系统分类",
              },
              {
                icon: BarChart3,
                title: "数据反馈",
                description: "脚本与数据强绑定，完整的长尾数据追踪",
              },
              {
                icon: BookOpen,
                title: "复盘库",
                description: "按周沉淀工作总结，形成系统的知识积累",
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <feature.icon className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">AI 智能功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "AI 周报生成",
                description: "基于当周数据自动生成结构化周报，包含亮点、问题、建议",
              },
              {
                icon: BarChart3,
                title: "规律分析",
                description: "分析爆款内容规律，发现选题与钩子的最优组合",
              },
              {
                icon: Sparkles,
                title: "选题脑暴",
                description: "结合历史数据与热点，为编导提供智能选题建议",
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-100">
                <feature.icon className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-700 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-bold">准备好提升创作效率了吗？</h2>
          <p className="text-lg opacity-90">
            加入数百个内容团队，使用达人孵化工作台管理账号、脚本、数据与复盘。
          </p>
          <Button
            onClick={() => startLogin()}
            size="lg"
            variant="secondary"
            className="shadow-lg"
          >
            立即开始
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 text-sm">
          <p>&copy; 2024 达人孵化工作台. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
