import { createFileRoute, Link } from "@tanstack/react-router";
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
import { AlertCircle, TrendingUp, Building2, ClipboardCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { listAssessmentsForUser } from "@/lib/api/assessments";
import { buildTrendFromAssessments } from "@/lib/assessment-history";
import { listCompanies } from "@/lib/api/companies";
import { useAuth } from "@/lib/auth";
import { isCompanyUser } from "@/lib/permissions";
import { ComplianceGauge } from "@/components/diagnostico/compliance-gauge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const companyScope = user && isCompanyUser(user.role) ? user.company_id : undefined;

  const assessments = useQuery({
    queryKey: ["assessments", companyScope, user?.role],
    queryFn: () => listAssessmentsForUser(user),
    enabled: isAuthenticated,
  });

  const companies = useQuery({
    queryKey: ["companies"],
    queryFn: listCompanies,
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "auditor"),
  });

  const isLoading = assessments.isLoading;
  const isError = assessments.isError;
  const items = assessments.data ?? [];

  const data = items.length
    ? {
        promedio: Math.round(items.reduce((a, b) => a + b.score, 0) / items.length),
        totalEmpresas:
          user && isCompanyUser(user.role)
            ? 1
            : companies.data?.length ?? new Set(items.map((i) => i.company_id)).size,
        totalEvaluaciones: items.length,
        pendientes: items.filter((e) => e.status === "No cumple").length,
        ultimoPuntaje: Math.round(items[0]?.score ?? 0),
        distribucion: [
          { name: "Cumple", value: items.filter((e) => e.status === "Cumple").length, color: "var(--color-chart-2)" },
          { name: "Parcial", value: items.filter((e) => e.status === "Parcial").length, color: "var(--color-chart-3)" },
          {
            name: "No cumple",
            value: items.filter((e) => e.status === "No cumple").length,
            color: "var(--color-chart-5)",
          },
        ],
        porEmpresa: Object.values(
          items.reduce<Record<number, { empresa: string; total: number; count: number }>>((acc, cur) => {
            const e = acc[cur.company_id] ?? { empresa: cur.company_name.split(" ")[0], total: 0, count: 0 };
            e.total += cur.score;
            e.count += 1;
            acc[cur.company_id] = e;
            return acc;
          }, {})
        ).map((e) => ({ empresa: e.empresa, puntaje: Math.round(e.total / e.count) })),
        tendencia: buildTrendFromAssessments(items),
      }
    : null;

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

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No se pudieron cargar los datos</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{assessments.error?.message ?? "Intenta nuevamente."}</span>
          <Button size="sm" variant="outline" onClick={() => assessments.refetch()}>
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const stats = [
    { label: "Puntaje promedio", value: data ? `${data.promedio}%` : "—", icon: TrendingUp },
    { label: "Empresas", value: data?.totalEmpresas ?? 0, icon: Building2 },
    { label: "Evaluaciones", value: data?.totalEvaluaciones ?? 0, icon: ClipboardCheck },
    { label: "No conformes", value: data?.pendientes ?? 0, icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6">
      {user && isCompanyUser(user.role) && (
        <Card className="border-primary/20">
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 py-6">
            <div className="flex-1 space-y-2">
              <h2 className="text-lg font-semibold">Bienvenido, {user.company_name}</h2>
              <p className="text-sm text-muted-foreground">
                Realiza el autodiagnóstico de cumplimiento Ley 1581 en fase de diseño y obtén
                recomendaciones personalizadas con IA.
              </p>
              <Button asChild size="sm">
                <Link to="/cuestionario">
                  Iniciar autodiagnóstico
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {data?.ultimoPuntaje != null && items.length > 0 && (
              <ComplianceGauge value={data.ultimoPuntaje} size={160} />
            )}
          </CardContent>
        </Card>
      )}

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

      {!data || items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aún no hay evaluaciones. Completa un autodiagnóstico para ver indicadores.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de cumplimiento</CardTitle>
              <CardDescription>
                {user && isCompanyUser(user.role) ? "Tu progreso de cumplimiento" : "Puntaje promedio mensual"}
              </CardDescription>
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
                <CardTitle>
                  {user && isCompanyUser(user.role) ? "Tu puntaje histórico" : "Puntaje por empresa"}
                </CardTitle>
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
        </>
      )}
    </div>
  );
}
