/**
 * 全站统一的元信息展示组件：状态点、统计条、页头。
 * 设计语言：Ink/Paper/Signal token，发丝线分隔，mono 数据字体。
 */
import { cn } from "@/lib/utils";

/* ---------- 状态点：取代彩色胶囊 badge ---------- */

const STATUS_COLOR: Record<string, string> = {
  // 账号状态
  孵化中: "bg-signal",
  成熟: "bg-emerald-600",
  暂停: "bg-muted-foreground/40",
  // 脚本状态
  草稿: "bg-muted-foreground/40",
  审核: "bg-amber-500",
  发布: "bg-signal",
  归档: "bg-muted-foreground/40",
};

export function StatusDot({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap",
        className
      )}
    >
      <span
        className={cn(
          "status-dot",
          STATUS_COLOR[status] || "bg-muted-foreground/40"
        )}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}

/* ---------- 细边框 tag：取代 outline badge ---------- */

export function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs text-muted-foreground border border-border bg-transparent whitespace-nowrap",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------- 统计条：一体化 KPI，发丝线分栏 ---------- */

export type StatItem = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatStrip({
  items,
  className,
}: {
  items: StatItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 lg:flex rounded-lg border border-border bg-card overflow-hidden",
        className
      )}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            "px-5 py-4 lg:flex-1 border-border",
            // 发丝线：移动端 2 列网格，桌面端横排
            i % 2 === 1 && "border-l lg:border-l-0",
            i >= 2 && "border-t lg:border-t-0",
            i > 0 && "lg:border-l"
          )}
        >
          <p className="text-xs text-muted-foreground mb-1.5">{item.label}</p>
          <p className="font-data text-2xl font-medium leading-none">
            {typeof item.value === "number"
              ? item.value.toLocaleString()
              : item.value}
          </p>
          {item.hint && (
            <p className="text-xs text-muted-foreground mt-1.5">{item.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- 页头：标题 + 动作区，下方发丝线 ---------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 pb-5 border-b border-border">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
