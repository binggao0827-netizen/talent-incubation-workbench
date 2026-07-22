import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function FeishuSettings() {
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: config } = trpc.feishu.getConfig.useQuery() as any;
  const saveConfigMutation = trpc.feishu.saveConfig.useMutation();
  const testConnectionMutation = trpc.feishu.testConnection.useMutation();

  const handleSaveConfig = async () => {
    if (!appId || !appSecret) {
      toast.error("请填写 App ID 和 App Secret");
      return;
    }

    setIsLoading(true);
    try {
      await saveConfigMutation.mutateAsync({ appId, appSecret });
      toast.success("配置保存成功");
      setAppId("");
      setAppSecret("");
    } catch (error) {
      toast.error("保存失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!appId || !appSecret) {
      toast.error("请先填写 App ID 和 App Secret");
      return;
    }

    setIsLoading(true);
    try {
      const result = await testConnectionMutation.mutateAsync({ appId, appSecret });
      setTestResult({ success: true, message: result.message });
      toast.success("连接测试成功");
    } catch (error) {
      setTestResult({ success: false, message: "连接失败，请检查凭证" });
      toast.error("连接测试失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">飞书集成设置</h1>
        <p className="text-sm text-muted-foreground mt-1">配置飞书 API 凭证以启用文档导入功能</p>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList>
          <TabsTrigger value="setup">配置凭证</TabsTrigger>
          <TabsTrigger value="guide">配置指南</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          {config && (
            <Card className="p-4 bg-accent/5 border-accent/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">飞书配置已启用</p>
                  <p className="text-xs text-muted-foreground mt-1">App ID: {config?.appId?.substring(0, 10)}...</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-accent" />
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="appId" className="text-sm font-medium">App ID</Label>
                <Input
                  id="appId"
                  placeholder="输入飞书应用 ID"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="appSecret" className="text-sm font-medium">App Secret</Label>
                <div className="relative mt-2">
                  <Input
                    id="appSecret"
                    type={showSecret ? "text" : "password"}
                    placeholder="输入飞书应用密钥"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {testResult && (
                <Card className={`p-3 flex items-center gap-2 ${testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <p className={`text-sm ${testResult.success ? "text-green-700" : "text-red-700"}`}>
                    {testResult.message}
                  </p>
                </Card>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleTestConnection}
                  variant="outline"
                  disabled={isLoading || !appId || !appSecret}
                >
                  测试连接
                </Button>
                <Button
                  onClick={handleSaveConfig}
                  disabled={isLoading || !appId || !appSecret}
                >
                  {isLoading ? "保存中..." : "保存配置"}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">第 1 步：访问飞书开放平台</h3>
              <p className="text-sm text-muted-foreground mb-3">
                访问 <a href="https://open.feishu.cn" target="_blank" rel="noopener noreferrer" className="text-accent underline">https://open.feishu.cn</a> 并登录您的飞书账号
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">第 2 步：创建应用</h3>
              <p className="text-sm text-muted-foreground">
                在开放平台中创建一个新应用，应用类型选择「自建应用」
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">第 3 步：配置权限</h3>
              <p className="text-sm text-muted-foreground mb-2">在应用的权限设置中，添加以下权限：</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• 获取云文档内容 (docs:document:readonly)</li>
                <li>• 获取云文档元数据 (docs:document_meta:readonly)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">第 4 步：获取凭证</h3>
              <p className="text-sm text-muted-foreground mb-2">
                在应用的「凭证」页面，复制以下信息：
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• App ID</li>
                <li>• App Secret</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">第 5 步：粘贴凭证</h3>
              <p className="text-sm text-muted-foreground">
                将 App ID 和 App Secret 粘贴到上方的表单中，点击「测试连接」验证，然后保存配置
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
