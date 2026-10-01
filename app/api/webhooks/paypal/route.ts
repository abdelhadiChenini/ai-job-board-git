import { handlePayPalWebhook } from "@/lib/paypalWebhook";

export const dynamic = "force-dynamic";

/**
 * Legacy mount kept live for PayPal dashboards already configured with
 * `/api/webhooks/paypal`. It delegates to the same handler as
 * `/api/paypal/webhook`, so there is one implementation behind both paths.
 */
export async function POST(request: Request) {
  return handlePayPalWebhook(request);
}
