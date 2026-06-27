import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { compareAssessments, type ComparisonResult } from "@/lib/compliance/comparison";
import { preguntasDiagnostico } from "@/lib/diagnostico";
import type { AssessmentOut } from "@/lib/api/assessments";
import { levelLabel } from "@/lib/compliance/score";

type Props = {
  before: AssessmentOut;
  after: AssessmentOut;
};

export function BeforeAfterPanel({ before, after }: Props) {
  const result: ComparisonResult = compareAssessments(before, after);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparación antes / después</CardTitle>
        <CardDescription>Evolución del nivel de cumplimiento al implementar recomendaciones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{result.summary}</p>

        <div className="grid grid-cols-2 gap-4">
          <SnapshotCard label="Antes" snapshot={result.before} />
          <SnapshotCard label="Después" snapshot={result.after} />
        </div>

        <div className="flex items-center justify-center gap-3 rounded-lg border p-4">
          <DeltaIcon delta={result.deltaScore} />
          <div className="text-center">
            <p className="text-2xl font-bold">
              {result.deltaScore > 0 ? "+" : ""}
              {result.deltaScore}%
            </p>
            <p className="text-xs text-muted-foreground">Cambio en cumplimiento</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{result.improvedQuestions.length}</p>
            <p className="text-xs text-muted-foreground">Áreas mejoradas</p>
          </div>
        </div>

        {result.improvedQuestions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-700 mb-2">Mejoras detectadas</p>
            <ul className="space-y-1">
              {result.improvedQuestions.map((qId) => {
                const q = preguntasDiagnostico.find((p) => p.id === qId);
                return (
                  <li key={qId} className="text-sm text-muted-foreground flex items-center gap-2">
                    <ArrowUp className="h-3 w-3 text-green-600" />
                    {q?.texto ?? `Pregunta ${qId}`}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SnapshotCard({
  label,
  snapshot,
}: {
  label: string;
  snapshot: ComparisonResult["before"];
}) {
  return (
    <div className="rounded-lg border p-3 space-y-1 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{snapshot.puntaje}%</p>
      <Badge variant="outline">{snapshot.label}</Badge>
      <p className="text-xs text-muted-foreground">Nivel {levelLabel(snapshot.level)}</p>
      <p className="text-xs">{snapshot.brechasCount} brechas · {snapshot.fecha.slice(0, 10)}</p>
    </div>
  );
}

function DeltaIcon({ delta }: { delta: number }) {
  if (delta > 0) return <ArrowUp className="h-8 w-8 text-green-600" />;
  if (delta < 0) return <ArrowDown className="h-8 w-8 text-red-500" />;
  return <Minus className="h-8 w-8 text-muted-foreground" />;
}
