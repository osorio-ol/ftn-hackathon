import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type ComplianceGaugeProps = {
  value: number;
  size?: number;
};

export function ComplianceGauge({ value, size = 200 }: ComplianceGaugeProps) {
  const color = value >= 80 ? "#16a34a" : value >= 60 ? "#ca8a04" : "#dc2626";
  const data = [
    { name: "score", value },
    { name: "rest", value: 100 - value },
  ];

  return (
    <div className="relative mx-auto" style={{ width: size, height: size * 0.65 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="100%"
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
        <span className="text-4xl font-bold tracking-tight" style={{ color }}>
          {value}%
        </span>
        <span className="text-xs text-muted-foreground font-medium mt-0.5">cumplimiento</span>
      </div>
    </div>
  );
}
