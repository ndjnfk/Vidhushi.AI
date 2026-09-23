import { apiFetch } from "@/lib/api";
import type { OrderCreateOut } from "@/lib/payments";

export interface ProductOut {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  stock_quantity: number;
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

export interface ShopOrderOut {
  id: string;
  items: ShopOrderItemOut[];
  total_amount: number;
  status: string;
  order: OrderCreateOut | null;
}

export function listProducts(category?: string): Promise<ProductOut[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiFetch<ProductOut[]>(`/shop/products${query}`);
}

export function getProduct(id: string): Promise<ProductOut> {
  return apiFetch<ProductOut>(`/shop/products/${id}`);
}

export function checkout(
  items: { product_id: string; quantity: number }[],
  shippingAddress: ShippingAddressIn
): Promise<ShopOrderOut> {
  return apiFetch<ShopOrderOut>("/shop/checkout", {
    method: "POST",
    body: JSON.stringify({ items, shipping_address: shippingAddress }),
  });
}

export function getShopOrder(id: string): Promise<ShopOrderOut> {
  return apiFetch<ShopOrderOut>(`/shop/orders/${id}`);
}
