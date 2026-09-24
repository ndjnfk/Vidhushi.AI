import { apiFetch } from "@/lib/api";

export type Topic = "love" | "career" | "marriage" | "other";
export type BookingStatus =
  | "pending" | "approved" | "payment_submitted" | "confirmed" | "completed" | "rejected" | "cancelled";

export interface ConsultationRequestIn {
  name: string;
  email: string;
  phone: string;
  place: string;
  topic: Topic;
  message: string;
}

export interface ConsultationRequestOut extends ConsultationRequestIn {
  id: string;
  status: BookingStatus;
  scheduled_at: string | null; // UTC, no offset
  duration_minutes: number | null;
  amount: number | null;
  admin_note: string;
  created_at: string;
  payment_reference: string;
}

export interface UpiPaymentInfoOut {
  upi_id: string;
  payee_name: string;
  amount: number;
  note: string;
  upi_uri: string | null; // render as a QR with the amount pre-filled
  qr_image: string | null; // admin-uploaded QR (data: URL); payer types the amount
}

export interface CallInfoOut {
  role: "client" | "host";
  ice_servers: RTCIceServer[];
  request: ConsultationRequestOut;
}

export interface CallSignalOut {
  id: string;
  sender: "client" | "host";
  kind: "join" | "offer" | "answer" | "ice" | "bye";
  data: Record<string, unknown>;
}

// The API stores naive UTC datetimes; make that explicit before parsing.
export function parseUtc(iso: string): Date {
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
}

export function formatSlot(iso: string | null): string {
  if (!iso) return "—";
  return parseUtc(iso).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export const createBooking = (body: ConsultationRequestIn) =>
  apiFetch<ConsultationRequestOut>("/bookings", { method: "POST", body: JSON.stringify(body) });
export const myBookings = () => apiFetch<ConsultationRequestOut[]>("/bookings/mine");
export const getBooking = (id: string) => apiFetch<ConsultationRequestOut>(`/bookings/${id}`);
export const cancelBooking = (id: string) => apiFetch<ConsultationRequestOut>(`/bookings/${id}/cancel`, { method: "POST" });
export const getPaymentInfo = (id: string) => apiFetch<UpiPaymentInfoOut>(`/bookings/${id}/payment-info`);
export const submitPayment = (id: string, reference: string) =>
  apiFetch<ConsultationRequestOut>(`/bookings/${id}/payment-submitted`, { method: "POST", body: JSON.stringify({ reference }) });

// Call signaling rooted at `base` (e.g. "/bookings/<id>" for the client,
// "/admin/bookings/<id>" for the host), sent with the given fetcher.
export function makeCallApi(base: string, fetcher: <T>(path: string, options?: RequestInit) => Promise<T>) {
  return {
    getCallInfo: () => fetcher<CallInfoOut>(`${base}/call`),
    sendSignal: (kind: CallSignalOut["kind"], data: Record<string, unknown> = {}) =>
      fetcher<CallSignalOut>(`${base}/signal`, { method: "POST", body: JSON.stringify({ kind, data }) }),
    pollSignals: (after: string) => fetcher<CallSignalOut[]>(`${base}/signal?after=${encodeURIComponent(after)}`),
  };
}
