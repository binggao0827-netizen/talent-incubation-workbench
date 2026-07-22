import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { AlertCircle, Plus, Trash2, Edit2, Clock, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ScheduledTasks() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cron: "0 0 */6 * * *", // Default: every 6 hours
    path: "/api/scheduled/collectTrending",
    description: "",
  });

  // 获取定时任务列表
  const { data: jobsData, isLoading, refetch } = trpc.heartbeat.list.useQuery(
    { page: 1, pageSize: 20 },
    { enabled: user?.role === "admin" }
  );

  // 创建定时任务
  const createMutation = trpc.heartbeat.create.useMutation({
    onSuccess: () => {
      toast.success("定时任务创建成功");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        cron: "0 0 */6 * * *",
        path: "/api/scheduled/collectTrending",
        description: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "创建定时任务失败");
    },
  });

  // 删除定时任务
  const deleteMutation = trpc.heartbeat.delete.useMutation({
    onSuccess: () => {
      toast.success("定时任务已删除");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "删除定时任务失败");
    },
  });

  // 更新定时任务状态
  const updateMutation = trpc.heartbeat.update.useMutation({
    onSuccess: () => {
      toast.success("定时任务已更新");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "更新定时任务失败");
    },
  });

  const handleCreateTask = async () => {
    if (!formData.name.trim()) {
      toast.error("请输入任务名称");
      return;
    }
    if (!formData.cron.trim()) {
      toast.error("请输入 Cron 表达式");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: formData.name,
        cron: formData.cron,
        path: formData.path,
        description: formData.description,
      });
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleDeleteTask = async (taskUid: string) => {
    if (confirm("确定要删除这个定时任务吗？")) {
      try {
        await deleteMutation.mutateAsync(taskUid);
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  const handleToggleTask = async (taskUid: string, isEnable: boolean) => {
    try {
      await updateMutation.mutateAsync({
        taskUid,
        enable: !isEnable,
      });
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  // 权限检查
  if (user?.role !== "admin") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">定时任务管理</h1>
            <p className="text-muted-foreground mt-2">管理系统的自动化任务和定时采集</p>
          </div>
        </div>

        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            您没有权限访问此页面。只有管理员可以管理定时任务。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">定时任务管理</h1>
          <p className="text-muted-foreground mt-2">管理系统的自动化任务和定时采集</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              创建任务
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建定时任务</DialogTitle>
              <DialogDescription>
                设置一个新的定时采集任务
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">任务名称</label>
                <Input
                  placeholder="例如：每 6 小时采集热榜"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Cron 表达式</label>
                <Input
                  placeholder="0 0 */6 * * *"
                  value={formData.cron}
                  onChange={(e) =>
                    setFormData({ ...formData, cron: e.target.value })
                  }
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  格式：秒 分 时 日 月 周 (UTC)
                </p>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p>常用表达式：</p>
                  <p>• 每小时：<code className="bg-muted px-1 rounded">0 0 * * * *</code></p>
                  <p>• 每 6 小时：<code className="bg-muted px-1 rounded">0 0 */6 * * *</code></p>
                  <p>• 每天 9:00 UTC：<code className="bg-muted px-1 rounded">0 0 9 * * *</code></p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">回调路径</label>
                <Input
                  placeholder="/api/scheduled/collectTrending"
                  value={formData.path}
                  onChange={(e) =>
                    setFormData({ ...formData, path: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">描述（可选）</label>
                <Input
                  placeholder="任务描述"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={handleCreateTask}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "创建中..." : "创建"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle>活跃任务</CardTitle>
          <CardDescription>
            系统中的所有定时采集任务
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : !jobsData?.jobs || jobsData.jobs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无定时任务</p>
              <p className="text-sm text-muted-foreground mt-1">
                点击"创建任务"按钮添加第一个定时采集任务
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobsData.jobs.map((job) => (
                <div
                  key={job.taskUid}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  {/* 任务信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{job.name}</h3>
                      <Badge
                        variant={job.isEnable ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {job.isEnable ? "启用" : "禁用"}
                      </Badge>
                    </div>
                    {job.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {job.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Cron: <code className="bg-muted px-1 rounded">{job.cronExpression}</code></span>
                      <span>路径: <code className="bg-muted px-1 rounded">{job.callbackPath}</code></span>
                    </div>
                    {job.nextExecutionAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        下次执行: {new Date(job.nextExecutionAt).toLocaleString("zh-CN")}
                      </p>
                    )}
                    {job.lastExecutedAt && (
                      <p className="text-xs text-muted-foreground">
                        上次执行: {new Date(job.lastExecutedAt).toLocaleString("zh-CN")}
                      </p>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleTask(job.taskUid, job.isEnable)
                      }
                      disabled={updateMutation.isPending}
                    >
                      {job.isEnable ? "禁用" : "启用"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(job.taskUid)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 帮助信息 */}
      <Card>
        <CardHeader>
          <CardTitle>常见任务配置</CardTitle>
          <CardDescription>
            快速参考常用的定时任务配置
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">热榜采集任务</h4>
              <div className="space-y-2 text-sm">
                <div className="bg-muted p-3 rounded">
                  <p className="font-mono text-xs">名称: 每 6 小时采集热榜</p>
                  <p className="font-mono text-xs">Cron: 0 0 */6 * * *</p>
                  <p className="font-mono text-xs">路径: /api/scheduled/collectTrending</p>
                </div>
                <p className="text-muted-foreground">
                  每 6 小时自动采集所有平台的热榜数据
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Cron 表达式说明</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>格式: <code className="bg-muted px-1 rounded">秒 分 时 日 月 周</code></p>
                <p>• 秒 (0-59)</p>
                <p>• 分 (0-59)</p>
                <p>• 时 (0-23, UTC)</p>
                <p>• 日 (1-31)</p>
                <p>• 月 (1-12)</p>
                <p>• 周 (0-6, 0=周日)</p>
                <p className="mt-2">
                  使用 <code className="bg-muted px-1 rounded">*</code> 表示任意值，
                  使用 <code className="bg-muted px-1 rounded">*/n</code> 表示每 n 个单位
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
