import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
import {
  AlertCircle,
  TrendingUp,
  Building2,
  ClipboardCheck,
  ShieldAlert,
  ArrowRight,
  Bell,
  CheckSquare,
} from "lucide-react";
import { listAssessmentsForUser } from "@/lib/api/assessments";
import { getComplianceProgress } from "@/lib/api/compliance";
import { buildTrendFromAssessments } from "@/lib/assessment-history";
import { listCompanies } from "@/lib/api/companies";
import { useAuth } from "@/lib/auth";
import { isCompanyUser } from "@/lib/permissions";
import { buildComplianceScore, levelLabel } from "@/lib/compliance/score";
import { buildPeriodicAlerts, alertDaysLabel } from "@/lib/compliance/alerts";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import {
  DashboardStatDetail,
  type DashboardStatId,
} from "@/components/dashboard/dashboard-stat-detail";
import { AppViewport } from "@/components/layout/app-viewport";
import { SectionAccordion } from "@/components/layout/section-accordion";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeStat, setActiveStat] = useState<DashboardStatId | null>(null);
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

  const latestId = assessments.data?.[0]?.id;
  const progressQuery = useQuery({
    queryKey: ["compliance-progress-dashboard", latestId],
    queryFn: () => getComplianceProgress(latestId),
    enabled: isAuthenticated && latestId != null,
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
          {
            name: "Cumple",
            value: items.filter((e) => e.status === "Cumple").length,
            color: "var(--color-chart-2)",
          },
          {
            name: "Parcial",
            value: items.filter((e) => e.status === "Parcial").length,
            color: "var(--color-chart-3)",
          },
          {
            name: "No cumple",
            value: items.filter((e) => e.status === "No cumple").length,
            color: "var(--color-chart-5)",
          },
        ],
        porEmpresa: Object.values(
          items.reduce<Record<number, { empresa: string; total: number; count: number }>>(
            (acc, cur) => {
              const e = acc[cur.company_id] ?? {
                empresa: cur.company_name.split(" ")[0],
                total: 0,
                count: 0,
              };
              e.total += cur.score;
              e.count += 1;
              acc[cur.company_id] = e;
              return acc;
            },
            {}
          )
        ).map((e) => ({ empresa: e.empresa, puntaje: Math.round(e.total / e.count) })),
        tendencia: buildTrendFromAssessments(items),
      }
    : null;

  if (isLoading) {
    return (
      <AppViewport>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </AppViewport>
    );
  }

  if (isError) {
    return (
      <AppViewport>
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
      </AppViewport>
    );
  }

  const stats: {
    id: DashboardStatId;
    label: string;
    value: string | number;
    description: string;
    icon: typeof TrendingUp;
    accent: "primary" | "success" | "warning" | "danger";
  }[] = [
    {
      id: "promedio",
      label: "Puntaje promedio",
      value: data ? `${data.promedio}%` : "—",
      description: "Media Ley 1581",
      icon: TrendingUp,
      accent: "primary",
    },
    {
      id: "empresas",
      label: user && isCompanyUser(user.role) ? "Mi empresa" : "Empresas",
      value: data?.totalEmpresas ?? 0,
      description: user && isCompanyUser(user.role) ? "Tu organización" : "Con evaluaciones",
      icon: Building2,
      accent: "success",
    },
    {
      id: "evaluaciones",
      label: "Evaluaciones",
      value: data?.totalEvaluaciones ?? 0,
      description: "Autodiagnósticos",
      icon: ClipboardCheck,
      accent: "warning",
    },
    {
      id: "no-conformes",
      label: "No conformes",
      value: data?.pendientes ?? 0,
      description: "Bajo 60%",
      icon: ShieldAlert,
      accent: "danger",
    },
  ];

  const progress = progressQuery.data;
  const checklistDone = Object.values(progress?.checklist ?? {}).filter(Boolean).length;
  const checklistTotal = Object.keys(progress?.checklist ?? {}).length;
  const checklistPct = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;
  const actionDone = Object.values(progress?.action_status ?? {}).filter((s) => s === "completada")
    .length;
  const actionTotal = Object.keys(progress?.action_status ?? {}).length;
  const actionPct = actionTotal ? Math.round((actionDone / actionTotal) * 100) : 0;
  const alerts = buildPeriodicAlerts(items[0]?.created_at)
    .filter((a) => !(progress?.dismissed_alerts ?? []).includes(a.id))
    .slice(0, 2);
  const latestScore = items[0] ? buildComplianceScore(items[0].score) : null;

  const goCumplimiento = () => {
    if (latestId) {
      navigate({ to: "/cumplimiento/$assessmentId", params: { assessmentId: String(latestId) } });
    }
  };

  return (
    <AppViewport>
      {user && isCompanyUser(user.role) && items.length === 0 && (
        <Card className="border-primary/15 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-base font-semibold">{user.company_name}</p>
              <p className="text-sm text-muted-foreground">Inicia tu autodiagnóstico Ley 1581</p>
            </div>
            <Button asChild size="sm" className="shrink-0 rounded-lg">
              <Link to="/cuestionario">
                Comenzar diagnóstico
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <DashboardStatCard
            key={s.id}
            label={s.label}
            value={s.value}
            description={s.description}
            icon={s.icon}
            accent={s.accent}
            onClick={() => setActiveStat(s.id)}
          />
        ))}
      </div>

      <DashboardStatDetail
        statId={activeStat}
        open={activeStat != null}
        onOpenChange={(open) => !open && setActiveStat(null)}
        assessments={items}
        companies={companies.data ?? []}
        promedio={data?.promedio ?? 0}
        isCompanyUser={!!user && isCompanyUser(user.role)}
        companyName={user?.company_name}
        canViewEmpresas={user?.role === "admin" || user?.role === "auditor"}
      />

      <SectionAccordion
        defaultOpen={[
          ...(latestId && latestScore ? ["progreso"] : []),
          ...(data && items.length > 0 ? ["graficas"] : []),
        ]}
        sections={[
          ...(latestId && latestScore
            ? [
                {
                  id: "progreso",
                  title: "Progreso de cumplimiento",
                  hint: "Nivel, checklist y alertas",
                  children: (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => setActiveStat("promedio")}
                        className="rounded-lg border p-3 text-left transition-colors hover:border-primary/25 hover:bg-muted/40"
                      >
                        <p className="text-xs font-medium text-muted-foreground">Nivel actual</p>
                        <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: latestScore.color }}>
                          {latestScore.percentage}%
                        </p>
                        <p className="text-sm text-muted-foreground">{levelLabel(latestScore.level)}</p>
                      </button>
                      <button
                        type="button"
                        onClick={goCumplimiento}
                        className="rounded-lg border p-3 text-left transition-colors hover:border-primary/25 hover:bg-muted/40"
                      >
                        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <CheckSquare className="h-3.5 w-3.5" /> Checklist
                        </p>
                        <Progress value={checklistPct} className="mt-3 h-2" />
                        <p className="mt-2 text-xs text-muted-foreground">
                          {checklistDone}/{checklistTotal || "—"} ítems · {checklistPct}%
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={goCumplimiento}
                        className="rounded-lg border p-3 text-left transition-colors hover:border-primary/25 hover:bg-muted/40"
                      >
                        <p className="text-xs font-medium text-muted-foreground">Plan de acción</p>
                        <Progress value={actionPct} className="mt-3 h-2" />
                        <p className="mt-2 text-xs text-muted-foreground">
                          {actionDone}/{actionTotal || "—"} tareas · {actionPct}%
                        </p>
                      </button>
                      <div className="rounded-lg border p-3">
                        {alerts.length > 0 ? (
                          <>
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Bell className="h-3.5 w-3.5" /> Alertas
                            </p>
                            <ul className="space-y-1.5">
                              {alerts.map((a) => (
                                <li
                                  key={a.id}
                                  className="flex justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs"
                                >
                                  <span className="truncate">{a.title}</span>
                                  <span className="shrink-0 text-muted-foreground">
                                    {alertDaysLabel(a.dueDate)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={goCumplimiento}
                            className="flex h-full w-full flex-col items-start justify-center text-left"
                          >
                            <p className="text-xs font-medium text-muted-foreground">Centro de cumplimiento</p>
                            <p className="mt-1 text-sm text-primary">Abrir plan →</p>
                          </button>
                        )}
                      </div>
                    </div>
                  ),
                },
              ]
            : []),
          ...(data && items.length > 0
            ? [
                {
                  id: "graficas",
                  title: "Análisis visual",
                  hint: "Tendencia, histórico y distribución",
                  children: (
                    <div className="grid gap-4 lg:grid-cols-3">
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Tendencia</CardTitle>
                          <CardDescription className="text-xs">
                            {user && isCompanyUser(user.role) ? "Tu progreso" : "Promedio mensual"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="app-chart-panel px-2 pb-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.tendencia} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                              <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} width={36} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ fontSize: 12 }} />
                              <Line type="monotone" dataKey="puntaje" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            {user && isCompanyUser(user.role) ? "Histórico" : "Por empresa"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="app-chart-panel px-2 pb-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.porEmpresa} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                              <XAxis dataKey="empresa" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 11 }} width={36} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ fontSize: 12 }} />
                              <Bar dataKey="puntaje" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Por estado</CardTitle>
                        </CardHeader>
                        <CardContent className="app-chart-panel px-2 pb-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={data.distribucion} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={64} innerRadius={36} paddingAngle={2}>
                                {data.distribucion.map((d, i) => (
                                  <Cell key={i} fill={d.color} />
                                ))}
                              </Pie>
                              <Legend verticalAlign="bottom" height={40} iconType="circle" iconSize={8} formatter={(value, entry) => {
                                const count = (entry.payload as { value?: number })?.value ?? 0;
                                return <span className="text-xs">{value} ({count})</span>;
                              }} />
                              <Tooltip contentStyle={{ fontSize: 12 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  ),
                },
              ]
            : [
                {
                  id: "graficas",
                  title: "Análisis visual",
                  hint: "Disponible tras el primer diagnóstico",
                  children: (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Completa un autodiagnóstico para ver gráficas e indicadores.
                      </p>
                      <Button asChild size="sm">
                        <Link to="/cuestionario">Iniciar autodiagnóstico</Link>
                      </Button>
                    </div>
                  ),
                },
              ]),
        ]}
      />
    </AppViewport>
  );
}
