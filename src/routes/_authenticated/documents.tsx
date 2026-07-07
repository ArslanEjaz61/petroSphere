import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Input } from "@/components/ui/input";
import { FileText, Search, CheckCircle2 } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "Documents — PetroSphere AI" }] }),
  component: Documents,
});

const CATEGORIES = ["All", "LOI", "ICPO", "FCO", "SPA", "POP", "SGS", "B/L", "Invoice", "Other"];

function Documents() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ["all_docs"],
    queryFn: async () => (await supabase.from("documents").select("*, deals(id,reference,title)").order("created_at", { ascending: false })).data ?? [],
  });
  const filtered = docs.filter((d) =>
    (!q || d.name.toLowerCase().includes(q.toLowerCase()))
    && (cat === "All" || (d.category ?? "Other").toLowerCase() === cat.toLowerCase()),
  );
  const selected = filtered.find((d) => d.id === selectedId) ?? filtered[0];

  return (
    <div>
      <PageHeader
        title="Documents"
        description={`${docs.length} files · ${docs.filter((d) => d.ai_summary).length} AI-summarized`}
      />
      <div className="p-4 grid grid-cols-1 xl:grid-cols-[200px_1fr_360px] gap-4">
        {/* Category rail */}
        <Panel title="Categories" dense bodyClassName="p-1">
          {CATEGORIES.map((c) => {
            const count = c === "All" ? docs.length : docs.filter((d) => (d.category ?? "Other").toLowerCase() === c.toLowerCase()).length;
            const active = cat === c;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 h-8 rounded text-[12px] transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-elevated hover:text-foreground",
                )}
              >
                <span>{c}</span>
                <span className="text-[10px] font-mono">{count}</span>
              </button>
            );
          })}
        </Panel>

        {/* Table */}
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents…" className="pl-8 h-8 text-[12px]" />
          </div>
          <Panel dense bodyClassName="p-0">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-[12px] text-muted-foreground">No documents match.</div>
            ) : (
              <table className="w-full text-[12px]">
                <thead className="label-xs">
                  <tr className="[&>th]:h-8 [&>th]:px-3 [&>th]:text-left border-b border-border bg-background/50">
                    <th>Name</th><th>Deal</th><th>Category</th><th className="text-right">Uploaded</th><th className="text-center w-10">AI</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      className={cn(
                        "border-b border-border/60 cursor-pointer transition-colors",
                        selected?.id === d.id ? "bg-primary/5" : "hover:bg-elevated/50",
                      )}
                    >
                      <td className="px-3 h-9">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-3 text-[11px] text-muted-foreground">
                        {d.deals ? <Link to="/deals/$id" params={{ id: d.deals.id }} className="hover:text-primary font-mono">{d.deals.reference}</Link> : "—"}
                      </td>
                      <td className="px-3">
                        <span className="inline-flex items-center px-1.5 h-5 rounded text-[10px] font-mono uppercase tracking-wider border border-border bg-muted">
                          {d.category ?? "Other"}
                        </span>
                      </td>
                      <td className="px-3 text-right text-[11px] text-muted-foreground">{fmtDate(d.created_at)}</td>
                      <td className="px-3 text-center">
                        {d.ai_summary ? <CheckCircle2 className="h-3.5 w-3.5 text-success inline" /> : <span className="text-muted-foreground/40">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        {/* Preview */}
        <Panel title={selected ? "Preview" : "No selection"} dense bodyClassName="p-4">
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="font-medium text-[13px] truncate">{selected.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 text-[11px] pt-2 border-t border-border">
                <span className="text-muted-foreground">Uploaded</span><span className="text-right font-mono">{fmtDate(selected.created_at)}</span>
                <span className="text-muted-foreground">Size</span><span className="text-right font-mono">{((selected.size_bytes ?? 0) / 1024).toFixed(0)} KB</span>
                <span className="text-muted-foreground">Category</span><span className="text-right font-mono uppercase">{selected.category ?? "Other"}</span>
                {selected.deals && (<><span className="text-muted-foreground">Deal</span><span className="text-right font-mono truncate">{selected.deals.reference}</span></>)}
              </div>
              {selected.ai_summary ? (
                <div className="pt-2 border-t border-border">
                  <div className="label-xs mb-1.5">AI summary</div>
                  <div className="text-[12px] leading-relaxed bg-elevated border border-border rounded p-2.5 font-mono">
                    <span className="text-primary">›</span> {selected.ai_summary}
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-border text-[11px] text-muted-foreground italic">
                  No AI summary yet — open the deal to generate one.
                </div>
              )}
            </div>
          ) : (
            <div className="text-[12px] text-muted-foreground text-center py-8">Select a document to preview.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
