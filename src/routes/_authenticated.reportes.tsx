import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { evaluacionesMock, empresasMock } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reportes")({
  component: ReportesPage,
});

async function fetchReportes() {
  await new Promise((r) => setTimeout(r, 500));
  return empresasMock.map((emp) => {
    const items = evaluacionesMock.filter((e) => e.empresa === emp);
    const prom = items.length
      ? Math.round(items.reduce((a, b) => a + b.puntaje, 0) / items.length)
      : 0;
    return { empresa: emp, evaluaciones: items.length, promedio: prom };
  });
}

function ReportesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["reportes"], queryFn: fetchReportes });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Reportes disponibles</CardTitle>
          <CardDescription>Descarga resumen por empresa (simulado).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
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
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success(`Reporte de ${r.empresa} descargado`)}
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