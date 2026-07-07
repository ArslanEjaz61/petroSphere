import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatTile } from "@/components/stat-tile";
import { StagePill } from "@/components/stage-pill";
import { Spark } from "@/components/spark";
import { Button } from "@/components/ui/button";
import { fmtMoney, fmtPct, fmtRelative } from "@/lib/format";
import type { DealStage } from "@/lib/stages";
import {
  ArrowUpRight, ArrowDownRight, AlertTriangle, FileWarning, Sparkles,
  TrendingUp, Briefcase, ShieldCheck, Activity, Radio,
} from "lucide-react";
import { useCopilot } from "@/components/ai-copilot";
import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-dashboard.jpg";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PetroSphere AI" }] }),
  component: Dashboard,
});

type Price = { id: string; symbol: string; product: string; region: string; price: number; unit: string; change_pct: number; history: number[] };
type DealRow = { id: string; reference: string; title: string; stage: DealStage; price: number | null; quantity: number | null; updated_at: string };

function Dashboard() {
  const { ask } = useCopilot();
  const { data: prices = [] } = useQuery({
    queryKey: ["market_prices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("market_prices").select("*").limit(12);
      if (error) throw error;
      return data as Price[];
    },
  });
  const { data: deals = [] } = useQuery({
    queryKey: ["dash_deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("id,reference,title,stage,price,quantity,updated_at")
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as DealRow[];
    },
  });

  const pipelineValue = deals.reduce((s, d) => s + (d.price ?? 0) * (d.quantity ?? 0), 0);
  const activeDeals = deals.filter((d) => d.stage !== "delivered" && d.stage !== "lead").length;

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <PageHeader
        title={`${greeting}, Trader`}
        description="Command center — market, pipeline & compliance overview."
        actions={
          <Button
            onClick={() => ask("Give me a morning briefing on my deals, market, and compliance.")}
            size="sm"
            className="gap-1.5 h-8"
          >
            <Sparkles className="h-3.5 w-3.5" /> AI briefing
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Hero band */}
        <div className="relative overflow-hidden rounded border border-border h-32 lg:h-40">
          <img src={heroImg} alt="Global oil operations" className="absolute inset-0 w-full h-full object-cover opacity-70" width={1920} height={640} />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="relative h-full flex flex-col justify-center px-5 lg:px-8 max-w-xl">
            <div className="label-xs text-primary mb-1">Live · Global operations</div>
            <div className="text-[18px] lg:text-[22px] font-semibold leading-tight">Markets, deals & compliance in one console</div>
            <div className="text-[11px] text-muted-foreground mt-1">18 active deals · 24 counterparties · 3 vessels underway</div>
          </div>
        </div>

        {/* KPI band */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Pipeline value" value={fmtMoney(pipelineValue)} delta="+12.4%" positive hint="vs. last 7d" icon={<TrendingUp className="h-3.5 w-3.5" />} />
          <StatTile label="Active deals" value={String(activeDeals)} delta="+3" positive hint="this week" icon={<Briefcase className="h-3.5 w-3.5" />} />
          <StatTile label="Compliance" value="94%" delta="2" positive={false} hint="expiring" icon={<ShieldCheck className="h-3.5 w-3.5" />} />
          <StatTile label="Risk exposure" value="Medium" delta="1" positive={false} hint="high-risk cpty" icon={<Activity className="h-3.5 w-3.5" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Market snapshot */}
          <Panel
            className="lg:col-span-2"
            title="Market snapshot"
            subtitle={now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            actions={<Link to="/market" className="text-[11px] text-primary hover:underline">View all →</Link>}
            dense
            bodyClassName="p-0"
          >
            <table className="w-full text-[12px]">
              <thead className="label-xs">
                <tr className="[&>th]:h-7 [&>th]:px-3 [&>th]:text-left border-b border-border bg-background/50">
                  <th>Instrument</th>
                  <th>Region</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Chg %</th>
                  <th className="text-right w-24">7d</th>
                </tr>
              </thead>
              <tbody>
                {prices.slice(0, 6).map((p) => {
                  const pos = p.change_pct >= 0;
                  return (
                    <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-elevated/50 transition-colors">
                      <td className="px-3 h-9">
                        <span className="font-medium">{p.product}</span>
                        <span className="text-muted-foreground/70 font-mono text-[10px] ml-2">{p.symbol}</span>
                      </td>
                      <td className="px-3 text-muted-foreground text-[11px]">{p.region}</td>
                      <td className="px-3 text-right num">
                        {p.price.toFixed(2)}
                        <span className="text-[10px] text-muted-foreground ml-1">{p.unit}</span>
                      </td>
                      <td className={`px-3 text-right num ${pos ? "text-success" : "text-destructive"}`}>
                        <span className="inline-flex items-center gap-0.5 justify-end">
                          {pos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {fmtPct(p.change_pct)}
                        </span>
                      </td>
                      <td className="px-3">
                        <Spark data={p.history ?? []} positive={pos} height={22} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          {/* AI brief */}
          <div className="space-y-4">
            <Panel
              title="AI morning brief"
              actions={<span className="inline-flex items-center gap-1 text-[10px] font-mono text-primary"><Radio className="h-2.5 w-2.5 animate-pulse" /> LIVE</span>}
            >
              <div className="space-y-2.5 text-[12px] leading-relaxed font-mono">
                <p><span className="text-primary">›</span> <span className="font-semibold">Brent</span> opened at <span className="num">$82.45</span>, up <span className="text-success num">+1.8%</span> on extended OPEC+ cut signals.</p>
                <p><span className="text-primary">›</span> <span className="font-semibold">3 new buyers</span> added overnight — 2 UAE, 1 Singapore.</p>
                <p><span className="text-warning">!</span> <span className="font-semibold">2 LOIs</span> awaiting approval. <span className="text-destructive">1 KYC</span> expired on Petrokraft FZE.</p>
                <p><span className="text-primary">›</span> Diesel demand at <span className="font-semibold">Fujairah</span> ↑ w/w on bunker activity.</p>
              </div>
              <Button variant="link" size="sm" className="px-0 mt-2 h-7 text-[12px]" onClick={() => ask("Expand on today's market briefing with sourcing recommendations.")}>
                Ask Copilot for more →
              </Button>
            </Panel>

            <Panel title="Action items">
              <div className="space-y-2">
                <ActionRow tone="warning" icon={<FileWarning className="h-3.5 w-3.5" />} title="2 LOIs awaiting approval" meta="D-104291, D-104587" />
                <ActionRow tone="destructive" icon={<AlertTriangle className="h-3.5 w-3.5" />} title="1 KYC expired" meta="Petrokraft FZE — trade license" />
                <ActionRow tone="muted" icon={<FileWarning className="h-3.5 w-3.5" />} title="5 deals missing POPs" meta="Across 3 suppliers" />
              </div>
            </Panel>
          </div>
        </div>

        {/* Deals table */}
        <Panel
          title="Deals in progress"
          subtitle={`${deals.length} active`}
          actions={<Link to="/deals" className="text-[11px] text-primary hover:underline">Pipeline →</Link>}
          dense
          bodyClassName="p-0"
        >
          {deals.length === 0 ? (
            <div className="p-10 text-center text-[12px] text-muted-foreground">
              No deals yet. <Link to="/deals" className="text-primary hover:underline">Create your first deal</Link>.
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead className="label-xs">
                <tr className="[&>th]:h-7 [&>th]:px-3 [&>th]:text-left border-b border-border bg-background/50">
                  <th>Reference</th>
                  <th>Deal</th>
                  <th>Stage</th>
                  <th className="text-right">Value</th>
                  <th className="text-right">Updated</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id} className="border-b border-border/60 last:border-0 hover:bg-elevated/50 transition-colors">
                    <td className="px-3 h-9 font-mono text-muted-foreground">{d.reference}</td>
                    <td className="px-3">
                      <Link to="/deals/$id" params={{ id: d.id }} className="font-medium hover:text-primary">{d.title}</Link>
                    </td>
                    <td className="px-3"><StagePill stage={d.stage} /></td>
                    <td className="px-3 text-right num font-medium">{fmtMoney((d.price ?? 0) * (d.quantity ?? 0))}</td>
                    <td className="px-3 text-right text-muted-foreground text-[11px]">{fmtRelative(d.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}

function ActionRow({ icon, title, meta, tone }: { icon: React.ReactNode; title: string; meta: string; tone: "warning" | "destructive" | "muted" }) {
  const toneCls = tone === "warning" ? "border-l-warning bg-warning/5" : tone === "destructive" ? "border-l-destructive bg-destructive/5" : "border-l-border";
  const iconCls = tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2 rounded border border-border border-l-2 ${toneCls}`}>
      <span className={`mt-0.5 shrink-0 ${iconCls}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium">{title}</div>
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">{meta}</div>
      </div>
    </div>
  );
}
