import { useState } from "react";
import { Download, Eye } from "lucide-react";
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

type ReportViewerDialogProps = {
  item: HistorialItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReportViewerDialog({ item, open, onOpenChange }: ReportViewerDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Informe de cumplimiento</DialogTitle>
          <DialogDescription>
            {item.empresa} · {formatReportDate(item.fecha)}
          </DialogDescription>
        </DialogHeader>
        <ReportDetail item={item} />
        <Button className="w-full rounded-xl" onClick={() => downloadReporte(item)}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </DialogContent>
    </Dialog>
  );
}

type ReportActionsProps = {
  item: HistorialItem;
  size?: "sm" | "default";
};

export function ReportActions({ item, size = "sm" }: ReportActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end gap-1">
        <Button size={size} variant="outline" onClick={() => setOpen(true)}>
          <Eye className="mr-1 h-3 w-3" />
          Ver informe
        </Button>
        <Button size={size} variant="outline" onClick={() => downloadReporte(item)}>
          <Download className="mr-1 h-3 w-3" />
          PDF
        </Button>
      </div>
      <ReportViewerDialog item={item} open={open} onOpenChange={setOpen} />
    </>
  );
}
