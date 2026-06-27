import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getAssessment,
  getRecommendationOptional,
  listAssessmentsForUser,
} from "@/lib/api/assessments";
import { getComplianceProgress, saveComplianceProgress } from "@/lib/api/compliance";
import { buildHistorialFromAssessment } from "@/lib/assessment-history";
import { downloadReporte } from "@/lib/history";
import { useAuth } from "@/lib/auth";
import { pickBeforeAfter } from "@/lib/compliance/comparison";
import { checklistProgress, buildChecklist } from "@/lib/compliance/checklist";
import { actionProgress, buildActionPlan } from "@/lib/compliance/action-plan";
import { ComplianceScoreCard } from "@/components/compliance/compliance-score-card";
import { RiskMatrixPanel } from "@/components/compliance/risk-matrix-panel";
import { ActionPlanPanel } from "@/components/compliance/action-plan-panel";
import { DocumentGeneratorPanel } from "@/components/compliance/document-generator-panel";
import { DocumentAnalyzerPanel } from "@/components/compliance/document-analyzer-panel";
import { ComplianceChecklistPanel } from "@/components/compliance/compliance-checklist-panel";
import { ComplianceAlertsPanel } from "@/components/compliance/compliance-alerts-panel";
import { BeforeAfterPanel } from "@/components/compliance/before-after-panel";
import type { DocumentAnalysisResult } from "@/lib/compliance/document-analysis";

export const Route = createFileRoute("/_authenticated/cumplimiento/$assessmentId")({
  component: CumplimientoPage,
});

function CumplimientoPage() {
  const { assessmentId } = Route.useParams();
  const id = Number(assessmentId);
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["cumplimiento", id],
    queryFn: async () => {
      const assessment = await getAssessment(id);
      const rec = await getRecommendationOptional(id);
      return { assessment, rec };
    },
    enabled: Number.isFinite(id) && isAuthenticated,
  });

  const companyAssessments = useQuery({
    queryKey: ["assessments-company", data?.assessment.company_id],
    queryFn: () => listAssessmentsForUser(user),
    enabled: !!data?.assessment && isAuthenticated,
  });

  const progressQuery = useQuery({
    queryKey: ["compliance-progress", id],
    queryFn: () => getComplianceProgress(id),
    enabled: Number.isFinite(id) && isAuthenticated,
  });

  const saveMutation = useMutation({
    mutationFn: (patch: Parameters<typeof saveComplianceProgress>[0]) =>
      saveComplianceProgress(patch, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compliance-progress", id] }),
  });

  const companyId = data?.assessment?.company_id;
  const companyAssessmentCount =
    companyAssessments.data?.filter((a) => a.company_id === companyId).length ?? 0;

  const comparisonQuery = useQuery({
    queryKey: ["comparison", companyId, id],
    queryFn: async () => {
      const ids = (companyAssessments.data ?? [])
        .filter((a) => a.company_id === companyId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      if (ids.length < 2 || companyId == null) return null;
      const first = await getAssessment(ids[0].id);
      const last = await getAssessment(ids[ids.length - 1].id);
      return pickBeforeAfter([first, last]);
    },
    enabled: !!companyId && isAuthenticated && companyAssessmentCount >= 2,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data?.assessment) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No se pudo cargar el módulo de cumplimiento.</AlertDescription>
      </Alert>
    );
  }

  const { assessment, rec } = data;
  const item = buildHistorialFromAssessment(assessment, rec?.report, user?.name);
  const progress = progressQuery.data;
  const checklist = progress?.checklist ?? {};
  const actionStatus = progress?.action_status ?? {};
  const dismissedAlerts = progress?.dismissed_alerts ?? [];
  const documentAnalyses = progress?.document_analyses ?? [];

  const checklistItems = buildChecklist(item.recomendaciones, item.brechas);
  const actionItems = buildActionPlan(item.recomendaciones, item.brechas);
  const checklistPct = checklistProgress(checklistItems, checklist);
  const actionPct = actionProgress(actionItems, actionStatus);

  function patchProgress(patch: Parameters<typeof saveComplianceProgress>[0]) {
    saveMutation.mutate(patch);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-lg">
          <Link to="/recomendaciones/$assessmentId" params={{ assessmentId: String(id) }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al informe
          </Link>
        </Button>
        <Button size="sm" className="rounded-lg shadow-sm" onClick={() => downloadReporte(item)}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF completo
        </Button>
      </div>

      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.07] via-card to-card shadow-sm">
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Centro de cumplimiento</h1>
                <p className="text-sm text-muted-foreground">{item.empresa}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="font-normal">
                Evaluación #{id}
              </Badge>
              <Badge variant="outline" className="font-normal">
                Checklist {checklistPct}%
              </Badge>
              <Badge variant="outline" className="font-normal">
                Plan {actionPct}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <ComplianceScoreCard puntaje={item.puntaje} />

      <Tabs defaultValue="riesgos">
        <TabsList className="flex h-auto flex-wrap gap-1 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="riesgos">Riesgos</TabsTrigger>
          <TabsTrigger value="plan">Plan de acción</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="comparacion">Antes/Después</TabsTrigger>
        </TabsList>

        <TabsContent value="riesgos" className="mt-4">
          <RiskMatrixPanel brechas={item.brechas} />
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <ActionPlanPanel
            recomendaciones={item.recomendaciones}
            brechas={item.brechas}
            status={actionStatus}
            onStatusChange={(actionId, status) =>
              patchProgress({ action_status: { ...actionStatus, [actionId]: status } })
            }
          />
        </TabsContent>

        <TabsContent value="documentos" className="mt-4 space-y-4">
          <DocumentGeneratorPanel
            empresa={item.empresa}
            nit={assessment.company?.nit}
            sector={assessment.company?.sector}
            responsable={item.responsable}
            email={assessment.company?.email}
          />
          <DocumentAnalyzerPanel
            previousAnalyses={documentAnalyses}
            onAnalysisComplete={(result: DocumentAnalysisResult) =>
              patchProgress({ document_analyses: [result, ...documentAnalyses].slice(0, 10) })
            }
          />
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <ComplianceChecklistPanel
            recomendaciones={item.recomendaciones}
            brechas={item.brechas}
            completed={checklist}
            onToggle={(checkId, done) =>
              patchProgress({ checklist: { ...checklist, [checkId]: done } })
            }
          />
        </TabsContent>

        <TabsContent value="alertas" className="mt-4">
          <ComplianceAlertsPanel
            lastAssessmentDate={assessment.created_at}
            dismissed={dismissedAlerts}
            onDismiss={(alertId) =>
              patchProgress({ dismissed_alerts: [...dismissedAlerts, alertId] })
            }
          />
        </TabsContent>

        <TabsContent value="comparacion" className="mt-4">
          {comparisonQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : comparisonQuery.data ? (
            <BeforeAfterPanel before={comparisonQuery.data.before} after={comparisonQuery.data.after} />
          ) : (
            <Alert>
              <AlertTitle>Comparación no disponible</AlertTitle>
              <AlertDescription>
                Se necesitan al menos dos evaluaciones de la misma empresa para comparar el avance.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
