import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, Sparkles, LogOut, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { useCopilot } from "@/components/ai-copilot";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

const CRUMBS: Record<string, string> = {
  dashboard: "Dashboard",
  market: "Market Intelligence",
  crm: "Network",
  companies: "Companies",
  contacts: "Contacts",
  deals: "Deals",
  documents: "Documents",
  compliance: "Compliance",
  tasks: "Tasks",
  reports: "Reports",
  settings: "Settings",
};

function useCrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p, i) => ({
    label: CRUMBS[p] ?? decodeURIComponent(p),
    href: "/" + parts.slice(0, i + 1).join("/"),
    isLast: i === parts.length - 1,
  }));
}

export function TopBar() {
  const navigate = useNavigate();
  const { setOpen } = useCopilot();
  const [email, setEmail] = useState<string>("");
  const crumbs = useCrumbs();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? "demo@petrosphere.ai"));
  }, []);
  const initials = email ? email.slice(0, 2).toUpperCase() : "PS";

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const now = new Date();
  const dateChip = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeChip = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <header className="h-14 border-b border-border bg-panel flex items-center gap-3 px-3 sticky top-0 z-10">
      <SidebarTrigger className="-ml-1 h-8 w-8" />

      {/* Breadcrumb */}
      <nav className="hidden md:flex items-center gap-1 text-[12px] min-w-0">
        {crumbs.length === 0 && <span className="text-muted-foreground">Home</span>}
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
            {c.isLast ? (
              <span className="text-foreground font-medium truncate">{c.label}</span>
            ) : (
              <Link to={c.href} className="text-muted-foreground hover:text-foreground truncate">{c.label}</Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative w-full max-w-sm hidden sm:block">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search deals, companies, cargoes…"
          className="pl-8 h-8 text-[12px] bg-background border-border font-mono placeholder:text-muted-foreground/60"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:inline-flex text-[9px] font-mono bg-muted px-1 py-0.5 rounded border border-border text-muted-foreground">⌘K</kbd>
      </div>

      <div className="flex-1" />

      {/* Env & clock chip */}
      <div className="hidden lg:flex items-center gap-1.5 h-8 px-2 rounded border border-border bg-background text-[11px] font-mono text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
        <span>{dateChip}</span>
        <span className="text-muted-foreground/40">·</span>
        <span>{timeChip} UTC</span>
      </div>

      <ThemeToggle />

      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="hidden sm:inline text-[12px]">Copilot</span>
      </Button>

      <Button variant="ghost" size="icon" className="h-8 w-8 relative">
        <Bell className="h-4 w-4" />
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px] font-mono bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Signed in as</div>
            <div className="text-sm font-medium truncate">{email || "demo@petrosphere.ai"}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
