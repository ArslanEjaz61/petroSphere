import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  dense?: boolean;
};

export function Panel({ title, subtitle, actions, children, className, bodyClassName, dense }: Props) {
  return (
    <div className={cn("bg-panel border border-border rounded-md overflow-hidden", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-4 h-10 border-b border-border bg-panel">
          <div className="flex items-baseline gap-2 min-w-0">
            {title && <span className="label-xs truncate">{title}</span>}
            {subtitle && <span className="text-[11px] text-muted-foreground truncate">{subtitle}</span>}
          </div>
          {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={cn(dense ? "" : "p-4", bodyClassName)}>{children}</div>
    </div>
  );
}
