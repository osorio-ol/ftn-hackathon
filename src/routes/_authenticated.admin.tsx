import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Loader2, Shield, UserPlus, Users } from "lucide-react";
import { getAdminStats, listCompanies } from "@/lib/api/companies";
import { createUser, listUsers } from "@/lib/api/users";
import { roleLabel } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(5),
  role: z.enum(["admin", "auditor", "company"]),
});

type UserForm = z.infer<typeof userSchema>;

function AdminPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: getAdminStats });
  const users = useQuery({ queryKey: ["users"], queryFn: listUsers });
  const companies = useQuery({ queryKey: ["companies"], queryFn: listCompanies });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "auditor" },
  });

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("Usuario creado");
      reset();
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["users"] });
      void qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const kpis = [
    { label: "Empresas", value: stats.data?.companies ?? 0, icon: Building2 },
    { label: "Evaluaciones", value: stats.data?.assessments ?? 0, icon: Shield },
    { label: "Usuarios", value: stats.data?.users ?? 0, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-bold">
                  {stats.isLoading ? "—" : k.value}
                </p>
              </div>
              <k.icon className="h-8 w-8 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestión de usuarios</CardTitle>
                <CardDescription>Crea administradores y auditores.</CardDescription>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Nuevo usuario
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear usuario</DialogTitle>
                    <DialogDescription>
                      Los usuarios empresa se registran desde la página pública.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={handleSubmit((v) => create.mutate(v))}
                    className="space-y-3"
                  >
                    <div className="space-y-1.5">
                      <Label>Nombre</Label>
                      <Input {...register("name")} />
                      {errors.name && (
                        <p className="text-xs text-destructive">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Correo</Label>
                      <Input type="email" {...register("email")} />
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contraseña</Label>
                      <Input type="password" {...register("password")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rol</Label>
                      <Select
                        value={watch("role")}
                        onValueChange={(v) => setValue("role", v as UserForm["role"])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="auditor">Auditor</SelectItem>
                          <SelectItem value="company">Empresa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={isSubmitting || create.isPending}>
                      {(isSubmitting || create.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Crear
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {users.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Empresa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.data?.map((u) => (
                      <TableRow key={u.email}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{roleLabel(u.role)}</Badge>
                        </TableCell>
                        <TableCell>{u.company_name ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Empresas registradas</CardTitle>
              <CardDescription>Estado de cumplimiento por organización.</CardDescription>
            </CardHeader>
            <CardContent>
              {companies.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>NIT</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Evaluaciones</TableHead>
                      <TableHead>Último puntaje</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.data?.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.nit}</TableCell>
                        <TableCell>{c.sector}</TableCell>
                        <TableCell>{c.assessment_count}</TableCell>
                        <TableCell>
                          {c.latest_score != null ? `${Math.round(c.latest_score)}%` : "—"}
                        </TableCell>
                        <TableCell>
                          {c.latest_status ? (
                            <Badge variant="outline">{c.latest_status}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
