import { FileDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DOCUMENT_TEMPLATES,
  downloadTextDocument,
  generateDocument,
  type DocumentTemplateType,
} from "@/lib/compliance/document-templates";

type Props = {
  empresa: string;
  nit?: string;
  sector?: string;
  responsable?: string;
  email?: string;
};

export function DocumentGeneratorPanel({ empresa, nit, sector, responsable, email }: Props) {
  const ctx = { empresa, nit, sector, responsable, email };

  function handleDownload(type: DocumentTemplateType, format: "txt" | "pdf") {
    const content = generateDocument(type, ctx);
    const template = DOCUMENT_TEMPLATES.find((t) => t.id === type)!;
    const filename = `${template.id}_${empresa.replace(/\s+/g, "_")}.${format === "txt" ? "txt" : "pdf"}`;
    if (format === "txt") {
      downloadTextDocument(filename, content);
    } else {
      import("@/lib/pdf-report").then(({ downloadTextAsPdf }) => {
        downloadTextAsPdf(template.title, content, filename);
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generación de documentos</CardTitle>
        <CardDescription>
          Plantillas conforme a la Ley 1581: política, autorizaciones, cláusulas y formatos
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {DOCUMENT_TEMPLATES.map((tpl) => (
          <div key={tpl.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{tpl.title}</p>
                <p className="text-xs text-muted-foreground">{tpl.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(tpl.id, "txt")}>
                <FileDown className="mr-1 h-3 w-3" />
                TXT
              </Button>
              <Button size="sm" className="flex-1" onClick={() => handleDownload(tpl.id, "pdf")}>
                <FileDown className="mr-1 h-3 w-3" />
                PDF
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
