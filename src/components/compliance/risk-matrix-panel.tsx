import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildRiskMatrixFromBrechas,
  riskLevelColor,
  riskLevelLabel,
  type RiskItem,
} from "@/lib/compliance/risk-matrix";

type Props = {
  brechas: string[];
};

function MatrixGrid({ items }: { items: RiskItem[] }) {
  const impacts = [5, 4, 3, 2, 1];
  const likelihoods = [1, 2, 3, 4, 5];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left text-muted-foreground">Impacto ↓ / Prob. →</th>
            {likelihoods.map((l) => (
              <th key={l} className="p-2 text-center font-normal text-muted-foreground">
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {impacts.map((impact) => (
            <tr key={impact}>
              <td className="p-2 font-medium text-muted-foreground">{impact}</td>
              {likelihoods.map((likelihood) => {
                const cellItems = items.filter((i) => i.impact === impact && i.likelihood === likelihood);
                const score = impact * likelihood;
                const bg =
                  score >= 20
                    ? "bg-red-200 dark:bg-red-900/40"
                    : score >= 15
                      ? "bg-orange-200 dark:bg-orange-900/40"
                      : score >= 9
                        ? "bg-yellow-100 dark:bg-yellow-900/30"
                        : "bg-green-100 dark:bg-green-900/20";
                return (
                  <td key={likelihood} className={`p-1 border border-border/50 ${bg} text-center`}>
                    {cellItems.length > 0 ? (
                      <span className="font-bold text-foreground">{cellItems.length}</span>
                    ) : (
                      <span className="text-muted-foreground/40">·</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RiskMatrixPanel({ brechas }: Props) {
  const items = buildRiskMatrixFromBrechas(brechas);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Matriz de riesgos</CardTitle>
        <CardDescription>
          Incumplimientos ordenados por criticidad (impacto × probabilidad)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No se detectaron incumplimientos críticos.</p>
        ) : (
          <>
            <MatrixGrid items={items} />
            <ul className="space-y-2">
              {items.slice(0, 6).map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <Badge className={`shrink-0 ${riskLevelColor(item.level)}`}>
                    {riskLevelLabel(item.level)}
                  </Badge>
                  <div>
                    <p className="font-medium">{item.category}</p>
                    <p className="text-muted-foreground text-xs">{item.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
