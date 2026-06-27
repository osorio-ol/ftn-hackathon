import { apiRequest } from "@/lib/api/client";

export type CompanyOut = {
  id: number;
  name: string;
  email: string;
  nit: string;
  sector: string;
  size: string;
  created_at: string;
};

export type CompanySummary = {
  id: number;
  name: string;
  email: string;
  nit: string;
  sector: string;
  size: string;
  assessment_count: number;
  latest_score: number | null;
  latest_status: string | null;
};

export type CompanyUpdate = {
  name?: string;
  email?: string;
  nit?: string;
  sector?: string;
  size?: "pequena" | "mediana" | "grande";
};

export async function listCompanies(): Promise<CompanySummary[]> {
  return apiRequest<CompanySummary[]>("/api/v1/companies");
}

export async function getCompany(companyId: number): Promise<CompanyOut> {
  return apiRequest<CompanyOut>(`/api/v1/companies/${companyId}`);
}

export async function updateCompany(companyId: number, payload: CompanyUpdate): Promise<CompanyOut> {
  return apiRequest<CompanyOut>(`/api/v1/companies/${companyId}`, {
    method: "PATCH",
    body: payload,
  });
}

export type AdminStats = {
  companies: number;
  assessments: number;
  users: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>("/api/v1/admin/stats");
}

