import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, Building2, ClipboardCheck, ShieldAlert } from "lucide-react";
import { evaluacionesMock, tendenciaMock, empresasMock } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

async function fetchDashboard() {
  await new Promise((r) => setTimeout(r, 700));
  if (Math.random() < 0.05) throw new Error("Error simulado de red");
  const promedio = Math.round(
    evaluacionesMock.reduce((a, b) => a + b.puntaje, 0) / evaluacionesMock.length
  );
  const cumple = evaluacionesMock.filter((e) => e.estado === "Cumple").length;
  const parcial = evaluacionesMock.filter((e) => e.estado === "Parcial").length;
  const noCumple = evaluacionesMock.filter((e) => e.estado === "No cumple").length;
  return {
    promedio,
    totalEmpresas: empresasMock.length,
    totalEvaluaciones: evaluacionesMock.length,
    pendientes: noCumple,
    distribucion: [
      { name: "Cumple", value: cumple, color: "var(--color-chart-2)" },
      { name: "Parcial", value: parcial, color: "var(--color-chart-4)" },
      { name: "No cumple", value: noCumple, color: "var(--color-chart-5)" },
    ],
    porEmpresa: empresasMock.map((e) => ({
      empresa: e.split(" ")[0],
      puntaje: Math.round(
        evaluacionesMock.filter((x) => x.empresa === e).reduce((a, b) => a + b.puntaje, 0) /
          Math.max(1, evaluacionesMock.filter((x) => x.empresa === e).length)
      ),
    })),
    tendencia: tendenciaMock,
  };
}

function Dashboard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No se pudieron cargar los datos</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{(error as Error)?.message ?? "Intenta nuevamente."}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const stats = [
    { label: "Puntaje promedio", value: `${data.promedio}%`, icon: TrendingUp },
    { label: "Empresas", value: data.totalEmpresas, icon: Building2 },
    { label: "Evaluaciones", value: data.totalEvaluaciones, icon: ClipboardCheck },
    { label: "No conformes", value: data.pendientes, icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold">{s.value}</p>
                </div>
                <s.icon className="h-8 w-8 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendencia de cumplimiento</CardTitle>
          <CardDescription>Puntaje promedio mensual {isFetching && "(actualizando…)"}</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.tendencia}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis className="text-xs" domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="puntaje" stroke="var(--color-chart-1)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Puntaje por empresa</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.porEmpresa}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="empresa" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="puntaje" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por estado</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.distribucion} dataKey="value" nameKey="name" outerRadius={90} label>
                  {data.distribucion.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}