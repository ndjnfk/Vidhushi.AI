import { apiFetch } from "@/lib/api";
import type { OrderCreateOut } from "@/lib/payments";

export interface ConsultationBookingOut {
  id: string;
  vendor_id: string;
  status: string;
  order: OrderCreateOut | null;
}

export interface ConsultationMessageOut {
  id: string;
  sender: string;
  text: string;
  sent_at: string;
}

export function requestConsultation(vendorId: string): Promise<ConsultationBookingOut> {
  return apiFetch<ConsultationBookingOut>("/consultations/request", {
    method: "POST",
    body: JSON.stringify({ vendor_id: vendorId }),
  });
}

export function getConsultationMessages(consultationId: string): Promise<ConsultationMessageOut[]> {
  return apiFetch<ConsultationMessageOut[]>(`/consultations/${consultationId}/messages`);
}

export function sendConsultationMessage(consultationId: string, text: string): Promise<ConsultationMessageOut> {
  return apiFetch<ConsultationMessageOut>(`/consultations/${consultationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
