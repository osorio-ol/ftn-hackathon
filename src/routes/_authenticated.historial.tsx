import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { isCompanyUser } from "@/lib/permissions";
import { getHistorial, downloadReporte } from "@/lib/history";
import { evaluacionesMock } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/historial")({
  component: HistorialPage,
});

function HistorialPage() {
  const { user } = useAuth();

  const items = useMemo(() => {
    const local = getHistorial(user && isCompanyUser(user.role) ? user.company_id : undefined);
    const mock = user && isCompanyUser(user.role) ? [] : evaluacionesMock;
    const combined = [
      ...local.map((i) => ({
        id: i.id,
        empresa: i.empresa,
        fecha: i.fecha.slice(0, 10),
        responsable: i.responsable,
        puntaje: i.puntaje,
        estado: i.estado,
        source: "local" as const,
        raw: i,
      })),
      ...mock.map((i) => ({
        id: i.id,
        empresa: i.empresa,
        fecha: i.fecha,
        responsable: i.responsable,
        puntaje: i.puntaje,
        estado: i.estado,
        source: "mock" as const,
        raw: null,
      })),
    ];
    return combined.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [user]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de evaluaciones
          </CardTitle>
          <CardDescription>
            {user && isCompanyUser(user.role)
              ? `Evaluaciones de ${user.company_name ?? "tu empresa"}`
              : "Todas las evaluaciones registradas en la plataforma"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aún no hay evaluaciones. Completa el autodiagnóstico para ver tu historial.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Puntaje</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                    <TableCell>{item.empresa}</TableCell>
                    <TableCell>{item.fecha}</TableCell>
                    <TableCell>{item.responsable}</TableCell>
                    <TableCell>{item.puntaje}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.estado === "Cumple"
                            ? "default"
                            : item.estado === "Parcial"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {item.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.source === "local" && item.raw && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReporte(item.raw!)}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Reporte
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
