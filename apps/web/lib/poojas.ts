import { apiFetch } from "@/lib/api";
import type { OrderCreateOut } from "@/lib/payments";

export interface PoojaServiceOut {
  id: string;
  name: string;
  description: string;
  service_type: string;
  price: number;
  duration_minutes: number;
}

export interface PoojaBookingOut {
  id: string;
  pooja_service_id: string;
  devotee_name: string;
  scheduled_date: string;
  status: string;
  order: OrderCreateOut | null;
}

export interface PoojaBookingCreate {
  pooja_service_id: string;
  devotee_name: string;
  gotra?: string;
  nakshatra?: string;
  scheduled_date: string;
}

export function listPoojas(): Promise<PoojaServiceOut[]> {
  return apiFetch<PoojaServiceOut[]>("/poojas");
}

export function getPooja(id: string): Promise<PoojaServiceOut> {
  return apiFetch<PoojaServiceOut>(`/poojas/${id}`);
}

export function bookPooja(payload: PoojaBookingCreate): Promise<PoojaBookingOut> {
  return apiFetch<PoojaBookingOut>("/poojas/book", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getPoojaBooking(id: string): Promise<PoojaBookingOut> {
  return apiFetch<PoojaBookingOut>(`/poojas/bookings/${id}`);
}
