import { apiFetch } from "@/lib/api";
import type { OrderCreateOut } from "@/lib/payments";

export interface RitualServiceOut {
  id: string;
  name: string;
  description: string;
  price_min: number;
  price_max: number;
}

export interface RitualBookingOut {
  id: string;
  ritual_service_id: string;
  intention_text: string;
  agreed_price: number;
  weekly: boolean;
  status: string;
  next_candle_date: string | null;
  billing_mode: string;
  subscription_status: string | null;
  order: OrderCreateOut | null;
}

export interface RitualBookingCreate {
  ritual_service_id: string;
  intention_text: string;
  agreed_price: number;
}

export interface SubscriptionEnableOut {
  gateway: string;
  gateway_subscription_id: string;
  client_config: Record<string, unknown>;
}

export function listRituals(): Promise<RitualServiceOut[]> {
  return apiFetch<RitualServiceOut[]>("/rituals");
}

export function getRitual(id: string): Promise<RitualServiceOut> {
  return apiFetch<RitualServiceOut>(`/rituals/${id}`);
}

export function bookRitual(payload: RitualBookingCreate): Promise<RitualBookingOut> {
  return apiFetch<RitualBookingOut>("/rituals/book", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getRitualBooking(id: string): Promise<RitualBookingOut> {
  return apiFetch<RitualBookingOut>(`/rituals/bookings/${id}`);
}

export function renewRitualBooking(id: string): Promise<RitualBookingOut> {
  return apiFetch<RitualBookingOut>(`/rituals/bookings/${id}/renew`, { method: "POST" });
}

export function enableAutoRenew(id: string): Promise<SubscriptionEnableOut> {
  return apiFetch<SubscriptionEnableOut>(`/rituals/bookings/${id}/enable-auto-renew`, { method: "POST" });
}

export function confirmSubscription(id: string): Promise<RitualBookingOut> {
  return apiFetch<RitualBookingOut>(`/rituals/bookings/${id}/confirm-subscription`, { method: "POST" });
}
