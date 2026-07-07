import type { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: ReactNode;
  delta?: string;
  positive?: boolean;
  hint?: string;
  icon?: ReactNode;
  className?: string;
};

export function StatTile({ label, value, delta, positive, hint, icon, className }: Props) {
  return (
    <div className={cn("bg-panel border border-border rounded-md px-4 py-3 flex flex-col gap-1.5 min-w-0", className)}>
      <div className="flex items-center justify-between">
        <span className="label-xs">{label}</span>
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
      </div>
      <div className="num text-2xl font-semibold text-foreground leading-none tracking-tight">{value}</div>
      <div className="flex items-center gap-2 text-[11px]">
        {delta && (
          <span className={cn("inline-flex items-center gap-0.5 num font-medium", positive ? "text-success" : "text-destructive")}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta}
          </span>
        )}
        {hint && <span className="text-muted-foreground truncate">{hint}</span>}
      </div>
    </div>
  );
}
