import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Puntaje de cumplimiento</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-6">
        {showGauge && <ComplianceGauge value={score.percentage} size={140} />}
        <div className="space-y-2 text-center sm:text-left">
          <p className="text-4xl font-bold" style={{ color: score.color }}>
            {score.percentage}%
          </p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <Badge variant="outline">{score.label}</Badge>
            <Badge className="text-white" style={{ backgroundColor: score.color }}>
              Nivel {levelLabel(score.level)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            {score.level === "alto"
              ? "Cumplimiento satisfactorio según el autodiagnóstico Ley 1581."
              : score.level === "medio"
                ? "Cumplimiento parcial. Implemente el plan de acción prioritario."
                : "Cumplimiento bajo. Atienda los incumplimientos críticos de inmediato."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
