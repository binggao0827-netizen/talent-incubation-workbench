import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";
import { Plus, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const accountFormSchema = z.object({
  name: z.string().min(1, "账号名称不能为空"),
  platform: z.enum(["抖音", "小红书", "B站", "视频号"]),
  category: z.enum(["美妆", "游戏", "剧情", "测评", "教程", "种草", "生活", "其他"]),
  accountUrl: z.string().optional(),
  followerCount: z.number().optional(),
  status: z.enum(["孵化中", "成熟", "暂停"]).optional(),
  assignedEditor: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function AccountsList() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const { data: accounts, isLoading, refetch } = trpc.accounts.list.useQuery({});
  const createMutation = trpc.accounts.create.useMutation();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      status: "孵化中",
    },
  });

  const onSubmit = async (data: AccountFormValues) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success("账号创建成功");
      form.reset();
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("创建失败，请重试");
    }
  };

  const statusColors: Record<string, string> = {
    "孵化中": "bg-blue-100 text-blue-800",
    "成熟": "bg-green-100 text-green-800",
    "暂停": "bg-gray-100 text-gray-800",
  };

  const platformIcons: Record<string, string> = {
    "抖音": "🎵",
    "小红书": "📱",
    "B站": "🎬",
    "视频号": "📺",
  };

  if (!user?.role || (user.role !== "admin" && user.role !== "user")) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">无权限访问此页面</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">账号管理</h1>
          <p className="text-gray-600 mt-2">管理所有达人账号，追踪粉丝增长和内容表现</p>
        </div>
        {user.role === "admin" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                新增账号
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>新增账号</DialogTitle>
                <DialogDescription>
                  填写达人账号信息，系统将为您管理该账号的所有脚本和数据。
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>账号名称</FormLabel>
                        <FormControl>
                          <Input placeholder="输入达人名或账号名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>平台</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择平台" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="抖音">抖音</SelectItem>
                            <SelectItem value="小红书">小红书</SelectItem>
                            <SelectItem value="B站">B站</SelectItem>
                            <SelectItem value="视频号">视频号</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>领域分类</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择领域" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="美妆">美妆</SelectItem>
                            <SelectItem value="游戏">游戏</SelectItem>
                            <SelectItem value="剧情">剧情</SelectItem>
                            <SelectItem value="测评">测评</SelectItem>
                            <SelectItem value="教程">教程</SelectItem>
                            <SelectItem value="种草">种草</SelectItem>
                            <SelectItem value="生活">生活</SelectItem>
                            <SelectItem value="其他">其他</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followerCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>粉丝数</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="输入粉丝数"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>状态</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="孵化中">孵化中</SelectItem>
                            <SelectItem value="成熟">成熟</SelectItem>
                            <SelectItem value="暂停">暂停</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "创建中..." : "创建账号"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/accounts/${account.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{platformIcons[account.platform]}</span>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                    </div>
                    <CardDescription>{account.platform}</CardDescription>
                  </div>
                  <Badge className={statusColors[account.status || "孵化中"]}>
                    {account.status || "孵化中"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 font-medium">
                    {(account.followerCount || 0).toLocaleString()} 粉丝
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{account.category}</span>
                </div>
                {account.assignedEditor && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    负责编导：{account.assignedEditor}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">还没有账号，点击"新增账号"开始</p>
            {user.role === "admin" && (
              <Button onClick={() => setOpen(true)}>新增账号</Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
