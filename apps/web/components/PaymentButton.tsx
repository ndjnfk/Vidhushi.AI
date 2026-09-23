"use client";

import { useState } from "react";
import { verifyPayment, type OrderCreateOut } from "@/lib/payments";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
    Stripe?: (key: string) => unknown;
    Cashfree?: new (options: Record<string, unknown>) => { checkout: (options: Record<string, unknown>) => void };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

interface Props {
  order: OrderCreateOut;
  onSuccess: () => void;
  onError?: (message: string) => void;
}

export default function PaymentButton({ order, onSuccess, onError }: Props) {
  const [busy, setBusy] = useState(false);

  async function handlePay() {
    setBusy(true);
    try {
      switch (order.gateway) {
        case "mock": {
          await verifyPayment(order.order_id, {});
          onSuccess();
          break;
        }
        case "razorpay": {
          await loadScript("https://checkout.razorpay.com/v1/checkout.js");
          if (!window.Razorpay) throw new Error("Razorpay checkout failed to load");
          const rzp = new window.Razorpay({
            key: order.client_config.key,
            amount: order.client_config.amount,
            currency: order.currency,
            order_id: order.gateway_order_id,
            name: "Vidushiji.ai",
            handler: async (response: Record<string, string>) => {
              await verifyPayment(order.order_id, response);
              onSuccess();
            },
          });
          rzp.open();
          break;
        }
        case "stripe": {
          await loadScript("https://js.stripe.com/v3/");
          onError?.(
            "Stripe checkout needs a mounted Payment Element — not wired up in this build yet."
          );
          break;
        }
        case "cashfree": {
          await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js");
          if (!window.Cashfree) throw new Error("Cashfree checkout failed to load");
          const cashfree = new window.Cashfree({ mode: "sandbox" });
          cashfree.checkout({
            paymentSessionId: order.client_config.payment_session_id,
            redirectTarget: "_modal",
          });
          break;
        }
        case "payu": {
          const form = document.createElement("form");
          form.method = "POST";
          form.action = String(order.client_config.action_url);
          for (const [key, value] of Object.entries(order.client_config)) {
            if (key === "action_url") continue;
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
          break;
        }
        default:
          onError?.(`Unsupported gateway: ${order.gateway}`);
      }
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={busy}
      className="bg-orange-600 text-white rounded px-5 py-2.5 disabled:opacity-50"
    >
      {busy ? "Processing..." : `Pay ₹${order.amount.toFixed(2)}`}
    </button>
  );
}
