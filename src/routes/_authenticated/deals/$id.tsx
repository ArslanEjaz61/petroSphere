import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StagePill } from "@/components/stage-pill";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, FileText, Sparkles } from "lucide-react";
import { DEAL_STAGES, STAGE_LABEL, type DealStage } from "@/lib/stages";
import { fmtMoney, fmtDate } from "@/lib/format";
import { useCopilot } from "@/components/ai-copilot";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { summarizeDocument } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/deals/$id")({
  head: () => ({ meta: [{ title: "Deal — PetroSphere AI" }] }),
  component: DealDetail,
});

function DealDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { ask } = useCopilot();
  const fileInput = useRef<HTMLInputElement>(null);
  const [summarizing, setSummarizing] = useState<string | null>(null);

  const { data: deal } = useQuery({
    queryKey: ["deal", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["companies_lite_deal"],
    queryFn: async () => (await supabase.from("companies").select("id,name")).data ?? [],
  });
  const { data: docs = [] } = useQuery({
    queryKey: ["deal_docs", id],
    queryFn: async () => (await supabase.from("documents").select("*").eq("deal_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  const updateStage = useMutation({
    mutationFn: async (stage: DealStage) => {
      const { error } = await supabase.from("deals").update({ stage } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Stage updated"); qc.invalidateQueries({ queryKey: ["deal", id] }); },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const { data: u } = await supabase.auth.getUser();
      const path = `${id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("documents").insert({
        deal_id: id, name: file.name, storage_path: path,
        size_bytes: file.size, mime_type: file.type, uploaded_by: u.user?.id ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("File uploaded"); qc.invalidateQueries({ queryKey: ["deal_docs", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!deal) return <div className="p-10 text-[12px] text-muted-foreground">Loading…</div>;

  const buyerName = companies.find((c) => c.id === deal.buyer_id)?.name ?? "—";
  const sellerName = companies.find((c) => c.id === deal.seller_id)?.name ?? "—";
  const dealValue = Number(deal.quantity || 0) * Number(deal.price || 0);

  const handleSummarize = async (docId: string, name: string) => {
    setSummarizing(docId);
    try {
      const r = await summarizeDocument({ data: { documentId: docId } });
      toast.success(`Summary for ${name} ready`);
      ask(`Here's a summary of ${name}:\n\n${r.summary}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSummarizing(null);
    }
  };

  const spec: [string, React.ReactNode][] = [
    ["Reference", <span className="font-mono">{deal.reference}</span>],
    ["Stage", <StagePill stage={deal.stage} />],
    ["Buyer", buyerName],
    ["Seller", sellerName],
    ["Product", deal.product_id ?? "—"],
    ["Quantity", deal.quantity ? <span className="num">{Number(deal.quantity).toLocaleString()} MT</span> : "—"],
    ["Unit price", deal.price ? <span className="num">{fmtMoney(Number(deal.price))} / MT</span> : "—"],
    ["Total value", dealValue ? <span className="num font-semibold">{fmtMoney(dealValue)}</span> : "—"],
    ["Currency", <span className="font-mono">{deal.currency ?? "USD"}</span>],
    ["Incoterm", <span className="font-mono text-muted-foreground">CIF (TBD)</span>],
    ["Created", fmtDate(deal.created_at)],
    ["Updated", fmtDate(deal.updated_at)],
  ];

  return (
    <div>
      <PageHeader
        title={deal.title}
        description={`${deal.reference} · ${buyerName} ← ${sellerName}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="h-8"><Link to="/deals"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back</Link></Button>
            <Select value={deal.stage} onValueChange={(v) => updateStage.mutate(v as DealStage)}>
              <SelectTrigger className="w-40 h-8 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>{DEAL_STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => ask(`Analyze deal ${deal.reference}: ${deal.title}. Suggest next steps.`)} size="sm" className="gap-1.5 h-8">
              <Sparkles className="h-3.5 w-3.5" /> AI analysis
            </Button>
          </>
        }
      />
      <div className="p-4 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        {/* Spec sheet */}
        <Panel title="Deal spec" dense bodyClassName="p-0">
          <table className="w-full text-[12px]">
            <tbody>
              {spec.map(([k, v]) => (
                <tr key={k} className="border-b border-border/60 last:border-0">
                  <td className="px-3 h-8 text-muted-foreground text-[11px] uppercase tracking-wider font-mono w-32">{k}</td>
                  <td className="px-3 h-8 text-right">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Tabs */}
        <Tabs defaultValue="docs">
          <TabsList className="bg-panel border border-border p-0 h-9 rounded-t rounded-b-none border-b-0">
            <TabsTrigger value="docs" className="h-9 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none">Documents ({docs.length})</TabsTrigger>
            <TabsTrigger value="timeline" className="h-9 rounded-none">Timeline</TabsTrigger>
            <TabsTrigger value="ai" className="h-9 rounded-none">AI analysis</TabsTrigger>
            <TabsTrigger value="tasks" className="h-9 rounded-none">Tasks</TabsTrigger>
          </TabsList>
          <TabsContent value="docs" className="mt-0">
            <div className="border border-border rounded-b bg-panel">
              <div className="px-3 py-2 border-b border-border">
                <input ref={fileInput} type="file" hidden
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.currentTarget.value = ""; }} />
                <Button onClick={() => fileInput.current?.click()} disabled={upload.isPending} size="sm" className="h-7 gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> {upload.isPending ? "Uploading…" : "Upload document"}
                </Button>
              </div>
              {docs.length === 0 ? (
                <div className="p-10 text-center text-[12px] text-muted-foreground">No documents yet.</div>
              ) : (
                <div className="divide-y divide-border">
                  {docs.map((d) => (
                    <div key={d.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-elevated/50">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium truncate">{d.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                          {fmtDate(d.created_at)} · {((d.size_bytes ?? 0) / 1024).toFixed(0)} KB
                        </div>
                        {d.ai_summary && (
                          <div className="text-[11px] mt-2 p-2 rounded bg-elevated border border-border line-clamp-3">
                            <span className="text-primary font-mono mr-1">AI ›</span>{d.ai_summary}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase font-mono">{d.category ?? "Other"}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleSummarize(d.id, d.name)} disabled={summarizing === d.id} className="gap-1 h-7 text-[11px]">
                        <Sparkles className="h-3 w-3" /> {summarizing === d.id ? "…" : "Summarize"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            <div className="border border-border rounded-b bg-panel p-10 text-center text-[12px] text-muted-foreground">Activity timeline coming soon.</div>
          </TabsContent>
          <TabsContent value="ai" className="mt-0">
            <div className="border border-border rounded-b bg-panel p-6 space-y-3">
              <p className="text-[12px] font-mono text-muted-foreground">Ask Copilot to analyze this deal — pricing, counterparty risk, and next steps.</p>
              <Button onClick={() => ask(`Analyze deal ${deal.reference}: ${deal.title}.`)} size="sm" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Run analysis</Button>
            </div>
          </TabsContent>
          <TabsContent value="tasks" className="mt-0">
            <div className="border border-border rounded-b bg-panel p-10 text-center text-[12px] text-muted-foreground">Task management coming soon.</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
