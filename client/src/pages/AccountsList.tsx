import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PageHeader } from "@/components/Meta";
import { StatusDot } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, ArrowUpRight } from "lucide-react";

const accountFormSchema = z.object({
  creatorId: z.string().min(1, "请选择创作者"),
  platform: z.enum(["抖音", "小红书", "B站", "视频号"]),
  accountName: z.string().min(1, "账号名称不能为空"),
  homepageUrl: z.string().url().optional().or(z.literal("")),
  followerCount: z.number().optional(),
  status: z.enum(["孵化中", "成熟", "暂停"]).optional(),
  contentTypeIds: z.string().array().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function AccountsList() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const { data: accounts, isLoading, refetch } = trpc.accounts.list.useQuery({});
  const { data: creators } = trpc.creators.list.useQuery();
  const { data: contentTypes } = trpc.contentTypes.list.useQuery();
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

  // 平台字标：单色方块 + 首字，取代 emoji
  const platformMark: Record<string, string> = {
    "抖音": "抖",
    "小红书": "红",
    "B站": "B",
    "视频号": "视",
  };

  if (!user?.role || (user.role !== "admin" && user.role !== "user")) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">无权限访问此页面</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="账号管理"
        description="管理达人账号，追踪粉丝增长与内容表现"
        actions={
          user.role === "admin" ? (
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
                  填写平台账号信息，系统将为您管理该账号的所有脚本和数据。
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="creatorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>创作者</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择创作者" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {creators?.map((creator) => (
                              <SelectItem key={creator.id} value={creator.id}>
                                {creator.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>账号名称</FormLabel>
                        <FormControl>
                          <Input placeholder="输入平台账号名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="homepageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>主页链接</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
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
                    name="contentTypeIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>内容类型</FormLabel>
                        <Select onValueChange={(val) => {
                          const current = field.value || [];
                          if (current.includes(val)) {
                            field.onChange(current.filter(id => id !== val));
                          } else {
                            field.onChange([...current, val]);
                          }
                        }}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择内容类型（可多选）" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contentTypes?.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "创建中…" : "创建账号"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          ) : undefined
        }
      />

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
              className="cursor-pointer shadow-none hover:border-foreground/25 transition-colors duration-150 group"
              onClick={() => navigate(`/accounts/${account.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-md border border-border bg-muted/60 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-foreground/70">
                        {platformMark[account.platform] || account.platform.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate group-hover:underline underline-offset-4 decoration-border">
                        {account.accountName}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {account.platform}
                      </CardDescription>
                    </div>
                  </div>
                  <StatusDot status={account.status || "孵化中"} className="shrink-0 pt-1" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between pt-1 border-t border-border">
                  <div className="pt-3">
                    <p className="font-data text-xl font-medium leading-none">
                      {(account.followerCount || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1.5">粉丝</p>
                  </div>
                  {account.homepageUrl && (
                    <a
                      href={account.homepageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 decoration-border transition-colors duration-150 pt-3"
                    >
                      主页 <ArrowUpRight className="w-2.5 h-2.5 inline" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground mb-4">还没有账号，点击"新增账号"开始</p>
        </div>
      )}
    </div>
  );
}
