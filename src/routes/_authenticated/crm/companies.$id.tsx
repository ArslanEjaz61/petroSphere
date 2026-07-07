import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StagePill } from "@/components/stage-pill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Globe, MapPin } from "lucide-react";
import { useCopilot } from "@/components/ai-copilot";
import { fmtDate } from "@/lib/format";
import type { DealStage } from "@/lib/stages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/crm/companies/$id")({
  head: () => ({ meta: [{ title: "Company — PetroSphere AI" }] }),
  component: CompanyDetail,
});

const riskTone = (r: string) =>
  r === "high" ? "text-destructive bg-destructive/10 border-destructive/20" :
  r === "medium" ? "text-warning bg-warning/10 border-warning/20" :
  r === "low" ? "text-success bg-success/10 border-success/20" :
  "text-muted-foreground bg-muted border-border";

function CompanyDetail() {
  const { id } = Route.useParams();
  const { ask } = useCopilot();

  const { data: c } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const { data: contacts = [] } = useQuery({
    queryKey: ["company_contacts", id],
    queryFn: async () => (await supabase.from("contacts").select("*").eq("company_id", id)).data ?? [],
  });
  const { data: deals = [] } = useQuery({
    queryKey: ["company_deals", id],
    queryFn: async () => (await supabase.from("deals").select("id,reference,title,stage,updated_at").or(`buyer_id.eq.${id},seller_id.eq.${id}`)).data ?? [],
  });

  if (!c) return <div className="p-10 text-[12px] text-muted-foreground">Loading…</div>;

  const meta: [string, React.ReactNode][] = [
    ["Type", <span className="capitalize">{c.type}</span>],
    ["Status", <span className="capitalize">{c.status}</span>],
    ["Country", <span className="font-mono">{c.country_code ?? "—"}</span>],
    ["Risk", <span className={cn("inline-flex px-1.5 h-5 items-center rounded text-[10px] font-mono uppercase tracking-wider border", riskTone(c.risk_rating))}>{c.risk_rating}</span>],
    ["Deals", <span className="num">{deals.length}</span>],
    ["Contacts", <span className="num">{contacts.length}</span>],
  ];

  return (
    <div>
      <PageHeader
        title={c.name}
        description={`${c.type[0].toUpperCase() + c.type.slice(1)} · ${c.country_code ?? "—"}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="h-8"><Link to="/crm/companies"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back</Link></Button>
            <Button onClick={() => ask(`Give me a profile summary of ${c.name}, including risks and recent activity.`)} size="sm" className="gap-1.5 h-8">
              <Sparkles className="h-3.5 w-3.5" /> AI summary
            </Button>
          </>
        }
      />
      <div className="p-4 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="space-y-3">
          <Panel dense bodyClassName="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded bg-elevated border border-border flex items-center justify-center font-mono text-muted-foreground">
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[14px] truncate">{c.name}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3" /> {c.country_code ?? "—"}
                </div>
              </div>
            </div>
            {c.website && (
              <a href={c.website} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1.5 text-[11px] text-primary hover:underline truncate">
                <Globe className="h-3 w-3 shrink-0" /> {c.website}
              </a>
            )}
          </Panel>

          <Panel title="Attributes" dense bodyClassName="p-0">
            <table className="w-full text-[12px]">
              <tbody>
                {meta.map(([k, v]) => (
                  <tr key={k} className="border-b border-border/60 last:border-0">
                    <td className="px-3 h-8 text-[11px] text-muted-foreground uppercase tracking-wider font-mono w-24">{k}</td>
                    <td className="px-3 h-8 text-right">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="bg-panel border border-border p-0 h-9 rounded-t rounded-b-none border-b-0">
            <TabsTrigger value="overview" className="h-9 rounded-none">Overview</TabsTrigger>
            <TabsTrigger value="contacts" className="h-9 rounded-none">Contacts ({contacts.length})</TabsTrigger>
            <TabsTrigger value="deals" className="h-9 rounded-none">Deals ({deals.length})</TabsTrigger>
            <TabsTrigger value="docs" className="h-9 rounded-none">Documents</TabsTrigger>
            <TabsTrigger value="timeline" className="h-9 rounded-none">Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-0">
            <div className="border border-border rounded-b bg-panel p-4 space-y-2">
              <div className="label-xs">Notes</div>
              <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{c.notes || <span className="text-muted-foreground">No notes yet.</span>}</p>
            </div>
          </TabsContent>
          <TabsContent value="contacts" className="mt-0">
            <div className="border border-border rounded-b bg-panel">
              {contacts.length === 0 ? (
                <div className="p-10 text-center text-[12px] text-muted-foreground">No contacts yet.</div>
              ) : (
                <table className="w-full text-[12px]">
                  <thead className="label-xs">
                    <tr className="[&>th]:h-8 [&>th]:px-3 [&>th]:text-left border-b border-border">
                      <th>Name</th><th>Title</th><th>Email</th><th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((ct) => (
                      <tr key={ct.id} className="border-b border-border/60 last:border-0 hover:bg-elevated/50">
                        <td className="px-3 h-8 font-medium">{ct.name}</td>
                        <td className="px-3 text-muted-foreground text-[11px]">{ct.title ?? "—"}</td>
                        <td className="px-3 font-mono text-[11px] text-muted-foreground">{ct.email ?? "—"}</td>
                        <td className="px-3 font-mono text-[11px] text-muted-foreground">{ct.phone ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
          <TabsContent value="deals" className="mt-0">
            <div className="border border-border rounded-b bg-panel">
              {deals.length === 0 ? (
                <div className="p-10 text-center text-[12px] text-muted-foreground">No deals with this company yet.</div>
              ) : (
                <div className="divide-y divide-border">
                  {deals.map((d) => (
                    <Link key={d.id} to="/deals/$id" params={{ id: d.id }} className="flex items-center gap-3 px-3 h-9 hover:bg-elevated/50 text-[12px]">
                      <span className="font-mono text-muted-foreground w-24 shrink-0">{d.reference}</span>
                      <span className="flex-1 truncate">{d.title}</span>
                      <StagePill stage={d.stage as DealStage} />
                      <span className="text-[11px] text-muted-foreground w-24 text-right">{fmtDate(d.updated_at)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="docs" className="mt-0">
            <div className="border border-border rounded-b bg-panel p-10 text-center text-[12px] text-muted-foreground">Documents view coming soon.</div>
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            <div className="border border-border rounded-b bg-panel p-10 text-center text-[12px] text-muted-foreground">Activity timeline coming soon.</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
