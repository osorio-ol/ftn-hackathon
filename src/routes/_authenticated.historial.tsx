import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { isCompanyUser } from "@/lib/permissions";
import { listAssessmentsForUser } from "@/lib/api/assessments";
import { loadHistorialItemForAssessment } from "@/lib/assessment-history";
import { type HistorialItem } from "@/lib/history";
import { ReportViewerDialog } from "@/components/report/report-viewer-dialog";
import { AppViewport } from "@/components/layout/app-viewport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, History } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/historial")({
  component: HistorialPage,
});

function HistorialPage() {
  const { user, isAuthenticated } = useAuth();
  const [viewItem, setViewItem] = useState<HistorialItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["assessments", user?.company_id, user?.role],
    queryFn: () => listAssessmentsForUser(user),
    enabled: isAuthenticated,
  });

  const items = useMemo(() => data ?? [], [data]);

  const openReport = async (a: (typeof items)[0]) => {
    try {
      setViewItem(await loadHistorialItemForAssessment(a, user?.name));
    } catch {
      toast.error("No se pudo cargar el informe. Intenta de nuevo.");
    }
  };

  return (
    <AppViewport>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de evaluaciones
          </CardTitle>
          <CardDescription>
            {user && isCompanyUser(user.role)
              ? `Evaluaciones de ${user.company_name ?? "tu empresa"}`
              : "Todas las evaluaciones"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aún no hay evaluaciones.
            </p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>IA</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.id}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{item.company_name}</TableCell>
                    <TableCell>{item.created_at.slice(0, 10)}</TableCell>
                    <TableCell>{Math.round(item.score)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "Cumple"
                            ? "default"
                            : item.status === "Parcial"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.has_recommendation ? (
                        <Badge variant="outline" className="text-primary border-primary/30">
                          Sí
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            to="/recomendaciones/$assessmentId"
                            params={{ assessmentId: String(item.id) }}
                          >
                            Ver
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 w-9 p-0" onClick={() => void openReport(item)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
