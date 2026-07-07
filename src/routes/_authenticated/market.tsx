import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Spark } from "@/components/spark";
import { Button } from "@/components/ui/button";
import { fmtPct } from "@/lib/format";
import { ArrowUpRight, ArrowDownRight, Sparkles, ExternalLink, Droplets, Flame, Fuel, Wind, Ship } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useCopilot } from "@/components/ai-copilot";
import { useState } from "react";
import { cn } from "@/lib/utils";
import worldFlows from "@/assets/world-flows.jpg";

export const Route = createFileRoute("/_authenticated/market")({
  head: () => ({ meta: [{ title: "Market Intelligence — PetroSphere AI" }] }),
  component: Market,
});

type Price = { id: string; symbol: string; product: string; region: string; price: number; unit: string; change_pct: number; history: number[] };
type News = { id: string; headline: string; source: string; region: string; published_at: string };

const CATEGORIES = [
  { key: "all", label: "All instruments", icon: Droplets },
  { key: "crude", label: "Crude", icon: Droplets, match: /brent|wti|crude|dubai|urals/i },
  { key: "distillate", label: "Middle distillates", icon: Fuel, match: /diesel|gasoil|jet|kerosene|en590/i },
  { key: "gasoline", label: "Gasoline", icon: Flame, match: /gasoline|naphtha|ron/i },
  { key: "fueloil", label: "Fuel oil", icon: Ship, match: /fuel oil|hsfo|vlsfo|bunker/i },
  { key: "lng", label: "LNG / LPG", icon: Wind, match: /lng|lpg|butane|propane/i },
];
const REGIONS = ["Global", "EMEA", "APAC", "Americas"];
const REGION_MATCH: Record<string, RegExp> = {
  EMEA: /rotterdam|amsterdam|london|europe|fujairah|middle/i,
  APAC: /singapore|tokyo|asia|shanghai|india/i,
  Americas: /houston|new york|americ|nymex|calgary|mexico/i,
  Global: /.*/,
};

