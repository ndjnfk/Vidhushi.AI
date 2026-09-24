import { apiFetch } from "@/lib/api";

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

export type OrderStatus = "placed" | "confirmed" | "shipped" | "delivered" | "cancelled" | "pending_payment";

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

// Cash on Delivery: places the order straight away.
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
