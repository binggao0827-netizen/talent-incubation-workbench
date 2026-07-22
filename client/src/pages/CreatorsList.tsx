import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PageHeader } from "@/components/Meta";
import { StatusDot } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, Trash2 } from "lucide-react";

const creatorFormSchema = z.object({
  name: z.string().min(1, "创作者名称不能为空"),
  description: z.string().optional(),
  avatar: z.string().optional(),
  assignedEditor: z.string().optional(),
  status: z.enum(["孵化中", "成熟", "暂停"]).optional(),
});

type CreatorFormValues = z.infer<typeof creatorFormSchema>;

export default function CreatorsList() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: creators, isLoading, refetch } = trpc.creators.list.useQuery();
  const createMutation = trpc.creators.create.useMutation();
  const updateMutation = trpc.creators.update.useMutation();
  const deleteMutation = trpc.creators.delete.useMutation();

  const form = useForm<CreatorFormValues>({
    resolver: zodResolver(creatorFormSchema),
    defaultValues: {
      status: "孵化中",
    },
  });

  const onSubmit = async (data: CreatorFormValues) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data,
        });
        toast.success("创作者更新成功");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("创作者创建成功");
      }
      form.reset();
      setOpen(false);
      setEditingId(null);
      refetch();
    } catch (error) {
      toast.error(editingId ? "更新失败，请重试" : "创建失败，请重试");
    }
  };

  const handleEdit = (creator: any) => {
    setEditingId(creator.id);
    form.reset({
      name: creator.name,
      description: creator.description || "",
      avatar: creator.avatar || "",
      assignedEditor: creator.assignedEditor || "",
      status: creator.status || "孵化中",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定要删除该创作者吗？")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("创作者已删除");
        refetch();
      } catch (error) {
        toast.error("删除失败，请重试");
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setEditingId(null);
      form.reset();
    }
  };

  if (!user?.role || user.role !== "admin") {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">仅管理员可访问此页面</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="创作者管理"
        description="管理内容创作者，追踪多平台账号和成长数据"
        actions={
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                新增创作者
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? "编辑创作者" : "新增创作者"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "修改创作者信息" : "添加新的内容创作者"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>创作者名称</FormLabel>
                        <FormControl>
                          <Input placeholder="输入创作者名称" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>描述</FormLabel>
                        <FormControl>
                          <Textarea placeholder="输入创作者简介" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedEditor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>负责编导</FormLabel>
                        <FormControl>
                          <Input placeholder="输入编导名称" {...field} />
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

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {createMutation.isPending || updateMutation.isPending ? "保存中…" : "保存"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Creators Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : creators && creators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.map((creator) => (
            <Card
              key={creator.id}
              className="shadow-none hover:border-foreground/25 transition-colors duration-150"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">
                      {creator.name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5 line-clamp-2">
                      {creator.description || "暂无描述"}
                    </CardDescription>
                  </div>
                  <StatusDot status={creator.status || "孵化中"} className="shrink-0 pt-1" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-1 border-t border-border">
                  {creator.assignedEditor && (
                    <p className="text-xs text-muted-foreground">
                      编导：{creator.assignedEditor}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(creator)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2"
                      onClick={() => handleDelete(creator.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground mb-4">还没有创作者，点击"新增创作者"开始</p>
        </div>
      )}
    </div>
  );
}
