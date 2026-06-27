import { ReportDetail } from "@/components/report/report-detail";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HistorialItem } from "@/lib/history";
import { formatReportDate } from "@/lib/api/assessments";
import { downloadReporte } from "@/lib/history";
import { Download } from "lucide-react";

type ReportViewerDialogProps = {
  item: HistorialItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReportViewerDialog({ item, open, onOpenChange }: ReportViewerDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(88vh,640px)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-4 py-3">
          <DialogTitle className="text-base">Informe de cumplimiento</DialogTitle>
          <DialogDescription className="text-xs">
            {item.empresa} · {formatReportDate(item.fecha)}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <ReportDetail item={item} />
        </div>
        <div className="shrink-0 border-t p-3">
          <Button className="h-9 w-full rounded-lg text-sm" onClick={() => downloadReporte(item)}>
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
