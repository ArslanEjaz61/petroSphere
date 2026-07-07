import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, TrendingUp, Building2, Users, Briefcase, FileText,
  ShieldCheck, ListTodo, BarChart3, Settings, Droplets, Ship,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Market Intelligence", url: "/market", icon: TrendingUp },
      { title: "Live Tracking", url: "/tracking", icon: Ship },
    ],
  },
  {
    label: "Network",
    items: [
      { title: "Companies", url: "/crm/companies", icon: Building2 },
      { title: "Contacts", url: "/crm/contacts", icon: Users },
    ],
  },
  {
    label: "Trade",
    items: [
      { title: "Deals", url: "/deals", icon: Briefcase },
      { title: "Documents", url: "/documents", icon: FileText },
      { title: "Compliance", url: "/compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Tasks", url: "/tasks", icon: ListTodo },
      { title: "Reports", url: "/reports", icon: BarChart3 },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border h-14 justify-center">
        <div className="flex items-center gap-2 px-2">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center shrink-0">
            <Droplets className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-semibold text-sidebar-foreground tracking-tight">PetroSphere</span>
              <span className="text-[9px] uppercase tracking-[0.14em] text-sidebar-foreground/45 font-mono">Trading OS</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {SECTIONS.map((section) => (
          <SidebarGroup key={section.label} className="py-2">
            {!collapsed && (
              <SidebarGroupLabel className="text-[9px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40 px-3 h-6">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                {section.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title} className="h-8 rounded-none relative">
                        <Link to={item.url} className="flex items-center gap-2.5 pl-3">
                          <span className={cn(
                            "absolute left-0 top-0 bottom-0 w-[2px] transition-colors",
                            active ? "bg-primary" : "bg-transparent",
                          )} />
                          <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-sidebar-foreground/70")} />
                          {!collapsed && (
                            <span className={cn("text-[13px]", active ? "text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/80")}>
                              {item.title}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-3 py-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-sidebar-foreground/40">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            MVP v1.0 · Live
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
