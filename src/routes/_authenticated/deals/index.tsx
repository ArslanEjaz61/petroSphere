import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StagePill } from "@/components/stage-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, LayoutGrid, Rows3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DEAL_STAGES, STAGE_LABEL, type DealStage } from "@/lib/stages";
import { fmtMoney, fmtRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/deals/")({
  head: () => ({ meta: [{ title: "Deals — PetroSphere AI" }] }),
  component: Deals,
});

function Deals() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"table" | "kanban">("table");

  const { data: deals = [] } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["companies_lite_deals"],
    queryFn: async () => (await supabase.from("companies").select("id,name").order("name")).data ?? [],
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await supabase.from("products").select("id,name").order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async (p: Record<string, unknown>) => {
      const { data: u } = await supabase.auth.getUser();
      const ref = `DL-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("deals").insert({
        ...p, reference: ref, stage: "lead", currency: "USD", unit: "MT", created_by: u.user?.id ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deal created"); qc.invalidateQueries({ queryKey: ["deals"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: DealStage }) => {
      const { error } = await supabase.from("deals").update({ stage } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });

  const byStage: Record<string, typeof deals> = Object.fromEntries(DEAL_STAGES.map((s) => [s, []]));
  for (const d of deals) (byStage[d.stage] ||= []).push(d);

  const dealValue = (d: typeof deals[number]) => Number(d.quantity || 0) * Number(d.price || 0);
  const total = deals.reduce((a, d) => a + dealValue(d), 0);
  const companyName = (id: string | null) => companies.find((c) => c.id === id)?.name ?? "—";
  const productName = (id: string | null) => products.find((p) => p.id === id)?.name ?? "—";

  return (
    <div>
      <PageHeader
        title="Deals"
        description={`${deals.length} active · Pipeline ${fmtMoney(total)}`}
        actions={
          <>
            <div className="hidden sm:flex items-center border border-border rounded overflow-hidden">
              <button
                onClick={() => setView("table")}
                className={cn("h-8 px-2.5 text-[12px] flex items-center gap-1.5", view === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-elevated")}
              ><Rows3 className="h-3.5 w-3.5" /> Table</button>
              <button
                onClick={() => setView("kanban")}
                className={cn("h-8 px-2.5 text-[12px] flex items-center gap-1.5 border-l border-border", view === "kanban" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-elevated")}
              ><LayoutGrid className="h-3.5 w-3.5" /> Pipeline</button>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm" className="gap-1.5 h-8"><Plus className="h-3.5 w-3.5" /> New deal</Button></DialogTrigger>
              <DialogContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  create.mutate({
                    title: String(fd.get("title")),
                    buyer_id: (fd.get("buyer_id") as string) || null,
                    seller_id: (fd.get("seller_id") as string) || null,
                    product_id: (fd.get("product_id") as string) || null,
                    quantity: Number(fd.get("quantity") || 0) || null,
                    price: Number(fd.get("price") || 0) || null,
                  });
                }}>
                  <DialogHeader><DialogTitle>New deal</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="col-span-2 space-y-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" required placeholder="e.g. 30k MT EN590 to Lagos" /></div>
                    <div className="space-y-2"><Label>Buyer</Label>
                      <Select name="buyer_id"><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-2"><Label>Seller</Label>
                      <Select name="seller_id"><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-2"><Label>Product</Label>
                      <Select name="product_id"><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="quantity">Quantity (MT)</Label><Input id="quantity" name="quantity" type="number" step="any" /></div>
                    <div className="space-y-2"><Label htmlFor="price">Price / MT (USD)</Label><Input id="price" name="price" type="number" step="any" /></div>
                  </div>
                  <DialogFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Create"}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="p-4">
        {view === "table" ? (
          <Panel dense bodyClassName="p-0">
            <div className="overflow-auto">
              <table className="w-full text-[12px]">
                <thead className="label-xs">
                  <tr className="[&>th]:h-8 [&>th]:px-3 [&>th]:text-left border-b border-border bg-background/50">
                    <th>Reference</th>
                    <th>Deal</th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th>Product</th>
                    <th className="text-right">Qty (MT)</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Value</th>
                    <th>Stage</th>
                    <th className="text-right">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.length === 0 && (
                    <tr><td colSpan={10} className="p-12 text-center text-muted-foreground">No deals yet.</td></tr>
                  )}
                  {deals.map((d) => (
                    <tr key={d.id} className="border-b border-border/60 hover:bg-elevated/50 transition-colors">
                      <td className="px-3 h-9 font-mono text-muted-foreground">
                        <Link to="/deals/$id" params={{ id: d.id }} className="hover:text-primary">{d.reference}</Link>
                      </td>
                      <td className="px-3 font-medium">
                        <Link to="/deals/$id" params={{ id: d.id }} className="hover:text-primary">{d.title}</Link>
                      </td>
                      <td className="px-3 text-muted-foreground">{companyName(d.buyer_id)}</td>
                      <td className="px-3 text-muted-foreground">{companyName(d.seller_id)}</td>
                      <td className="px-3 text-[11px] text-muted-foreground">{productName(d.product_id)}</td>
                      <td className="px-3 text-right num">{d.quantity ? Number(d.quantity).toLocaleString() : "—"}</td>
                      <td className="px-3 text-right num">{d.price ? Number(d.price).toFixed(2) : "—"}</td>
                      <td className="px-3 text-right num font-medium">{dealValue(d) ? fmtMoney(dealValue(d)) : "—"}</td>
                      <td className="px-3"><StagePill stage={d.stage} /></td>
                      <td className="px-3 text-right text-[11px] text-muted-foreground">{fmtRelative(d.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-4">
              {DEAL_STAGES.map((s) => {
                const stageDeals = byStage[s] ?? [];
                const stageVal = stageDeals.reduce((a, d) => a + dealValue(d), 0);
                return (
                  <div key={s} className="w-64 shrink-0">
                    <div className="flex items-center justify-between px-2 h-8 bg-panel border border-border border-b-0 rounded-t">
                      <span className="label-xs">{STAGE_LABEL[s]}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {stageDeals.length} · {stageVal ? fmtMoney(stageVal) : "—"}
                      </span>
                    </div>
                    <div
                      className="space-y-1.5 min-h-[60vh] bg-background border border-border border-t-0 rounded-b p-1.5"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const id = e.dataTransfer.getData("deal");
                        if (id) move.mutate({ id, stage: s });
                      }}
                    >
                      {stageDeals.map((d) => (
                        <div
                          key={d.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("deal", d.id)}
                          className="bg-panel border border-border rounded p-2.5 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
                        >
                          <Link to="/deals/$id" params={{ id: d.id }} className="block">
                            <div className="text-[10px] font-mono text-muted-foreground">{d.reference}</div>
                            <div className="text-[12px] font-medium mt-1 line-clamp-2 leading-snug">{d.title}</div>
                            <div className="text-[10px] text-muted-foreground mt-2 truncate">
                              {companyName(d.buyer_id)} ← {companyName(d.seller_id)}
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate">{productName(d.product_id)}</span>
                              <span className="num text-[11px] font-semibold">{dealValue(d) ? fmtMoney(dealValue(d)) : "—"}</span>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
