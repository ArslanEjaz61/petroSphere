import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export function Spark({ data, positive, height = 28 }: { data: number[]; positive: boolean; height?: number }) {
  const rows = (data ?? []).map((y, i) => ({ i, y }));
  const stroke = positive ? "var(--color-success)" : "var(--color-destructive)";
  return (
    <div style={{ height }} className="w-full min-w-[60px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <YAxis hide domain={["auto", "auto"]} />
          <Line type="monotone" dataKey="y" stroke={stroke} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