function Market() {
  const { ask } = useCopilot();
  const [cat, setCat] = useState("all");
  const [region, setRegion] = useState("Global");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: prices = [] } = useQuery({
    queryKey: ["mp_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("market_prices").select("*");
      if (error) throw error;
      return data as Price[];
    },
  });
  const { data: news = [] } = useQuery({
    queryKey: ["news_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("market_news").select("*").order("published_at", { ascending: false });
      if (error) throw error;
      return data as News[];
    },
  });

  const catDef = CATEGORIES.find((c) => c.key === cat);
  const filtered = prices.filter((p) => {
    if (catDef?.match && !catDef.match.test(p.product)) return false;
    if (region !== "Global" && !REGION_MATCH[region].test(p.region)) return false;
    return true;
  });

  const selected = filtered.find((p) => p.id === selectedId) ?? filtered[0];

  return (
    <div>
      <PageHeader
        title="Market Intelligence"
        description="Live petroleum benchmarks, regional differentials, and flow analytics."
        actions={
          <Button onClick={() => ask("Give me a 5-bullet briefing on today's petroleum markets.")} size="sm" className="gap-1.5 h-8">
            <Sparkles className="h-3.5 w-3.5" /> Market brief
          </Button>
        }
        tabs={
          <div className="flex items-center gap-1 -mb-px">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={cn(
                  "px-3 h-8 text-[12px] font-medium border-b-2 transition-colors",
                  region === r ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >{r}</button>
            ))}
          </div>
        }
      />

      <div className="p-4 grid grid-cols-1 xl:grid-cols-[220px_1fr_360px] gap-4">
        {/* Category rail */}
        <div className="space-y-3">
          <Panel title="Products" dense bodyClassName="p-1">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = c.key === cat;
              return (
                <button
                  key={c.key}
                  onClick={() => setCat(c.key)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 h-8 text-[12px] rounded transition-colors text-left",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-elevated hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </Panel>

          <Panel title="Flow snapshot" dense bodyClassName="p-3 space-y-2 text-[11px]">
            <FlowMock />
            <div className="text-muted-foreground font-mono">
              <div>› Top route: <span className="text-foreground">Ras Tanura → Rotterdam</span></div>
              <div>› Vessels in transit: <span className="text-foreground num">1,284</span></div>
              <div>› Storage: <span className="text-foreground num">78%</span> Fujairah</div>
            </div>
          </Panel>
        </div>

        {/* Main table */}
        <Panel
          title={`${catDef?.label ?? "All"} — ${region}`}
          subtitle={`${filtered.length} instruments`}
          dense
          bodyClassName="p-0"
        >
          <div className="overflow-auto max-h-[560px]">
            <table className="w-full text-[12px]">
              <thead className="label-xs sticky top-0 bg-panel z-[1]">
                <tr className="[&>th]:h-8 [&>th]:px-3 [&>th]:text-left border-b border-border">
                  <th>Instrument</th>
                  <th>Region</th>
                  <th className="text-right">Last</th>
                  <th className="text-right">Chg %</th>
                  <th className="text-right w-24">7d</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No instruments match.</td></tr>
                )}
                {filtered.map((p) => {
                  const pos = p.change_pct >= 0;
                  const isSel = selected?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={cn(
                        "border-b border-border/60 cursor-pointer transition-colors",
                        isSel ? "bg-primary/5" : "hover:bg-elevated/50",
                      )}
                    >
                      <td className="px-3 h-9">
                        <div className="font-medium">{p.product}</div>
                        <div className="text-[10px] font-mono text-muted-foreground/70">{p.symbol}</div>
                      </td>
                      <td className="px-3 text-muted-foreground text-[11px]">{p.region}</td>
                      <td className="px-3 text-right num font-medium">
                        {p.price.toFixed(2)}
                        <span className="text-[10px] text-muted-foreground ml-1">{p.unit}</span>
                      </td>
                      <td className={`px-3 text-right num ${pos ? "text-success" : "text-destructive"}`}>
                        <span className="inline-flex items-center gap-0.5 justify-end">
                          {pos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {fmtPct(p.change_pct)}
                        </span>
                      </td>
                      <td className="px-3"><Spark data={p.history ?? []} positive={pos} height={22} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Detail drawer */}
        <div className="space-y-3">
          {selected && (
            <Panel
              title={selected.product}
              subtitle={selected.symbol}
              actions={<span className={`text-[11px] num ${selected.change_pct >= 0 ? "text-success" : "text-destructive"}`}>{fmtPct(selected.change_pct)}</span>}
            >
              <div className="flex items-baseline gap-2">
                <span className="num text-2xl font-semibold tracking-tight">{selected.price.toFixed(2)}</span>
                <span className="text-[11px] text-muted-foreground">{selected.unit}</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">{selected.region}</div>

              <div className="h-40 mt-4 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(selected.history ?? []).map((y, i) => ({ i: `D${i + 1}`, y }))}>
                    <defs>
                      <linearGradient id="pxg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="i" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={36} />
                    <Tooltip contentStyle={{ borderRadius: 6, fontSize: 11, background: "var(--color-elevated)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
                    <Area type="monotone" dataKey="y" stroke="var(--color-primary)" strokeWidth={1.5} fill="url(#pxg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-y-2 text-[11px]">
                <span className="text-muted-foreground">Bid</span><span className="text-right num">{(selected.price - 0.15).toFixed(2)}</span>
                <span className="text-muted-foreground">Ask</span><span className="text-right num">{(selected.price + 0.15).toFixed(2)}</span>
                <span className="text-muted-foreground">7d high</span><span className="text-right num">{Math.max(...(selected.history ?? [selected.price])).toFixed(2)}</span>
                <span className="text-muted-foreground">7d low</span><span className="text-right num">{Math.min(...(selected.history ?? [selected.price])).toFixed(2)}</span>
              </div>
            </Panel>
          )}

          <Panel title="Market news" dense bodyClassName="max-h-96 overflow-auto divide-y divide-border">
            {news.length === 0 && <div className="p-6 text-center text-[12px] text-muted-foreground">No news yet.</div>}
            {news.map((n) => (
              <button key={n.id} className="w-full text-left px-3 py-2.5 hover:bg-elevated/50 transition-colors group">
                <div className="text-[12px] font-medium leading-snug flex items-start gap-1.5">
                  {n.headline}
                  <ExternalLink className="h-3 w-3 mt-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground shrink-0" />
                </div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-1">
                  {n.source} · {n.region} · {new Date(n.published_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function FlowMock() {
  return (
    <div className="relative w-full h-40 rounded border border-border overflow-hidden bg-background">
      <img src={worldFlows} alt="Global oil trade flows" className="absolute inset-0 w-full h-full object-cover" loading="lazy" width={1600} height={800} />
      <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
      <div className="absolute bottom-2 left-3 label-xs text-primary">Live flows · 12 vessels tracked</div>
    </div>
  );
}
