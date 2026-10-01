import { handlePayPalWebhook } from "@/lib/paypalWebhook";

export const dynamic = "force-dynamic";

/**
 * The webhook URL registered with PayPal.
 *
 * All logic lives in `lib/paypalWebhook` and is shared with the legacy
 * `/api/webhooks/paypal` mount, so the two paths behave identically.
 */
export async function POST(request: Request) {
  return handlePayPalWebhook(request);
}