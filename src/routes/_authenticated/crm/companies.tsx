import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/crm/companies")({
  head: () => ({ meta: [{ title: "Companies — PetroSphere AI" }] }),
  component: Companies,
});

type Company = {
  id: string; name: string; type: string; status: string; country_code: string | null;
  risk_rating: string; website: string | null; tags: string[];
};
type Country = { code: string; name: string };

const TYPES = ["supplier","buyer","broker","refinery","inspection","storage","shipping","bank","other"];
const STATUSES = ["prospect","active","onboarding","blocked","archived"];
const RISKS = ["unknown","low","medium","high"];

const riskDot = (r: string) =>
  r === "high" ? "bg-destructive" :
  r === "medium" ? "bg-warning" :
  r === "low" ? "bg-success" :
  "bg-muted-foreground/40";

const statusTone = (s: string) =>
  s === "active" ? "text-success bg-success/10 border-success/20" :
  s === "blocked" ? "text-destructive bg-destructive/10 border-destructive/20" :
  s === "onboarding" ? "text-warning bg-warning/10 border-warning/20" :
  "text-muted-foreground bg-muted border-border";

function Companies() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Company[];
    },
  });
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data } = await supabase.from("countries").select("code,name").order("name");
      return (data ?? []) as Country[];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("companies").insert({ ...payload, created_by: u.user?.id ?? null } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Company added"); qc.invalidateQueries({ queryKey: ["companies"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = companies.filter((c) =>
    (!q || c.name.toLowerCase().includes(q.toLowerCase()) || c.country_code?.toLowerCase().includes(q.toLowerCase()))
    && (filterType === "all" || c.type === filterType)
    && (filterRisk === "all" || c.risk_rating === filterRisk)
  );

  const byRisk = {
    high: companies.filter((c) => c.risk_rating === "high").length,
    medium: companies.filter((c) => c.risk_rating === "medium").length,
    low: companies.filter((c) => c.risk_rating === "low").length,
  };

  return (
    <div>
      <PageHeader
        title="Companies"
        description={`${companies.length} counterparties · ${byRisk.high} high-risk · ${byRisk.medium} medium · ${byRisk.low} low`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8"><Plus className="h-3.5 w-3.5" /> New company</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                create.mutate({
                  name: String(fd.get("name")),
                  type: String(fd.get("type")),
                  status: String(fd.get("status")),
                  country_code: (fd.get("country_code") as string) || null,
                  risk_rating: String(fd.get("risk_rating")),
                  website: (fd.get("website") as string) || null,
                  notes: (fd.get("notes") as string) || null,
                });
              }}>
                <DialogHeader><DialogTitle>New company</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="col-span-2 space-y-2"><Label htmlFor="name">Company name</Label><Input id="name" name="name" required /></div>
                  <div className="space-y-2"><Label>Type</Label>
                    <Select name="type" defaultValue="buyer"><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Status</Label>
                    <Select name="status" defaultValue="prospect"><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Country</Label>
                    <Select name="country_code"><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>{countries.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Risk</Label>
                    <Select name="risk_rating" defaultValue="unknown"><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{RISKS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                  <div className="col-span-2 space-y-2"><Label htmlFor="website">Website</Label><Input id="website" name="website" type="url" placeholder="https://" /></div>
                  <div className="col-span-2 space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" rows={3} /></div>
                </div>
                <DialogFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Create"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-4 space-y-3">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies…" className="pl-8 h-8 text-[12px]" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36 h-8 text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRisk} onValueChange={setFilterRisk}>
            <SelectTrigger className="w-32 h-8 text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk</SelectItem>
              {RISKS.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-[11px] font-mono text-muted-foreground ml-auto">{filtered.length} of {companies.length}</span>
        </div>

        <Panel dense bodyClassName="p-0">
          <table className="w-full text-[12px]">
            <thead className="label-xs">
              <tr className="[&>th]:h-8 [&>th]:px-3 [&>th]:text-left border-b border-border bg-background/50">
                <th>Company</th>
                <th>Type</th>
                <th>Country</th>
                <th>Status</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No companies match.</td></tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/60 hover:bg-elevated/50 transition-colors">
                  <td className="px-3 h-9">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-elevated border border-border flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <Link to="/crm/companies/$id" params={{ id: c.id }} className="font-medium hover:text-primary truncate">{c.name}</Link>
                    </div>
                  </td>
                  <td className="px-3 capitalize text-muted-foreground text-[11px]">{c.type}</td>
                  <td className="px-3 font-mono text-muted-foreground text-[11px]">{c.country_code ?? "—"}</td>
                  <td className="px-3">
                    <span className={cn("inline-flex items-center px-1.5 h-5 rounded text-[10px] uppercase tracking-wider border font-mono", statusTone(c.status))}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      <span className={cn("h-1.5 w-1.5 rounded-full", riskDot(c.risk_rating))} />
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
