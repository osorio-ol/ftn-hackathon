import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  alertDaysLabel,
  buildPeriodicAlerts,
  severityColor,
  type ComplianceAlert,
} from "@/lib/compliance/alerts";

type Props = {
  lastAssessmentDate?: string;
  dismissed: string[];
  onDismiss: (id: string) => void;
};

export function ComplianceAlertsPanel({ lastAssessmentDate, dismissed, onDismiss }: Props) {
  const alerts = buildPeriodicAlerts(lastAssessmentDate).filter((a) => !dismissed.includes(a.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Alertas y recordatorios
        </CardTitle>
        <CardDescription>Obligaciones periódicas de cumplimiento Ley 1581</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay alertas pendientes.</p>
        ) : (
          alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onDismiss={onDismiss} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AlertRow({ alert, onDismiss }: { alert: ComplianceAlert; onDismiss: (id: string) => void }) {
  return (
    <div className={`rounded-lg border-l-4 p-3 flex gap-2 ${severityColor(alert.severity)}`}>
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap gap-2 items-center">
          <p className="text-sm font-medium">{alert.title}</p>
          <Badge variant="outline" className="text-xs">
            {alert.frequency}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{alert.description}</p>
        <p className="text-xs font-medium">{alertDaysLabel(alert.dueDate)}</p>
      </div>
      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => onDismiss(alert.id)}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
