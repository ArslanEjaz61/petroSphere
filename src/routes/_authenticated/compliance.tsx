import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatTile } from "@/components/stat-tile";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/compliance")({
  head: () => ({ meta: [{ title: "Compliance — PetroSphere AI" }] }),
  component: Compliance,
});

const KYC = [
  { name: "Trade License", status: "valid" },
  { name: "Certificate of Incorporation", status: "valid" },
  { name: "Passport (Director)", status: "valid" },
  { name: "UBO Declaration", status: "expiring" },
  { name: "Proof of Address", status: "valid" },
  { name: "Tax Registration", status: "valid" },
  { name: "Sanctions Screening", status: "valid" },
  { name: "PEP Screening", status: "pending" },
];

const SANCTIONS = [
  { name: "OFAC (US)", status: "clear" },
  { name: "EU Consolidated List", status: "clear" },
  { name: "UN Sanctions List", status: "clear" },
  { name: "UK HM Treasury", status: "clear" },
];

const TRADE = [
  { name: "Master SPA template", status: "valid" },
  { name: "Insurance certificates", status: "expiring" },
  { name: "Bank references", status: "valid" },
  { name: "Standard incoterms 2020", status: "valid" },
];

const itemTone = (s: string) =>
  s === "valid" || s === "clear" ? "text-success" :
  s === "expiring" ? "text-warning" :
  s === "expired" ? "text-destructive" :
  "text-muted-foreground";

const itemGlyph = (s: string) =>
  s === "valid" || s === "clear" ? "✓" :
  s === "expiring" ? "!" :
  s === "expired" ? "✕" :
  "?";

function Compliance() {
  const { data: companies = [] } = useQuery({
    queryKey: ["companies_compliance"],
    queryFn: async () => (await supabase.from("companies").select("id,name,risk_rating,status,country_code")).data ?? [],
  });
  const buckets = {
    high: companies.filter((c) => c.risk_rating === "high").length,
    medium: companies.filter((c) => c.risk_rating === "medium").length,
    low: companies.filter((c) => c.risk_rating === "low").length,
    unknown: companies.filter((c) => c.risk_rating === "unknown").length,
  };
  const complianceScore = companies.length
    ? Math.round(((buckets.low * 100 + buckets.medium * 70 + buckets.high * 30 + buckets.unknown * 50) / companies.length))
    : 100;

  return (
    <div>
      <PageHeader title="Compliance" description="KYC, sanctions, and counterparty risk overview." />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Compliance score" value={`${complianceScore}%`} icon={<Shield className="h-3.5 w-3.5" />} />
          <StatTile label="High risk" value={String(buckets.high)} icon={<ShieldAlert className="h-3.5 w-3.5 text-destructive" />} />
          <StatTile label="Medium risk" value={String(buckets.medium)} icon={<ShieldAlert className="h-3.5 w-3.5 text-warning" />} />
          <StatTile label="Pending review" value={String(buckets.unknown)} icon={<ShieldQuestion className="h-3.5 w-3.5" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChecklistPanel title="KYC" items={KYC} />
          <ChecklistPanel title="Sanctions screening" items={SANCTIONS} />
          <ChecklistPanel title="Trade documentation" items={TRADE} />
        </div>

        <Panel title="Counterparties" subtitle={`${companies.length} companies`} dense bodyClassName="p-0">
          <table className="w-full text-[12px]">
            <thead className="label-xs">
              <tr className="[&>th]:h-8 [&>th]:px-3 [&>th]:text-left border-b border-border bg-background/50">
                <th>Company</th><th>Country</th><th>Status</th><th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-border/60 hover:bg-elevated/50">
                  <td className="px-3 h-9 font-medium">{c.name}</td>
                  <td className="px-3 font-mono text-[11px] text-muted-foreground">{c.country_code ?? "—"}</td>
                  <td className="px-3 capitalize text-muted-foreground text-[11px]">{c.status}</td>
                  <td className="px-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      <span className={cn("h-1.5 w-1.5 rounded-full",
                        c.risk_rating === "high" ? "bg-destructive" :
                        c.risk_rating === "medium" ? "bg-warning" :
                        c.risk_rating === "low" ? "bg-success" : "bg-muted-foreground/40",
                      )} />
                      {c.risk_rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}

function ChecklistPanel({ title, items }: { title: string; items: { name: string; status: string }[] }) {
  const done = items.filter((i) => i.status === "valid" || i.status === "clear").length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <Panel
      title={title}
      actions={<span className="text-[11px] font-mono text-muted-foreground">{done}/{items.length}</span>}
    >
      <div className="h-1 rounded-full bg-elevated overflow-hidden mb-3">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.name} className="flex items-center gap-2 text-[12px] py-1">
            <span className={cn("inline-flex items-center justify-center h-4 w-4 rounded font-mono text-[10px] font-bold", itemTone(i.status),
              i.status === "valid" || i.status === "clear" ? "bg-success/10" :
              i.status === "expiring" ? "bg-warning/10" :
              i.status === "expired" ? "bg-destructive/10" : "bg-muted",
            )}>{itemGlyph(i.status)}</span>
            <span className="flex-1 truncate">{i.name}</span>
            <span className={cn("text-[10px] font-mono uppercase tracking-wider", itemTone(i.status))}>{i.status}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
