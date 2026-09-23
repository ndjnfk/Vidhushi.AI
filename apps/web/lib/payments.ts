import { apiFetch } from "@/lib/api";

export interface OrderCreateOut {
  order_id: string;
  gateway: string;
  gateway_order_id: string;
  amount: number;
  currency: string;
  client_config: Record<string, unknown>;
  enabled_payment_methods: string[];
}

export interface PaymentSettingsOut {
  active_gateway: string;
  enabled_payment_methods: string[];
  configured_gateways: string[];
}

export function getActiveGateway(): Promise<PaymentSettingsOut> {
  return apiFetch<PaymentSettingsOut>("/payments/gateways");
}

export function verifyPayment(orderId: string, payload: Record<string, unknown> = {}) {
  return apiFetch<{ success: boolean; order_status: string }>("/payments/verify", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId, payload }),
  });
}
