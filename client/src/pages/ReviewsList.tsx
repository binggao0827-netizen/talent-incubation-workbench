import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader, Tag } from "@/components/Meta";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
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

const reviewFormSchema = z.object({
  week: z.string().min(1, "周次不能为空"),
  accountId: z.string().optional(),
  content: z.string().min(1, "复盘内容不能为空"),
  highlights: z.string().optional(),
  pitfalls: z.string().optional(),
  nextWeekPlan: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export default function ReviewsList() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);

  const { data: reviews, isLoading, refetch } = trpc.reviews.list.useQuery({});
  const { data: accounts } = trpc.accounts.list.useQuery({});
  const createMutation = trpc.reviews.create.useMutation();
  const { data: reviewDetail } = trpc.reviews.getById.useQuery(selectedReview || "", {
    enabled: !!selectedReview,
  });

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
  });

  const onSubmit = async (data: ReviewFormValues) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success("复盘创建成功");
      form.reset();
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("创建失败，请重试");
    }
  };

  const generateWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const week = Math.floor(diff / oneWeek) + 1;
    return `${now.getFullYear()}-W${week.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="复盘库"
        description="按周沉淀工作总结，形成系统的知识积累"
        actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              新增复盘
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新增周复盘</DialogTitle>
              <DialogDescription>
                填写本周的工作总结、亮点分析、踩坑记录和下周计划。
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>周次</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="如 2024-W30"
                          defaultValue={generateWeekNumber()}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>关联账号（可选，不选则为整体复盘）</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择账号" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.accountName} ({account.platform})
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
                  name="highlights"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>爆款分析</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="本周有哪些爆款内容？分析其成功因素..."
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pitfalls"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>踩坑记录</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="本周遇到的问题和教训..."
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextWeekPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>下周计划</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="下周的内容方向、选题计划..."
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>总体复盘</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="本周的整体总结..."
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "创建中…" : "创建复盘"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        }
      />

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : reviews && reviews.length > 0 ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {reviews.map((review, idx) => (
            <div
              key={review.id}
              className={`cursor-pointer px-5 py-4 hover:bg-accent/60 transition-colors duration-150 group ${
                idx > 0 ? "border-t border-border" : ""
              }`}
              onClick={() => setSelectedReview(review.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-data text-sm font-medium group-hover:underline underline-offset-4 decoration-border">
                      {review.week}
                    </h3>
                    {review.aiGenerated && <Tag>AI 生成</Tag>}
                    {review.accountId && (
                      <Tag>{accounts?.find(a => a.id === review.accountId)?.accountName}</Tag>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{review.content}</p>
                </div>
                <span className="font-data text-xs text-muted-foreground shrink-0 pt-0.5">
                  {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground mb-4">还没有复盘，点击“新增复盘”开始</p>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>新增复盘</Button>
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedReview && reviewDetail && (
        <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{reviewDetail.week} 复盘</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              {[
                { label: "总体复盘", value: reviewDetail.content },
                { label: "爆款分析", value: reviewDetail.highlights },
                { label: "踩坑记录", value: reviewDetail.pitfalls },
                { label: "下周计划", value: reviewDetail.nextWeekPlan },
              ]
                .filter((s) => s.value)
                .map((section) => (
                  <div key={section.label}>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                      {section.label}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{section.value}</p>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
