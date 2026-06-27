import { useRef, useState } from "react";
import { Upload, FileSearch, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  analyzePolicyDocument,
  readFileAsText,
  type DocumentAnalysisResult,
} from "@/lib/compliance/document-analysis";

type Props = {
  onAnalysisComplete?: (result: DocumentAnalysisResult) => void;
  previousAnalyses?: DocumentAnalysisResult[];
};

export function DocumentAnalyzerPanel({ onAnalysisComplete, previousAnalyses = [] }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentAnalysisResult | null>(
    previousAnalyses[0] ?? null
  );

  async function handleFile(file: File) {
    setLoading(true);
    try {
      const text = await readFileAsText(file);
      const analysis = analyzePolicyDocument(file.name, text);
      setResult(analysis);
      onAnalysisComplete?.(analysis);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Análisis de documentos</CardTitle>
        <CardDescription>
          Carga una política de tratamiento (.txt) para verificar requisitos mínimos Ley 1581
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Button variant="outline" className="w-full" disabled={loading} onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {loading ? "Analizando…" : "Cargar política de tratamiento"}
        </Button>

        {result && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{result.fileName}</span>
              <Badge
                variant={result.level === "cumple" ? "default" : result.level === "parcial" ? "secondary" : "destructive"}
              >
                {result.score}% — {result.level === "cumple" ? "Cumple" : result.level === "parcial" ? "Parcial" : "No cumple"}
              </Badge>
            </div>
            <Progress value={result.score} />
            <p className="text-sm text-muted-foreground">{result.summary}</p>
            <ul className="space-y-1.5">
              {result.requirements.map((req) => (
                <li key={req.id} className="flex items-start gap-2 text-sm">
                  {req.met ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <span className={req.met ? "" : "text-muted-foreground"}>{req.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
