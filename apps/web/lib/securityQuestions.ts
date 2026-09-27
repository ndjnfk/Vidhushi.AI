import { apiFetch, type TokenOut } from "@/lib/api";

// Keys match the API (app/core/security_questions.py); the text is translated
// via "security.q.<key>".
export const SECURITY_QUESTIONS = [
  "first_pet",
  "first_school",
  "birth_city",
  "mother_maiden",
  "favourite_teacher",
  "childhood_friend",
] as const;
export type SecurityQuestion = (typeof SECURITY_QUESTIONS)[number];

export const forgotQuestion = (email: string) =>
  apiFetch<{ security_question: SecurityQuestion }>("/auth/forgot/question", { method: "POST", body: JSON.stringify({ email }) });

export const forgotReset = (email: string, securityAnswer: string, newPassword: string) =>
  apiFetch<TokenOut>("/auth/forgot/reset", {
    method: "POST",
    body: JSON.stringify({ email, security_answer: securityAnswer, new_password: newPassword }),
  });
