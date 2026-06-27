import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  actionProgress,
  buildActionPlan,
  priorityColor,
  priorityLabel,
  type ActionItem,
  type ActionStatus,
} from "@/lib/compliance/action-plan";

type Props = {
  recomendaciones: string[];
  brechas: string[];
  status: Record<string, string>;
  onStatusChange: (id: string, status: ActionStatus) => void;
};

function ActionRow({
  item,
  status,
  onStatusChange,
}: {
  item: ActionItem;
  status: string;
  onStatusChange: (id: string, status: ActionStatus) => void;
}) {
  return (
    <li className="rounded-lg border p-3 space-y-2">
      <div className="flex flex-wrap items-start gap-2">
        <Badge className={`text-white ${priorityColor(item.priority)}`}>
          {priorityLabel(item.priority)}
        </Badge>
        <Badge variant="outline">{item.category}</Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          Impacto {item.impact} · Urgencia {item.urgency}
        </span>
      </div>
      <p className="text-sm font-medium">{item.title}</p>
      <Select value={status || "pendiente"} onValueChange={(v) => onStatusChange(item.id, v as ActionStatus)}>
        <SelectTrigger className="h-8 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pendiente">Pendiente</SelectItem>
          <SelectItem value="en_progreso">En progreso</SelectItem>
          <SelectItem value="completada">Completada</SelectItem>
        </SelectContent>
      </Select>
    </li>
  );
}

export function ActionPlanPanel({ recomendaciones, brechas, status, onStatusChange }: Props) {
  const items = buildActionPlan(recomendaciones, brechas);
  const progress = actionProgress(items, status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Plan de acción priorizado</CardTitle>
        <CardDescription>Tareas ordenadas por impacto y urgencia</CardDescription>
        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso del plan</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay acciones pendientes.</p>
        ) : (
          <ol className="space-y-3">
            {items.map((item, i) => (
              <div key={item.id} className="flex gap-2">
                <span className="text-sm font-bold text-primary pt-3">{i + 1}.</span>
                <div className="flex-1">
                  <ActionRow item={item} status={status[item.id] ?? "pendiente"} onStatusChange={onStatusChange} />
                </div>
              </div>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
