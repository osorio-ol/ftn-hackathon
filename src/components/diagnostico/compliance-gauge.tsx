import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type ComplianceGaugeProps = {
  value: number;
  size?: number;
  compact?: boolean;
};

export function ComplianceGauge({ value, size = 200, compact = false }: ComplianceGaugeProps) {
  const color = value >= 80 ? "#16a34a" : value >= 60 ? "#ca8a04" : "#dc2626";
  const data = [
    { name: "score", value },
    { name: "rest", value: 100 - value },
  ];

  const arcWidth = size;
  const arcHeight = compact ? size * 0.38 : size * 0.42;
  const innerR = compact ? "68%" : "70%";
  const outerR = "100%";
  const valueClass = compact ? "text-2xl" : "text-3xl";

  return (
    <div
      className="flex flex-col items-center"
      style={{ width: arcWidth }}
      role="img"
      aria-label={`${value}% de cumplimiento`}
    >
      <div className="w-full overflow-hidden" style={{ height: arcHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={innerR}
              outerRadius={outerR}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={color} />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="-mt-1 text-center leading-none">
        <p className={`${valueClass} font-bold tabular-nums tracking-tight`} style={{ color }}>
          {value}%
        </p>
        <p className="mt-1 text-[10px] font-medium text-muted-foreground">cumplimiento</p>
      </div>
    </div>
  );
}
