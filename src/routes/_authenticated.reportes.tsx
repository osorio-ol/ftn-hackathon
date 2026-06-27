import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { isCompanyUser } from "@/lib/permissions";
import { listAssessmentsForUser } from "@/lib/api/assessments";
import { assessmentToHistorial, loadAssessmentReport } from "@/lib/assessment-history";
import { downloadReporte, type HistorialItem } from "@/lib/history";
import { ReportViewerDialog } from "@/components/report/report-viewer-dialog";
import { AppViewport } from "@/components/layout/app-viewport";

export const Route = createFileRoute("/_authenticated/reportes")({
  component: ReportesPage,
});

function ReportesPage() {
  const { user, isAuthenticated } = useAuth();
  const [viewItem, setViewItem] = useState<HistorialItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["assessments", user?.company_id, user?.role],
    queryFn: () => listAssessmentsForUser(user),
    enabled: isAuthenticated,
  });

  const withAi = useMemo(
    () => (data ?? []).filter((a) => a.has_recommendation),
    [data]
  );

  const openReport = async (assessmentId: number) => {
    const a = withAi.find((x) => x.id === assessmentId);
    if (!a) return;
    try {
      const report = await loadAssessmentReport(assessmentId);
      setViewItem(assessmentToHistorial(a, report, user?.name));
    } catch {
      toast.error("No se pudo cargar el informe. Intenta de nuevo.");
    }
  };

  return (
    <AppViewport>
      {user && isCompanyUser(user.role) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-xs text-muted-foreground">
              Tras el autodiagnóstico verás aquí el informe con IA.
            </p>
            <Button asChild size="sm" className="h-8">
              <Link to="/cuestionario">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nuevo
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Reportes descargables</CardTitle>
          <CardDescription>Informes de cumplimiento Ley 1581 con recomendaciones IA.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : withAi.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No hay reportes. Completa un autodiagnóstico primero.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {withAi.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.company_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {Math.round(r.score)}% · {r.created_at.slice(0, 10)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void openReport(r.id)}>
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={async () => {
                        const report = await loadAssessmentReport(r.id);
                        downloadReporte(assessmentToHistorial(r, report, user?.name));
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ReportViewerDialog
        item={viewItem}
        open={!!viewItem}
        onOpenChange={(open) => !open && setViewItem(null)}
      />
    </AppViewport>
  );
}
