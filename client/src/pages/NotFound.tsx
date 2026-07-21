import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm">
        <p className="font-data text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
          404 — Not Found
        </p>
        <h1 className="text-2xl font-semibold tracking-tight mb-3">页面不存在</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          你访问的页面可能已被移动或删除。
        </p>
        <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          返回首页
        </Button>
      </div>
    </div>
  );
}
