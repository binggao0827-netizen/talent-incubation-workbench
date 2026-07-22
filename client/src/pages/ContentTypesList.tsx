import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PageHeader } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Tag, Trash2 } from "lucide-react";

const contentTypeFormSchema = z.object({
  name: z.string().min(1, "内容类型名称不能为空"),
  description: z.string().optional(),
  color: z.string().optional(),
});

type ContentTypeFormValues = z.infer<typeof contentTypeFormSchema>;

export default function ContentTypesList() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: contentTypes, isLoading, refetch } = trpc.contentTypes.list.useQuery();
  const createMutation = trpc.contentTypes.create.useMutation();
  const updateMutation = trpc.contentTypes.update.useMutation();
  const deleteMutation = trpc.contentTypes.delete.useMutation();

  const form = useForm<ContentTypeFormValues>({
    resolver: zodResolver(contentTypeFormSchema),
  });

  const onSubmit = async (data: ContentTypeFormValues) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data,
        });
        toast.success("内容类型更新成功");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("内容类型创建成功");
      }
      form.reset();
      setOpen(false);
      setEditingId(null);
      refetch();
    } catch (error) {
      toast.error(editingId ? "更新失败，请重试" : "创建失败，请重试");
    }
  };

  const handleEdit = (type: any) => {
    setEditingId(type.id);
    form.reset({
      name: type.name,
      description: type.description || "",
      color: type.color || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定要删除该内容类型吗？")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("内容类型已删除");
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
        title="内容类型管理"
        description="自定义和管理内容分类标签，用于账号和脚本的分类"
        actions={
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                新增类型
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? "编辑内容类型" : "新增内容类型"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "修改内容类型信息" : "添加新的内容分类标签"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>类型名称</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：口播、剧情、教程" {...field} />
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
                          <Textarea placeholder="输入类型描述" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>颜色标记（可选）</FormLabel>
                        <FormControl>
                          <Input placeholder="#FF5733" {...field} />
                        </FormControl>
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

      {/* Content Types List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : contentTypes && contentTypes.length > 0 ? (
        <div className="space-y-3">
          {contentTypes.map((type) => (
            <Card key={type.id} className="shadow-none hover:border-foreground/25 transition-colors duration-150">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {type.color && (
                      <div
                        className="w-4 h-4 rounded shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-base">{type.name}</CardTitle>
                      {type.description && (
                        <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(type)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2"
                    onClick={() => handleDelete(type.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <Tag className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground mb-4">还没有内容类型，点击"新增类型"开始</p>
        </div>
      )}
    </div>
  );
}
