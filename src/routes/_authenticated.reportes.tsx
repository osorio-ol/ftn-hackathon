import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, FileText, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isCompanyUser } from "@/lib/permissions";
import { getHistorial, downloadReporte } from "@/lib/history";
import { evaluacionesMock, empresasMock } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/reportes")({
  component: ReportesPage,
});

function ReportesPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["reportes", user?.company_id, user?.role],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      const local = getHistorial(user && isCompanyUser(user.role) ? user.company_id : undefined);

      if (user && isCompanyUser(user.role)) {
        return local.map((item) => ({
          empresa: item.empresa,
          evaluaciones: 1,
          promedio: item.puntaje,
          ultima: item.fecha.slice(0, 10),
          raw: item,
        }));
      }

      const empresas = [...new Set([...empresasMock, ...local.map((i) => i.empresa)])];
      return empresas.map((emp) => {
        const items = [
          ...evaluacionesMock.filter((e) => e.empresa === emp),
          ...local.filter((i) => i.empresa === emp),
        ];
        const prom = items.length
          ? Math.round(items.reduce((a, b) => a + b.puntaje, 0) / items.length)
          : 0;
        const latest = local.find((i) => i.empresa === emp);
        return {
          empresa: emp,
          evaluaciones: items.length,
          promedio: prom,
          ultima: latest?.fecha.slice(0, 10) ?? "—",
          raw: latest ?? null,
        };
      });
    },
  });

  const hasReports = useMemo(() => (data?.length ?? 0) > 0, [data]);

  return (
    <div className="space-y-4">
      {user && isCompanyUser(user.role) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm">Realiza un nuevo autodiagnóstico para generar reportes actualizados.</p>
            <Button asChild size="sm">
              <Link to="/cuestionario">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo diagnóstico
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Reportes descargables</CardTitle>
          <CardDescription>
            Informes de cumplimiento Ley 1581 — fase de diseño (formato JSON exportable).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !hasReports ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay reportes disponibles. Completa un autodiagnóstico primero.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data!.map((r) => (
                <div
                  key={r.empresa}
                  className="flex items-center justify-between rounded-lg border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{r.empresa}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.evaluaciones} evaluaciones · {r.promedio}% promedio
                        {r.ultima !== "—" && ` · Última: ${r.ultima}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!r.raw}
                    onClick={() => r.raw && downloadReporte(r.raw)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
