import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatTile } from "@/components/stat-tile";
import { DEAL_STAGES, STAGE_LABEL } from "@/lib/stages";
import { fmtMoney } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, Briefcase, DollarSign, Percent } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — PetroSphere AI" }] }),
  component: Reports,
});

function Reports() {
  const { data: deals = [] } = useQuery({
    queryKey: ["report_deals"],
    queryFn: async () => (await supabase.from("deals").select("stage,quantity,price,product_id")).data ?? [],
  });

  const valueOf = (d: { quantity: number | null; price: number | null }) => Number(d.quantity || 0) * Number(d.price || 0);
  const total = deals.reduce((a, d) => a + valueOf(d), 0);
  const closed = deals.filter((d) => d.stage === "delivered");
  const closedVal = closed.reduce((a, d) => a + valueOf(d), 0);
  const winRate = deals.length ? Math.round((closed.length / deals.length) * 100) : 0;

  const byStage = DEAL_STAGES.map((s) => ({
    stage: STAGE_LABEL[s],
    count: deals.filter((d) => d.stage === s).length,
    value: deals.filter((d) => d.stage === s).reduce((a, d) => a + valueOf(d), 0),
  }));

  const products = Object.entries(
    deals.reduce<Record<string, number>>((m, d) => { const k = d.product_id ?? "Unassigned"; m[k] = (m[k] ?? 0) + valueOf(d); return m; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([code, v]) => ({ product: code.slice(0, 8), value: v }));

  return (
    <div>
      <PageHeader title="Reports" description="Pipeline performance, funnel conversion, and product mix." />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Pipeline value" value={fmtMoney(total)} icon={<TrendingUp className="h-3.5 w-3.5" />} />
          <StatTile label="Closed value" value={fmtMoney(closedVal)} icon={<DollarSign className="h-3.5 w-3.5" />} />
          <StatTile label="Deals" value={String(deals.length)} icon={<Briefcase className="h-3.5 w-3.5" />} />
          <StatTile label="Win rate" value={`${winRate}%`} icon={<Percent className="h-3.5 w-3.5" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Pipeline funnel" subtitle="by stage · value">
            <div className="h-72 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStage} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" horizontal={false} />
                  <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)} />
                  <YAxis type="category" dataKey="stage" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ borderRadius: 6, fontSize: 11, background: "var(--color-elevated)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                    formatter={(v: number) => fmtMoney(v)}
                  />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Top products" subtitle="by value">
            <div className="h-72 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={products} margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="product" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)} />
                  <Tooltip
                    contentStyle={{ borderRadius: 6, fontSize: 11, background: "var(--color-elevated)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                    formatter={(v: number) => fmtMoney(v)}
                  />
                  <Bar dataKey="value" fill="var(--color-chart-2)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title="Stage breakdown" dense bodyClassName="p-0">
          <table className="w-full text-[12px]">
            <thead className="label-xs">
              <tr className="[&>th]:h-8 [&>th]:px-3 [&>th]:text-left border-b border-border bg-background/50">
                <th>Stage</th>
                <th className="text-right">Deals</th>
                <th className="text-right">Value</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {byStage.map((s) => {
                const pct = total ? (s.value / total) * 100 : 0;
                return (
                  <tr key={s.stage} className="border-b border-border/60">
                    <td className="px-3 h-9 font-medium">{s.stage}</td>
                    <td className="px-3 text-right num">{s.count}</td>
                    <td className="px-3 text-right num">{fmtMoney(s.value)}</td>
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-elevated overflow-hidden max-w-[200px]">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="num text-[11px] text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
