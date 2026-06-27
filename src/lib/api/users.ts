import { apiRequest } from "@/lib/api/client";
import type { User } from "@/lib/auth";

export type CreateUserPayload = {
  email: string;
  password: string;
  name: string;
  role: "admin" | "auditor" | "company";
};

export async function listUsers(): Promise<User[]> {
  return apiRequest<User[]>("/api/v1/users");
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  return apiRequest<User>("/api/v1/users", { method: "POST", body: payload });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

