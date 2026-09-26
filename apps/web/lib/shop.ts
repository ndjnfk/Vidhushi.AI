import { apiFetch } from "@/lib/api";
import type { UpiPaymentInfoOut } from "@/lib/bookings";

export interface ProductOut {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  category: string;
  stock_quantity: number;
  is_active?: boolean;
}

export interface ShippingAddressIn {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ShopOrderItemOut {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export type OrderStatus =
  | "placed" | "confirmed" | "shipped" | "delivered" | "cancelled"
  | "pending_payment" // waiting for the online advance
  | "payment_submitted"; // customer says they paid; Vidushi Ji checks

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string; // UTC, no offset
  note: string;
}

export interface ShopOrderOut {
  id: string;
  order_number: string;
  items: ShopOrderItemOut[];
  total_amount: number;
  status: OrderStatus;
  payment_method: string;
  shipping_address: ShippingAddressIn;
  customer_email: string;
  courier: string;
  tracking_number: string;
  history: OrderStatusEvent[];
  created_at: string;
  advance_amount: number; // paid online first ("partial"); 0 for Cash on Delivery
  cod_amount: number; // paid on delivery
  payment_reference: string;
}

// How an order would be paid, decided by the server from the delivery address.
export interface PaymentPlanOut {
  method: "cod" | "partial";
  total: number;
  advance_amount: number;
  cod_amount: number;
}

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatPrice(amount: number): string {
  return INR.format(amount);
}

export function isOnSale(p: ProductOut): boolean {
  return p.compare_at_price != null && p.compare_at_price > p.price;
}

export function listProducts(category?: string): Promise<ProductOut[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiFetch<ProductOut[]>(`/shop/products${query}`);
}

export function getProduct(id: string): Promise<ProductOut> {
  return apiFetch<ProductOut>(`/shop/products/${id}`);
}

export function paymentPlan(items: { product_id: string; quantity: number }[], pincode: string): Promise<PaymentPlanOut> {
  return apiFetch<PaymentPlanOut>("/shop/payment-plan", { method: "POST", body: JSON.stringify({ items, pincode }) });
}

// Places the order straight away (reserving stock). Some orders then need an
// online advance by UPI before they ship — see the order page.
export function checkout(
  items: { product_id: string; quantity: number }[],
  shippingAddress: ShippingAddressIn
): Promise<ShopOrderOut> {
  return apiFetch<ShopOrderOut>("/shop/checkout", {
    method: "POST",
    body: JSON.stringify({ items, shipping_address: shippingAddress }),
  });
}

export const myOrders = () => apiFetch<ShopOrderOut[]>("/shop/orders");
export const getShopOrder = (id: string) => apiFetch<ShopOrderOut>(`/shop/orders/${id}`);
export const cancelShopOrder = (id: string) => apiFetch<ShopOrderOut>(`/shop/orders/${id}/cancel`, { method: "POST" });
export const getOrderPaymentInfo = (id: string) => apiFetch<UpiPaymentInfoOut>(`/shop/orders/${id}/payment-info`);
export const submitOrderPayment = (id: string, reference: string) =>
  apiFetch<ShopOrderOut>(`/shop/orders/${id}/payment-submitted`, { method: "POST", body: JSON.stringify({ reference }) });
