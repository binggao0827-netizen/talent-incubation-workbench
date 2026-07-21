import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, Users, TrendingUp } from "lucide-react";

interface AccountDetailProps {
  accountId: string;
}

export default function AccountDetail({ accountId }: AccountDetailProps) {
  const [, navigate] = useLocation();
  const { data: account, isLoading } = trpc.accounts.getById.useQuery(accountId);
  const { data: scripts } = trpc.scripts.list.useQuery({ accountId });

  const statusColors: Record<string, string> = {
    "孵化中": "bg-blue-100 text-blue-800",
    "成熟": "bg-green-100 text-green-800",
    "暂停": "bg-gray-100 text-gray-800",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">账号不存在</p>
        <Button onClick={() => navigate("/accounts")}>返回账号列表</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/accounts")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
          <p className="text-gray-600 mt-1">{account.platform} · {account.category}</p>
        </div>
      </div>

      {/* Account Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">粉丝数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(account.followerCount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">当前粉丝数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">状态</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={statusColors[account.status || "孵化中"]}>
              {account.status || "孵化中"}
            </Badge>
            <p className="text-xs text-gray-500 mt-2">账号状态</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">脚本数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scripts?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">已发布脚本</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle>账号详情</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">平台</p>
              <p className="font-medium">{account.platform}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">分类</p>
              <p className="font-medium">{account.category}</p>
            </div>
            {account.assignedEditor && (
              <div>
                <p className="text-sm text-gray-600">负责编导</p>
                <p className="font-medium">{account.assignedEditor}</p>
              </div>
            )}
            {account.accountUrl && (
              <div>
                <p className="text-sm text-gray-600">主页链接</p>
                <a
                  href={account.accountUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  访问
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scripts */}
      <Card>
        <CardHeader>
          <CardTitle>脚本列表</CardTitle>
          <CardDescription>该账号下的所有脚本</CardDescription>
        </CardHeader>
        <CardContent>
          {scripts && scripts.length > 0 ? (
            <div className="space-y-3">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/scripts/${script.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{script.title}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {script.topicTag}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {script.hookType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {script.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {script.publishDate
                      ? new Date(script.publishDate).toLocaleDateString("zh-CN")
                      : "未发布"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">还没有脚本</p>
              <Button
                className="mt-4"
                onClick={() => navigate("/scripts")}
              >
                创建脚本
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
