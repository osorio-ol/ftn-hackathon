import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Info } from "lucide-react";
import {
  getAssessment,
  getRecommendationOptional,
  listAssessmentsForUser,
} from "@/lib/api/assessments";
import { buildHistorialFromAssessment } from "@/lib/assessment-history";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { downloadReporte } from "@/lib/history";
import { ReportDetail } from "@/components/report/report-detail";
import { AppViewport } from "@/components/layout/app-viewport";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/recomendaciones/$assessmentId")({
  component: RecomendacionesPage,
});

function canViewAllAssessments(role: string | undefined) {
  return role === "admin" || role === "auditor";
}

function RecomendacionesPage() {
  const { assessmentId } = Route.useParams();
  const id = Number(assessmentId);
  const { user, isAuthenticated } = useAuth();
  const viewAll = canViewAllAssessments(user?.role);

  const scopeQuery = useQuery({
    queryKey: ["assessments", user?.company_id, user?.role],
    queryFn: () => listAssessmentsForUser(user),
    enabled: isAuthenticated && !!user,
  });

  const allowed =
    viewAll || (scopeQuery.isSuccess && scopeQuery.data.some((a) => a.id === id));

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["recommendation-page", id],
    queryFn: async () => {
      const assessment = await getAssessment(id);
      const rec = await getRecommendationOptional(id);
      return { assessment, rec };
    },
    enabled: Number.isFinite(id) && isAuthenticated && allowed,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && (err.status === 403 || err.status === 404)) return false;
      return failureCount < 1;
    },
  });

  const scopeLoading = !viewAll && scopeQuery.isLoading;

  if (scopeLoading || (allowed && isLoading)) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!viewAll && scopeQuery.isSuccess && !scopeQuery.data.some((a) => a.id === id)) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Sin permiso</AlertTitle>
        <AlertDescription>
          Esta evaluación no pertenece a tu empresa. Solo puedes ver diagnósticos de tu cuenta.
        </AlertDescription>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/diagnosticos">Volver a diagnósticos</Link>
        </Button>
      </Alert>
    );
  }

  if (isError || !data?.assessment) {
    const isForbidden = error instanceof ApiError && error.status === 403;
    const isNotFound = error instanceof ApiError && error.status === 404;

    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar la evaluación</AlertTitle>
        <AlertDescription>
          {isForbidden
            ? "No tienes permiso para ver esta evaluación."
            : isNotFound
              ? "La evaluación no existe."
              : "Ocurrió un error al cargar los datos."}
        </AlertDescription>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/diagnosticos">Volver a diagnósticos</Link>
        </Button>
      </Alert>
    );
  }

  const { assessment, rec } = data;
  const hasAiReport = rec != null;
  const item = buildHistorialFromAssessment(assessment, rec?.report, user?.name);

  return (
    <AppViewport className="app-page-wide">
      <div className="page-toolbar">
        <Button asChild variant="ghost" size="sm">
          <Link to="/diagnosticos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <Button size="sm" className="rounded-lg" onClick={() => downloadReporte(item)}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </div>

      {!hasAiReport && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Sin informe de IA</AlertTitle>
          <AlertDescription className="text-sm">
            Se muestran brechas y recomendaciones según el cuestionario.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {hasAiReport ? "🤖 Recomendaciones IA" : "Detalle de evaluación"}
          </CardTitle>
          <CardDescription>
            Evaluación #{id} · {assessment.created_at.slice(0, 10)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReportDetail item={item} />
          <Button asChild variant="secondary" className="w-full rounded-lg sm:w-auto">
            <Link to="/cumplimiento/$assessmentId" params={{ assessmentId: String(id) }}>
              Ir al centro de cumplimiento
            </Link>
          </Button>
        </CardContent>
      </Card>
    </AppViewport>
  );
}
