export const fmtMoney = (n: number | null | undefined, ccy = "USD") => {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
};
export const fmtNum = (n: number | null | undefined) => {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US").format(n);
};
export const fmtPct = (n: number | null | undefined) => {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
};
export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
export const fmtRelative = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
};
