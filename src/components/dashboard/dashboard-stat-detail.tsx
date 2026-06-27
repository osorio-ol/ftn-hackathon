import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssessmentSummary } from "@/lib/api/assessments";
import type { CompanySummary } from "@/lib/api/companies";
import { buildComplianceScore } from "@/lib/compliance/score";
import { ArrowRight, Building2, ClipboardCheck, ShieldAlert, TrendingUp } from "lucide-react";

export type DashboardStatId = "promedio" | "empresas" | "evaluaciones" | "no-conformes";

type Props = {
  statId: DashboardStatId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessments: AssessmentSummary[];
  companies: CompanySummary[];
  promedio: number;
  isCompanyUser: boolean;
  companyName?: string;
  canViewEmpresas: boolean;
};

const meta: Record<
  DashboardStatId,
  { title: string; description: string; icon: typeof TrendingUp }
> = {
  promedio: {
    title: "Puntaje promedio",
    description:
      "Media del porcentaje de cumplimiento Ley 1581 en todas las evaluaciones. Un puntaje alto (≥80%) indica cumplimiento satisfactorio.",
    icon: TrendingUp,
  },
  empresas: {
    title: "Empresas",
    description:
      "Organizaciones con al menos una evaluación registrada en la plataforma.",
    icon: Building2,
  },
  evaluaciones: {
    title: "Evaluaciones",
    description:
      "Autodiagnósticos completados. Cada evaluación incluye puntaje, estado y recomendaciones de IA.",
    icon: ClipboardCheck,
  },
  "no-conformes": {
    title: "No conformes",
    description:
      "Evaluaciones con puntaje inferior al 60% (estado «No cumple»). Requieren plan de acción prioritario.",
    icon: ShieldAlert,
  },
};

function statusBadge(status: string) {
  const variant =
    status === "Cumple" ? "default" : status === "Parcial" ? "secondary" : "destructive";
  return <Badge variant={variant}>{status}</Badge>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DashboardStatDetail({
  statId,
  open,
  onOpenChange,
  assessments,
  companies,
  promedio,
  isCompanyUser,
  companyName,
  canViewEmpresas,
}: Props) {
  if (!statId) return null;

  const { title, description, icon: Icon } = meta[statId];
  const noConformes = assessments.filter((a) => a.status === "No cumple");

  const empresaRows =
    companies.length > 0
      ? companies
      : Object.values(
          assessments.reduce<
            Record<
              number,
              CompanySummary & { _latestDate?: string }
            >
          >((acc, a) => {
            if (!acc[a.company_id]) {
              acc[a.company_id] = {
                id: a.company_id,
                name: a.company_name,
                email: "",
                nit: "",
                sector: "",
                size: "",
                assessment_count: 0,
                latest_score: null,
                latest_status: null,
                _latestDate: undefined,
              };
            }
            const row = acc[a.company_id];
            row.assessment_count += 1;
            if (!row._latestDate || new Date(a.created_at) > new Date(row._latestDate)) {
              row._latestDate = a.created_at;
              row.latest_score = a.score;
              row.latest_status = a.status;
            }
            return acc;
          }, {})
        ).map(({ _latestDate: _, ...row }) => row);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            {title}
          </DialogTitle>
          <DialogDescription className="text-left leading-relaxed">{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-4">
          {assessments.length === 0 ? (
            <div className="rounded-xl border px-4 py-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Aún no hay datos en esta categoría. Completa un autodiagnóstico para empezar.
              </p>
              <Button asChild size="sm">
                <Link to="/cuestionario" onClick={() => onOpenChange(false)}>
                  Iniciar autodiagnóstico
                </Link>
              </Button>
            </div>
          ) : (
            <>
          {statId === "promedio" && (
            <>
              <div className="rounded-xl border bg-muted/40 px-4 py-3">
                <p className="text-xs text-muted-foreground">Promedio actual</p>
                <p className="text-3xl font-bold text-primary">{promedio}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Basado en {assessments.length} evaluación{assessments.length !== 1 ? "es" : ""}
                </p>
              </div>
              <AssessmentTable rows={assessments} showCompany={!isCompanyUser} />
            </>
          )}

          {statId === "empresas" && (
            <>
              {isCompanyUser && companyName ? (
                <div className="rounded-xl border px-4 py-4 space-y-2">
                  <p className="font-semibold">{companyName}</p>
                  <p className="text-sm text-muted-foreground">Tu organización en CAVALTEC</p>
                  {assessments[0] && (
                    <div className="flex gap-2 pt-1">
                      {statusBadge(assessments[0].status)}
                      <Badge variant="outline">{Math.round(assessments[0].score)}% último puntaje</Badge>
                    </div>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-right">Eval.</TableHead>
                      <TableHead className="text-right">Puntaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empresaRows.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-right">{c.assessment_count}</TableCell>
                        <TableCell className="text-right">
                          {c.latest_score != null ? `${Math.round(c.latest_score)}%` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}

          {statId === "evaluaciones" && (
            <AssessmentTable rows={assessments} showCompany={!isCompanyUser} />
          )}

          {statId === "no-conformes" && (
            <>
              {noConformes.length === 0 ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-6 text-center text-sm text-muted-foreground">
                  No hay evaluaciones en estado «No cumple». ¡Buen trabajo!
                </div>
              ) : (
                <AssessmentTable rows={noConformes} showCompany={!isCompanyUser} showActions />
              )}
            </>
          )}
            </>
          )}
        </div>

        {assessments.length > 0 && (
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between border-t pt-4">
            {statId === "empresas" && canViewEmpresas && (
              <Button asChild variant="outline" size="sm">
                <Link to="/empresas" onClick={() => onOpenChange(false)}>
                  Ir a empresas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            {(statId === "promedio" || statId === "evaluaciones" || statId === "no-conformes") && (
              <Button asChild variant="outline" size="sm" className="sm:ml-auto">
                <Link to="/historial" onClick={() => onOpenChange(false)}>
                  Ver historial completo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            {statId === "no-conformes" && noConformes[0] && (
              <Button asChild size="sm">
                <Link
                  to="/cumplimiento/$assessmentId"
                  params={{ assessmentId: String(noConformes[0].id) }}
                  onClick={() => onOpenChange(false)}
                >
                  Plan de cumplimiento
                </Link>
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssessmentTable({
  rows,
  showCompany,
  showActions,
}: {
  rows: AssessmentSummary[];
  showCompany?: boolean;
  showActions?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">Sin registros en esta categoría.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showCompany && <TableHead>Empresa</TableHead>}
          <TableHead>Fecha</TableHead>
          <TableHead className="text-right">Puntaje</TableHead>
          <TableHead>Estado</TableHead>
          {showActions && <TableHead className="text-right">Acción</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((a) => {
          const score = buildComplianceScore(a.score);
          return (
            <TableRow key={a.id}>
              {showCompany && <TableCell className="font-medium">{a.company_name}</TableCell>}
              <TableCell className="text-muted-foreground text-sm">{formatDate(a.created_at)}</TableCell>
              <TableCell className="text-right font-semibold" style={{ color: score.color }}>
                {score.percentage}%
              </TableCell>
              <TableCell>{statusBadge(a.status)}</TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm" className="h-8">
                    <Link to="/cumplimiento/$assessmentId" params={{ assessmentId: String(a.id) }}>
                      Ver plan
                    </Link>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
