import { STAGE_LABEL, type DealStage } from "@/lib/stages";
import { cn } from "@/lib/utils";

const TONE: Record<DealStage, string> = {
  lead:        "bg-muted text-muted-foreground border-border",
  inquiry:     "bg-muted text-muted-foreground border-border",
  offer:       "bg-primary/10 text-primary border-primary/20",
  loi:         "bg-primary/10 text-primary border-primary/20",
  icpo:        "bg-chart-2/10 text-chart-2 border-chart-2/20",
  fco:         "bg-chart-2/10 text-chart-2 border-chart-2/20",
  negotiation: "bg-warning/10 text-warning border-warning/20",
  spa:         "bg-warning/10 text-warning border-warning/20",
  payment:     "bg-warning/10 text-warning border-warning/20",
  loading:     "bg-success/15 text-success border-success/25",
  shipment:    "bg-success/15 text-success border-success/25",
  delivered:   "bg-success/20 text-success border-success/30",
  cancelled:   "bg-destructive/10 text-destructive border-destructive/20",
};

export function StagePill({ stage, className }: { stage: DealStage; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-1.5 h-5 rounded text-[10px] font-mono uppercase tracking-wider border",
      TONE[stage] ?? TONE.lead,
      className,
    )}>
      {STAGE_LABEL[stage]}
    </span>
  );
}
