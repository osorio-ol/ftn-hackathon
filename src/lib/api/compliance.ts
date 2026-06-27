import { apiRequest } from "@/lib/api/client";
import type { DocumentAnalysisResult } from "@/lib/compliance/document-analysis";
import type { ActionStatus } from "@/lib/compliance/action-plan";

export type ComplianceProgress = {
  company_id: number;
  assessment_id: number | null;
  checklist: Record<string, boolean>;
  action_status: Record<string, ActionStatus | string>;
  dismissed_alerts: string[];
  document_analyses: DocumentAnalysisResult[];
  updated_at?: string;
};

export async function getComplianceProgress(assessmentId?: number): Promise<ComplianceProgress> {
  const qs = assessmentId != null ? `?assessment_id=${assessmentId}` : "";
  return apiRequest<ComplianceProgress>(`/api/v1/compliance/progress${qs}`);
}

export async function saveComplianceProgress(
  patch: Partial<Pick<ComplianceProgress, "checklist" | "action_status" | "dismissed_alerts" | "document_analyses">>,
  assessmentId?: number
): Promise<ComplianceProgress> {
  const qs = assessmentId != null ? `?assessment_id=${assessmentId}` : "";
  return apiRequest<ComplianceProgress>(`/api/v1/compliance/progress${qs}`, {
    method: "PUT",
    body: patch,
  });
}
