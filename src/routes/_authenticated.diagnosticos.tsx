import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Bot,
  ClipboardList,
  Download,
  Eye,
  Search,
  Trash2,
} from "lucide-react";
import { listAssessmentsForUser, deleteAssessment } from "@/lib/api/assessments";
import { loadHistorialItemForAssessment } from "@/lib/assessment-history";
import { useAuth } from "@/lib/auth";
import { downloadReporte, type HistorialItem } from "@/lib/history";
import { isCompanyUser } from "@/lib/permissions";
import { ReportViewerDialog } from "@/components/report/report-viewer-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/diagnosticos")({
  component: DiagnosticosPage,
});

function DiagnosticosPage() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [viewItem, setViewItem] = useState<HistorialItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["assessments", user?.company_id, user?.role],
    queryFn: () => listAssessmentsForUser(user),
    enabled: isAuthenticated,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.toLowerCase();
    return data.filter(
      (a) =>
        a.company_name.toLowerCase().includes(s) ||
        String(a.id).includes(s) ||
        a.status.toLowerCase().includes(s)
    );
  }, [data, q]);

  const remove = useMutation({
    mutationFn: deleteAssessment,
    onSuccess: () => {
      toast.success("Evaluación eliminada");
      void qc.invalidateQueries({ queryKey: ["assessments"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openReport = async (a: (typeof filtered)[0]) => {
    try {
      setViewItem(await loadHistorialItemForAssessment(a, user?.name));
    } catch {
      toast.error("No se pudo cargar el informe. Intenta de nuevo.");
    }
  };

  const canDelete = user?.role === "admin" || isCompanyUser(user?.role ?? "company");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Diagnósticos
              </CardTitle>
              <CardDescription>
                Listado completo de evaluaciones registradas en la plataforma.
              </CardDescription>
            </div>
            {user && isCompanyUser(user.role) && (
              <Button asChild size="sm">
                <Link to="/cuestionario">Nuevo autodiagnóstico</Link>
              </Button>
            )}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar empresa, ID o estado…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error al cargar</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>No se pudieron obtener los diagnósticos.</span>
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay diagnósticos registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Puntaje</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Riesgo</TableHead>
                  <TableHead>IA</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell>{a.company_name}</TableCell>
                    <TableCell>{a.created_at.slice(0, 10)}</TableCell>
                    <TableCell>{Math.round(a.score)}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          a.status === "Cumple"
                            ? "default"
                            : a.status === "Parcial"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{a.nivel_riesgo ?? "—"}</TableCell>
                    <TableCell>
                      {a.has_recommendation ? (
                        <Badge variant="outline" className="text-primary border-primary/30">
                          <Bot className="mr-1 h-3 w-3" />
                          Sí
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/recomendaciones/$assessmentId" params={{ assessmentId: String(a.id) }}>
                            <Eye className="mr-1 h-3 w-3" />
                            Ver
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void openReport(a)}>
                          <Download className="h-3 w-3" />
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="ghost" onClick={() => setDeleteId(a.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReportViewerDialog
        item={viewItem}
        open={!!viewItem}
        onOpenChange={(open) => !open && setViewItem(null)}
      />

      <AlertDialog open={deleteId != null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar evaluación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el diagnóstico #{deleteId}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && remove.mutate(deleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
