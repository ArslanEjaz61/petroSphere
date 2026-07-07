import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — PetroSphere AI" }] }),
  component: Tasks,
});

type Task = { id: string; title: string; due: string; priority: "high"|"medium"|"low"; status: "todo"|"working"|"waiting"|"done"; deal?: string };

const SEED: Task[] = [
  { id: "1", title: "Review SPA draft from Aramco Trading", due: "Today", priority: "high", status: "todo", deal: "DL-A9K3" },
  { id: "2", title: "Send updated FCO to Vitol Singapore", due: "Today", priority: "high", status: "working", deal: "DL-8B22" },
  { id: "3", title: "Collect POP from Petrosphere refinery", due: "Tomorrow", priority: "medium", status: "waiting", deal: "DL-7C11" },
  { id: "4", title: "Schedule SGS inspection at Fujairah", due: "Wed", priority: "medium", status: "todo", deal: "DL-A9K3" },
  { id: "5", title: "Renew KYC for Mercuria Energy", due: "Fri", priority: "low", status: "todo" },
];

const prioTone = (p: string) =>
  p === "high" ? "bg-destructive/10 text-destructive border-destructive/20" :
  p === "medium" ? "bg-warning/10 text-warning border-warning/20" :
  "bg-muted text-muted-foreground border-border";

const statusTone = (s: string) =>
  s === "done" ? "bg-success/10 text-success border-success/20" :
  s === "working" ? "bg-primary/10 text-primary border-primary/20" :
  s === "waiting" ? "bg-warning/10 text-warning border-warning/20" :
  "bg-muted text-muted-foreground border-border";

function Tasks() {
  const [items, setItems] = useState(SEED);
  const [draft, setDraft] = useState("");

  const toggle = (id: string) => setItems((arr) => arr.map((t) => t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setItems((arr) => [{ id: crypto.randomUUID(), title: draft.trim(), due: "Later", priority: "medium", status: "todo" }, ...arr]);
    setDraft("");
  };

  return (
    <div>
      <PageHeader title="Tasks" description={`${items.filter(t=>t.status!=="done").length} open · ${items.filter(t=>t.priority==="high"&&t.status!=="done").length} high priority`} />
      <div className="p-4">
        <Panel dense bodyClassName="p-0">
          <form onSubmit={add} className="flex items-center gap-2 px-3 h-10 border-b border-border bg-background/50">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add task and press enter…"
              className="h-7 border-0 shadow-none focus-visible:ring-0 text-[12px] bg-transparent"
            />
            <Button type="submit" size="sm" className="h-7 text-[11px]" disabled={!draft.trim()}>Add</Button>
          </form>
          <table className="w-full text-[12px]">
            <thead className="label-xs">
              <tr className="[&>th]:h-8 [&>th]:px-3 [&>th]:text-left border-b border-border bg-background/50">
                <th className="w-8"></th>
                <th>Task</th>
                <th>Deal</th>
                <th>Due</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-b border-border/60 hover:bg-elevated/50">
                  <td className="px-3 h-9"><Checkbox checked={t.status === "done"} onCheckedChange={() => toggle(t.id)} /></td>
                  <td className={cn("px-3 font-medium", t.status === "done" && "line-through text-muted-foreground")}>{t.title}</td>
                  <td className="px-3 font-mono text-[11px] text-muted-foreground">{t.deal ?? "—"}</td>
                  <td className="px-3 text-[11px] text-muted-foreground">{t.due}</td>
                  <td className="px-3">
                    <span className={cn("inline-flex items-center px-1.5 h-5 rounded text-[10px] font-mono uppercase tracking-wider border", prioTone(t.priority))}>{t.priority}</span>
                  </td>
                  <td className="px-3">
                    <span className={cn("inline-flex items-center px-1.5 h-5 rounded text-[10px] font-mono uppercase tracking-wider border", statusTone(t.status))}>{t.status}</span>
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
