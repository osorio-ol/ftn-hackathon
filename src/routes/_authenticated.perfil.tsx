import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Loader2, Save } from "lucide-react";
import { getCompany, updateCompany } from "@/lib/api/companies";
import { useAuth } from "@/lib/auth";
import { isCompanyUser } from "@/lib/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: PerfilPage,
});

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  nit: z.string().min(5),
  sector: z.string().min(2),
  size: z.enum(["pequena", "mediana", "grande"]),
});

type FormValues = z.infer<typeof schema>;

function PerfilPage() {
  const { user, setUser } = useAuth();
  const qc = useQueryClient();
  const companyId = user?.company_id;

  const { data, isLoading } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => getCompany(companyId!),
    enabled: !!companyId,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: data
      ? {
          name: data.name,
          email: data.email,
          nit: data.nit,
          sector: data.sector,
          size: (data.size as FormValues["size"]) ?? "mediana",
        }
      : undefined,
  });

  const save = useMutation({
    mutationFn: (values: FormValues) => updateCompany(companyId!, values),
    onSuccess: (updated) => {
      toast.success("Perfil actualizado");
      if (user) {
        setUser({
          ...user,
          company_name: updated.name,
          company_email: updated.email,
          company_nit: updated.nit,
          company_sector: updated.sector,
        });
      }
      void qc.invalidateQueries({ queryKey: ["company", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user || !isCompanyUser(user.role)) {
    return (
      <Alert>
        <AlertDescription>
          El perfil de empresa está disponible para cuentas de tipo empresa.
        </AlertDescription>
      </Alert>
    );
  }

  if (!companyId) {
    return (
      <Alert>
        <AlertDescription>No hay empresa asociada a tu cuenta.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Perfil de empresa
          </CardTitle>
          <CardDescription>
            Datos legales y responsable de tratamiento según Ley 1581 de 2012.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit((v) => save.mutate(v))}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="name">Razón social</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nit">NIT</Label>
                  <Input id="nit" {...register("nit")} />
                  {errors.nit && <p className="text-xs text-destructive">{errors.nit.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sector">Sector</Label>
                  <Input id="sector" {...register("sector")} />
                  {errors.sector && (
                    <p className="text-xs text-destructive">{errors.sector.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo de contacto</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Tamaño de empresa</Label>
                <Select
                  value={watch("size")}
                  onValueChange={(v) => setValue("size", v as FormValues["size"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pequena">Pequeña</SelectItem>
                    <SelectItem value="mediana">Mediana</SelectItem>
                    <SelectItem value="grande">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                <p className="text-muted-foreground">Responsable de tratamiento</p>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button type="submit" disabled={isSubmitting || save.isPending}>
                {(isSubmitting || save.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
