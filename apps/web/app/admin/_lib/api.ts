import { apiRequest, type MeOut, type TokenOut } from "@/lib/api";
import { makeCallApi, type BookingKind, type Channel, type ConsultationRequestOut, type FeeItem } from "@/lib/bookings";
import { makeChatApi, type ChatConversationOut } from "@/lib/chat";
import type { ProductOut, ShopOrderOut } from "@/lib/shop";
import type { HomeContent } from "@/lib/useHomeContent";
import type { TarotContent } from "@/lib/useTarotContent";
import type { SocialLink } from "@/lib/useSiteInfo";
import { adminFetch } from "./session";

export const adminLogin = (email: string, password: string) =>
  apiRequest<TokenOut>("/admin/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, null);
export const adminMe = () => adminFetch<MeOut>("/admin/auth/me");

export const listBookings = (kind?: BookingKind) =>
  adminFetch<ConsultationRequestOut[]>(`/admin/bookings${kind ? `?kind=${kind}` : ""}`);
export const approveBooking = (
  id: string,
  body: { scheduled_at: string; duration_minutes: number; fee_items: FeeItem[]; note: string; channels?: Channel[] },
) => adminFetch<ConsultationRequestOut>(`/admin/bookings/${id}/approve`, { method: "POST", body: JSON.stringify(body) });
export const rejectBooking = (id: string, note: string) =>
  adminFetch<ConsultationRequestOut>(`/admin/bookings/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) });
export const markPaymentReceived = (id: string) =>
  adminFetch<ConsultationRequestOut>(`/admin/bookings/${id}/payment-received`, { method: "POST" });
export const completeBooking = (id: string) =>
  adminFetch<ConsultationRequestOut>(`/admin/bookings/${id}/complete`, { method: "POST" });

export const hostCallApi = (id: string) => makeCallApi(`/admin/bookings/${id}`, adminFetch);

export const listConversations = () => adminFetch<ChatConversationOut[]>("/admin/chats");
export const unreadChats = () => adminFetch<{ unread: number }>("/admin/chats/unread-count");
export const hostChatApi = (id: string) => makeChatApi(`/admin/bookings/${id}`, adminFetch);

export interface UpiSettingsOut {
  upi_id: string;
  payee_name: string;
  qr_image: string | null;
  updated_at: string | null;
}

export const getUpiSettings = () => adminFetch<UpiSettingsOut>("/admin/upi");
export const saveUpiSettings = (upi_id: string, payee_name: string) =>
  adminFetch<UpiSettingsOut>("/admin/upi", { method: "PUT", body: JSON.stringify({ upi_id, payee_name }) });
export const uploadUpiQr = (data_url: string) =>
  adminFetch<UpiSettingsOut>("/admin/upi/qr", { method: "PUT", body: JSON.stringify({ data_url }) });
export const deleteUpiQr = () => adminFetch<UpiSettingsOut>("/admin/upi/qr", { method: "DELETE" });
export const bookingPhotos = (id: string) => adminFetch<string[]>(`/admin/bookings/${id}/photos`);
export const bookingCounts = (kind?: BookingKind) =>
  adminFetch<{ pending: number; payment_submitted: number }>(`/admin/bookings/counts${kind ? `?kind=${kind}` : ""}`);

export const listOrders = (status?: string) => adminFetch<ShopOrderOut[]>(`/admin/orders${status ? `?status=${status}` : ""}`);
export const orderCounts = () => adminFetch<{ open: number }>("/admin/orders/counts");
export const markOrderPaymentReceived = (id: string) =>
  adminFetch<ShopOrderOut>(`/admin/orders/${id}/payment-received`, { method: "POST" });
export const updateOrderStatus = (id: string, body: { status: string; courier?: string; tracking_number?: string; note?: string }) =>
  adminFetch<ShopOrderOut>(`/admin/orders/${id}/status`, { method: "PUT", body: JSON.stringify(body) });

export interface ProductIn {
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category: string;
  stock_quantity: number;
  is_active: boolean;
}

export const listAdminProducts = () => adminFetch<ProductOut[]>("/admin/products");
export const createProduct = (body: ProductIn) => adminFetch<ProductOut>("/admin/products", { method: "POST", body: JSON.stringify(body) });
export const updateProduct = (id: string, body: Partial<ProductIn>) =>
  adminFetch<ProductOut>(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const uploadProductImage = (id: string, data_url: string) =>
  adminFetch<ProductOut>(`/admin/products/${id}/image`, { method: "PUT", body: JSON.stringify({ data_url }) });

export interface ContactMessageOut {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  handled: boolean;
  created_at: string;
}

export const listMessages = () => adminFetch<ContactMessageOut[]>("/admin/messages");
export const messageCounts = () => adminFetch<{ unhandled: number }>("/admin/messages/counts");
export const setMessageHandled = (id: string, handled: boolean) =>
  adminFetch<ContactMessageOut>(`/admin/messages/${id}/handled?handled=${handled}`, { method: "PUT" });

export interface SiteSettings {
  phone: string;
  show_phone: boolean;
  email: string;
  show_email: boolean;
  address: string;
  show_address: boolean;
  hours: string;
  show_hours: boolean;
  whatsapp: string;
  show_whatsapp: boolean;
  social_links: SocialLink[];
}

export const getSiteSettings = () => adminFetch<SiteSettings>("/admin/site");
export const saveSiteSettings = (body: SiteSettings) =>
  adminFetch<SiteSettings>("/admin/site", { method: "PUT", body: JSON.stringify(body) });


export const getHomeContent = () => adminFetch<HomeContent>("/admin/home");
export const saveHomeContent = (body: HomeContent) =>
  adminFetch<HomeContent>("/admin/home", { method: "PUT", body: JSON.stringify(body) });
export const getTarotContent = () => adminFetch<TarotContent>("/admin/tarot");
export const saveTarotContent = (body: TarotContent) =>
  adminFetch<TarotContent>("/admin/tarot", { method: "PUT", body: JSON.stringify(body) });
export const uploadHomeImage = (slot: string, data_url: string) =>
  adminFetch<{ url: string }>(`/admin/home/images/${slot}`, { method: "PUT", body: JSON.stringify({ data_url }) });

// Deletes every table's data except the admin accounts (sidebar "Clear data").
export const clearAllData = (password: string, confirm: string) =>
  adminFetch<{ deleted: Record<string, number>; total: number }>("/admin/maintenance/clear-data", {
    method: "POST",
    body: JSON.stringify({ password, confirm }),
  });
