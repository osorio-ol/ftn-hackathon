import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Search } from "lucide-react";
import { listCompanies } from "@/lib/api/companies";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/empresas")({
  component: EmpresasPage,
});

const variantFor = (e: string) =>
  e === "Cumple" ? "default" : e === "Parcial" ? "secondary" : "destructive";

function EmpresasPage() {
  const { isAuthenticated } = useAuth();
  const [q, setQ] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["companies"],
    queryFn: listCompanies,
    enabled: isAuthenticated,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.toLowerCase();
    return data.filter(
      (e) =>
        e.name.toLowerCase().includes(s) ||
        e.nit.toLowerCase().includes(s) ||
        e.sector.toLowerCase().includes(s) ||
        String(e.id).includes(s)
    );
  }, [data, q]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Empresas registradas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Consulta el estado de cumplimiento y evaluaciones por organización.
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar empresa, NIT o sector…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al cargar</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>No se pudieron obtener las empresas.</span>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>NIT</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead className="text-right">Evaluaciones</TableHead>
                  <TableHead className="text-right">Último puntaje</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.nit}</TableCell>
                      <TableCell>{row.sector}</TableCell>
                      <TableCell className="capitalize">{row.size}</TableCell>
                      <TableCell className="text-right">{row.assessment_count}</TableCell>
                      <TableCell className="text-right">
                        {row.latest_score != null ? `${Math.round(row.latest_score)}%` : "—"}
                      </TableCell>
                      <TableCell>
                        {row.latest_status ? (
                          <Badge variant={variantFor(row.latest_status) as "default"}>
                            {row.latest_status}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
