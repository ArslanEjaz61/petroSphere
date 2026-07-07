import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatTile } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import { Ship, Anchor, Navigation, Radio, Activity, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import worldFlows from "@/assets/world-flows.jpg";
import { useCopilot } from "@/components/ai-copilot";

export const Route = createFileRoute("/_authenticated/tracking")({
  head: () => ({
    meta: [
      { title: "Live Tracking — PetroSphere AI" },
      { name: "description", content: "Real-time vessel and cargo tracking across global oil trade routes." },
    ],
  }),
  component: Tracking,
});

type Vessel = {
  id: string;
  name: string;
  imo: string;
  type: "VLCC" | "Suezmax" | "Aframax" | "LR2" | "MR" | "LNGC";
  cargo: string;
  volume: string;
  origin: string;
  destination: string;
  eta: string;
  speedKts: number;
  status: "underway" | "loading" | "discharging" | "anchored" | "delayed";
  dealRef: string;
  // route as % coordinates on the map image (0-100)
  from: { x: number; y: number };
  to: { x: number; y: number };
};

// approximate positions on the world map image (percent)
const P = {
  fujairah: { x: 62, y: 44 },
  rasTanura: { x: 60, y: 42 },
  rotterdam: { x: 48, y: 30 },
  houston: { x: 22, y: 43 },
  singapore: { x: 74, y: 55 },
  mumbai: { x: 66, y: 47 },
  lagos: { x: 46, y: 57 },
  santos: { x: 33, y: 70 },
  jebelAli: { x: 62, y: 44 },
  ningbo: { x: 82, y: 43 },
  tokyo: { x: 86, y: 40 },
};

const VESSELS: Vessel[] = [
  { id: "v1", name: "MT Sea Falcon", imo: "9758421", type: "Suezmax", cargo: "Bonny Light", volume: "950,000 bbl",
    origin: "Lagos", destination: "Rotterdam", eta: "Jul 12 · 14:20 UTC", speedKts: 12.4, status: "underway",
    dealRef: "DL-2026-0108", from: P.lagos, to: P.rotterdam },
  { id: "v2", name: "MT Arabian Star", imo: "9821334", type: "VLCC", cargo: "Arab Light Crude", volume: "2,000,000 bbl",
    origin: "Ras Tanura", destination: "Rotterdam", eta: "Jul 22 · 09:00 UTC", speedKts: 13.1, status: "loading",
    dealRef: "DL-2026-0142", from: P.rasTanura, to: P.rotterdam },
  { id: "v3", name: "MT Gulf Pearl", imo: "9743012", type: "LR2", cargo: "Diesel EN590", volume: "500,000 MT",
    origin: "Fujairah", destination: "Mumbai", eta: "Jul 15 · 22:10 UTC", speedKts: 14.8, status: "underway",
    dealRef: "DL-2026-0138", from: P.fujairah, to: P.mumbai },
  { id: "v4", name: "MT Nordic Spirit", imo: "9611228", type: "MR", cargo: "Jet A1", volume: "60,000 MT",
    origin: "Rotterdam", destination: "Rotterdam", eta: "Aug 01 · 11:30 UTC", speedKts: 0, status: "loading",
    dealRef: "DL-2026-0153", from: P.rotterdam, to: P.rotterdam },
  { id: "v5", name: "MT Pacific Voyager", imo: "9689554", type: "LNGC", cargo: "LNG", volume: "70,000 MT",
    origin: "Rotterdam", destination: "Rotterdam", eta: "Jul 12 · 18:00 UTC", speedKts: 0, status: "discharging",
    dealRef: "DL-2026-0112", from: P.rotterdam, to: P.rotterdam },
  { id: "v6", name: "MT Southern Cross", imo: "9701882", type: "Aframax", cargo: "WTI Crude", volume: "750,000 bbl",
    origin: "Houston", destination: "Rotterdam", eta: "Aug 05 · 06:45 UTC", speedKts: 11.9, status: "underway",
    dealRef: "DL-2026-0128", from: P.houston, to: P.rotterdam },
  { id: "v7", name: "MT Emerald Sky", imo: "9822144", type: "MR", cargo: "Fuel Oil 380cst", volume: "80,000 MT",
    origin: "Singapore", destination: "Singapore", eta: "Aug 12 · 03:15 UTC", speedKts: 0, status: "anchored",
    dealRef: "DL-2026-0151", from: P.singapore, to: P.singapore },
  { id: "v8", name: "MT Orion Trader", imo: "9558410", type: "VLCC", cargo: "Kuwait Export Crude", volume: "1,000,000 bbl",
    origin: "Ras Tanura", destination: "Ningbo", eta: "Jul 28 · 21:00 UTC", speedKts: 12.7, status: "underway",
    dealRef: "DL-2026-0130", from: P.rasTanura, to: P.ningbo },
  { id: "v9", name: "MT Aegean Dawn", imo: "9633891", type: "Aframax", cargo: "Murban Crude", volume: "1,200,000 bbl",
    origin: "Fujairah", destination: "Houston", eta: "Aug 08 · 15:40 UTC", speedKts: 13.5, status: "loading",
    dealRef: "DL-2026-0152", from: P.fujairah, to: P.houston },
  { id: "v10", name: "MT Baltic Ranger", imo: "9701099", type: "Suezmax", cargo: "Urals Crude", volume: "800,000 bbl",
    origin: "Novorossiysk", destination: "Singapore", eta: "—", speedKts: 0, status: "delayed",
    dealRef: "DL-2026-0098", from: { x: 55, y: 33 }, to: P.singapore },
  { id: "v11", name: "MT Sahara Wind", imo: "9788221", type: "LR2", cargo: "Naphtha", volume: "45,000 MT",
    origin: "Fujairah", destination: "Singapore", eta: "Jul 19 · 08:30 UTC", speedKts: 14.2, status: "underway",
    dealRef: "DL-2026-0155", from: P.fujairah, to: P.singapore },
  { id: "v12", name: "MT Silver Horizon", imo: "9812009", type: "MR", cargo: "Gasoline 95", volume: "40,000 MT",
    origin: "Rotterdam", destination: "Lagos", eta: "Jul 24 · 12:00 UTC", speedKts: 12.9, status: "underway",
    dealRef: "DL-2026-0156", from: P.rotterdam, to: P.lagos },
];

const STATUS_STYLE: Record<Vessel["status"], { label: string; dot: string; text: string; bg: string }> = {
  underway: { label: "Underway", dot: "bg-success animate-pulse", text: "text-success", bg: "bg-success/10 border-success/20" },
  loading: { label: "Loading", dot: "bg-primary animate-pulse", text: "text-primary", bg: "bg-primary/10 border-primary/20" },
  discharging: { label: "Discharging", dot: "bg-primary animate-pulse", text: "text-primary", bg: "bg-primary/10 border-primary/20" },
  anchored: { label: "Anchored", dot: "bg-warning", text: "text-warning", bg: "bg-warning/10 border-warning/20" },
  delayed: { label: "Delayed", dot: "bg-destructive animate-pulse", text: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
};

// interpolate position along a curved great-circle-ish path
function pointOnRoute(from: { x: number; y: number }, to: { x: number; y: number }, t: number) {
  // quadratic bezier with a control point pushed upward for a nice arc
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2 - Math.min(18, Math.abs(to.x - from.x) * 0.25);
  const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * midX + t * t * to.x;
  const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * midY + t * t * to.y;
  return { x, y };
}

function routePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2 - Math.min(18, Math.abs(to.x - from.x) * 0.25);
  return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

function Tracking() {
  const { ask } = useCopilot();
  const [selectedId, setSelectedId] = useState<string>("v1");
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(new Date());

  // Progress state per vessel, animated
  const [progress, setProgress] = useState<Record<string, number>>(() =>
    Object.fromEntries(VESSELS.map((v, i) => [v.id, (i * 0.11) % 1])),
  );

  useEffect(() => {
    const iv = setInterval(() => {
      setTick((t) => t + 1);
      setNow(new Date());
      setProgress((prev) => {
        const next: Record<string, number> = {};
        for (const v of VESSELS) {
          const cur = prev[v.id] ?? 0;
          const speed = v.status === "underway" ? 0.0025 : v.status === "delayed" ? 0.0002 : 0;
          next[v.id] = (cur + speed) % 1;
        }
        return next;
      });
    }, 800);
    return () => clearInterval(iv);
  }, []);

  const selected = useMemo(() => VESSELS.find((v) => v.id === selectedId) ?? VESSELS[0], [selectedId]);
  const counts = useMemo(() => ({
    total: VESSELS.length,
    underway: VESSELS.filter((v) => v.status === "underway").length,
    loading: VESSELS.filter((v) => v.status === "loading" || v.status === "discharging").length,
    delayed: VESSELS.filter((v) => v.status === "delayed").length,
  }), []);

  return (
    <div>
      <PageHeader
        title="Live Tracking"
        description="Real-time vessel positions, ETAs, and cargo status across your active fleet."
        actions={
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2 h-8 rounded border border-border bg-panel text-[11px] font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-muted-foreground">AIS</span>
              <span className="text-foreground">LIVE</span>
              <span className="text-muted-foreground/60">· {now.toISOString().slice(11, 19)} UTC</span>
            </div>
            <Button onClick={() => ask(`Give me a fleet status update on all ${VESSELS.length} vessels currently tracked.`)} size="sm" className="gap-1.5 h-8">
              <Sparkles className="h-3.5 w-3.5" /> AI fleet brief
            </Button>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Vessels tracked" value={String(counts.total)} delta="+2" positive hint="last 24h" icon={<Ship className="h-3.5 w-3.5" />} />
          <StatTile label="Underway" value={String(counts.underway)} delta={`${((counts.underway / counts.total) * 100).toFixed(0)}%`} positive hint="of fleet" icon={<Navigation className="h-3.5 w-3.5" />} />
          <StatTile label="At port" value={String(counts.loading)} delta="load/disch" positive hint="active ops" icon={<Anchor className="h-3.5 w-3.5" />} />
          <StatTile label="Delayed" value={String(counts.delayed)} delta="ETA slip" positive={false} hint="attention" icon={<AlertTriangle className="h-3.5 w-3.5" />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
          {/* Live map */}
          <Panel
            title="Global positions"
            subtitle={`${VESSELS.length} vessels · updated ${tick}s ago`}
            actions={
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Underway</span>
                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> At port</span>
                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-warning" /> Anchored</span>
                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Delayed</span>
              </div>
            }
            dense
            bodyClassName="p-0"
          >
            <div className="relative w-full aspect-[2/1] bg-background overflow-hidden">
              <img src={worldFlows} alt="World map" className="absolute inset-0 w-full h-full object-cover opacity-90" loading="lazy" />

              {/* Route SVG overlay */}
              <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                {VESSELS.map((v) => {
                  const active = v.id === selected.id;
                  const from = { x: v.from.x, y: v.from.y / 2 };
                  const to = { x: v.to.x, y: v.to.y / 2 };
                  return (
                    <path
                      key={v.id}
                      d={routePath(from, to)}
                      fill="none"
                      stroke={active ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.35)"}
                      strokeWidth={active ? 0.35 : 0.2}
                      strokeDasharray={v.status === "delayed" ? "0.6 0.6" : "1.2 0.6"}
                      strokeLinecap="round"
                    >
                      <animate attributeName="stroke-dashoffset" from="0" to="-4" dur="2.5s" repeatCount="indefinite" />
                    </path>
                  );
                })}
              </svg>

              {/* Vessel markers */}
              {VESSELS.map((v) => {
                const t = progress[v.id] ?? 0;
                const isPort = v.status !== "underway" && v.status !== "delayed";
                const pos = isPort ? { x: v.from.x, y: v.from.y } : pointOnRoute(v.from, v.to, t);
                const active = v.id === selected.id;
                const s = STATUS_STYLE[v.status];
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${pos.x}%`, top: `${pos.y * 2}%` }}
                    aria-label={v.name}
                  >
                    <span className={cn(
                      "block h-2 w-2 rounded-full ring-2 ring-background transition-all",
                      s.dot,
                      active && "h-3 w-3 ring-primary/60",
                    )} />
                    <span className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-mono border transition-opacity",
                      s.bg, s.text,
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                    )}>{v.name}</span>
                  </button>
                );
              })}

              {/* Live overlay label */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 h-6 rounded bg-background/80 border border-border backdrop-blur text-[10px] font-mono uppercase tracking-wider">
                <Radio className="h-3 w-3 text-primary animate-pulse" />
                <span className="text-muted-foreground">AIS feed</span>
                <span className="text-foreground">1.2s</span>
              </div>
              <div className="absolute bottom-2 right-2 px-2 h-6 flex items-center rounded bg-background/80 border border-border backdrop-blur text-[10px] font-mono text-muted-foreground">
                Mercator · zoom 1.0×
              </div>
            </div>
          </Panel>

          {/* Vessel detail */}
          <div className="space-y-3">
            <Panel title={selected.name} subtitle={`IMO ${selected.imo} · ${selected.type}`} dense bodyClassName="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className={cn("inline-flex items-center gap-1.5 px-2 h-6 rounded border text-[10px] font-mono uppercase tracking-wider", STATUS_STYLE[selected.status].bg, STATUS_STYLE[selected.status].text)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_STYLE[selected.status].dot)} />
                  {STATUS_STYLE[selected.status].label}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">Deal {selected.dealRef}</span>
              </div>

              <div className="grid grid-cols-2 gap-y-1.5 text-[11px] pt-2 border-t border-border">
                <span className="text-muted-foreground">Cargo</span><span className="text-right font-mono">{selected.cargo}</span>
                <span className="text-muted-foreground">Volume</span><span className="text-right font-mono">{selected.volume}</span>
                <span className="text-muted-foreground">Origin</span><span className="text-right font-mono">{selected.origin}</span>
                <span className="text-muted-foreground">Destination</span><span className="text-right font-mono">{selected.destination}</span>
                <span className="text-muted-foreground">Speed</span><span className="text-right font-mono">{selected.speedKts.toFixed(1)} kts</span>
                <span className="text-muted-foreground">ETA</span><span className="text-right font-mono text-primary">{selected.eta}</span>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="label-xs mb-1.5">Voyage progress</div>
                <div className="h-1.5 bg-elevated rounded overflow-hidden">
                  <div
                    className={cn("h-full transition-all", selected.status === "delayed" ? "bg-destructive" : "bg-primary")}
                    style={{ width: `${Math.round((progress[selected.id] ?? 0) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground">
                  <span>{selected.origin}</span>
                  <span>{Math.round((progress[selected.id] ?? 0) * 100)}%</span>
                  <span>{selected.destination}</span>
                </div>
              </div>
            </Panel>

            <Panel title="Signal log" dense bodyClassName="p-0 max-h-52 overflow-auto">
              <ul className="divide-y divide-border">
                {[
                  { t: "just now", msg: `${selected.name} position update`, kind: "info" },
                  { t: "12s ago", msg: `Speed ${selected.speedKts.toFixed(1)} kts, heading 274°`, kind: "info" },
                  { t: "2m ago", msg: `AIS ping received from IMO ${selected.imo}`, kind: "ok" },
                  { t: "18m ago", msg: `Weather advisory issued along route`, kind: "warn" },
                  { t: "1h ago", msg: `ETA recalculated ${selected.eta}`, kind: "info" },
                ].map((e, i) => (
                  <li key={i} className="px-3 h-8 flex items-center gap-2 text-[11px]">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      e.kind === "ok" ? "bg-success" : e.kind === "warn" ? "bg-warning" : "bg-primary",
                    )} />
                    <span className="flex-1 truncate">{e.msg}</span>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">{e.t}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        {/* Fleet table */}
        <Panel title="Fleet" subtitle={`${VESSELS.length} vessels`} dense bodyClassName="p-0">
          <div className="overflow-auto">
            <table className="w-full text-[12px]">
              <thead className="label-xs">
                <tr className="[&>th]:h-8 [&>th]:px-3 [&>th]:text-left border-b border-border bg-background/50">
                  <th>Vessel</th><th>Type</th><th>Cargo</th><th>Origin → Dest</th>
                  <th className="text-right">Speed</th><th className="text-right">ETA</th><th>Status</th><th>Deal</th>
                </tr>
              </thead>
              <tbody>
                {VESSELS.map((v) => {
                  const s = STATUS_STYLE[v.status];
                  const active = v.id === selected.id;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedId(v.id)}
                      className={cn(
                        "border-b border-border/60 last:border-0 cursor-pointer transition-colors",
                        active ? "bg-primary/5" : "hover:bg-elevated/50",
                      )}
                    >
                      <td className="px-3 h-9">
                        <div className="flex items-center gap-2 min-w-0">
                          <Ship className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{v.name}</div>
                            <div className="text-[10px] font-mono text-muted-foreground">IMO {v.imo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 font-mono text-[11px] text-muted-foreground">{v.type}</td>
                      <td className="px-3">{v.cargo}<div className="text-[10px] font-mono text-muted-foreground">{v.volume}</div></td>
                      <td className="px-3 text-[11px] text-muted-foreground">
                        <span className="font-mono">{v.origin}</span> <span className="text-primary">→</span> <span className="font-mono">{v.destination}</span>
                      </td>
                      <td className="px-3 text-right num">{v.speedKts.toFixed(1)}<span className="text-[10px] text-muted-foreground ml-1">kts</span></td>
                      <td className="px-3 text-right font-mono text-[11px] text-primary">{v.eta}</td>
                      <td className="px-3">
                        <span className={cn("inline-flex items-center gap-1.5 px-1.5 h-5 rounded border text-[10px] font-mono uppercase tracking-wider", s.bg, s.text)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-3 font-mono text-[10px] text-muted-foreground">{v.dealRef}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
