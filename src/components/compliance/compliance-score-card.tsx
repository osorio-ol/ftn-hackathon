import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComplianceGauge } from "@/components/diagnostico/compliance-gauge";
import { buildComplianceScore, levelLabel } from "@/lib/compliance/score";

type Props = {
  puntaje: number;
  showGauge?: boolean;
};

export function ComplianceScoreCard({ puntaje, showGauge = true }: Props) {
  const score = buildComplianceScore(puntaje);

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        {showGauge && <ComplianceGauge value={score.percentage} size={108} compact />}
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-semibold">Puntaje de cumplimiento</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">
              {score.label}
            </Badge>
            <Badge className="text-xs text-white" style={{ backgroundColor: score.color }}>
              Nivel {levelLabel(score.level)}
            </Badge>
          </div>
          <p className="text-xs leading-snug text-muted-foreground">
            {score.level === "alto"
              ? "Cumplimiento satisfactorio según Ley 1581."
              : score.level === "medio"
                ? "Cumplimiento parcial. Prioriza el plan de acción."
                : "Cumplimiento bajo. Atiende incumplimientos críticos."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
