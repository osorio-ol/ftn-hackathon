import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  buildChecklist,
  checklistProgress,
  groupChecklistByCategory,
} from "@/lib/compliance/checklist";

type Props = {
  recomendaciones: string[];
  brechas: string[];
  completed: Record<string, boolean>;
  onToggle: (id: string, done: boolean) => void;
};

export function ComplianceChecklistPanel({ recomendaciones, brechas, completed, onToggle }: Props) {
  const items = buildChecklist(recomendaciones, brechas);
  const progress = checklistProgress(items, completed);
  const grouped = groupChecklistByCategory(items);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Checklist de implementación</CardTitle>
        <CardDescription>Marca lo que vas implementando del plan de cumplimiento</CardDescription>
        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Avance</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(grouped).map(([category, catItems]) => (
          <div key={category} className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{category}</p>
            <ul className="space-y-2">
              {catItems.map((item) => (
                <li key={item.id} className="flex items-start gap-3 rounded-lg border px-3 py-2">
                  <Checkbox
                    id={item.id}
                    checked={!!completed[item.id]}
                    onCheckedChange={(v) => onToggle(item.id, v === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor={item.id} className="text-sm flex-1 cursor-pointer">
                    {item.label}
                    {item.source === "obligacion" && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Obligación periódica
                      </Badge>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
