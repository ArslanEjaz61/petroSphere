import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/crm/contacts")({
  head: () => ({ meta: [{ title: "Contacts — PetroSphere AI" }] }),
  component: Contacts,
});

type Contact = { id: string; name: string; title: string | null; email: string | null; phone: string | null; company_id: string };
type Company = { id: string; name: string };

function Contacts() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts_all"],
    queryFn: async () => (await supabase.from("contacts").select("*").order("created_at", { ascending: false })).data as Contact[] ?? [],
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["companies_lite"],
    queryFn: async () => (await supabase.from("companies").select("id,name").order("name")).data as Company[] ?? [],
  });
  const byCompany = Object.fromEntries(companies.map((c) => [c.id, c.name]));

  const create = useMutation({
    mutationFn: async (payload: Partial<Contact>) => {
      const { error } = await supabase.from("contacts").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Contact added"); qc.invalidateQueries({ queryKey: ["contacts_all"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = contacts.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.email?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Contacts"
        description={`${contacts.length} contacts across ${companies.length} companies.`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-1.5 h-8"><Plus className="h-3.5 w-3.5" /> New contact</Button></DialogTrigger>
            <DialogContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                create.mutate({
                  name: String(fd.get("name")),
                  title: (fd.get("title") as string) || null,
                  email: (fd.get("email") as string) || null,
                  phone: (fd.get("phone") as string) || null,
                  company_id: String(fd.get("company_id")),
                });
              }}>
                <DialogHeader><DialogTitle>New contact</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="col-span-2 space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
                  <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" /></div>
                  <div className="space-y-2"><Label>Company</Label>
                    <Select name="company_id" required><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" /></div>
                  <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" /></div>
                </div>
                <DialogFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Create"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-4 space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts…" className="pl-8 h-8 text-[12px]" />
        </div>
        <Panel dense bodyClassName="p-0">
          <table className="w-full text-[12px]">
            <thead className="label-xs">
              <tr className="[&>th]:h-8 [&>th]:px-3 [&>th]:text-left border-b border-border bg-background/50">
                <th>Name</th><th>Title</th><th>Company</th><th>Email</th><th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No contacts.</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/60 hover:bg-elevated/50">
                  <td className="px-3 h-9 font-medium">{c.name}</td>
                  <td className="px-3 text-muted-foreground text-[11px]">{c.title ?? "—"}</td>
                  <td className="px-3 text-muted-foreground">{byCompany[c.company_id] ?? "—"}</td>
                  <td className="px-3 font-mono text-[11px] text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-3 font-mono text-[11px] text-muted-foreground">{c.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
