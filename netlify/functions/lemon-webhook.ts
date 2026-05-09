import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import * as crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/** Verify LemonSqueezy webhook signature */
function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("LEMON_SQUEEZY_WEBHOOK_SECRET env var not set");
    return false;
  }
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const signature = event.headers["x-signature"] || "";
  const rawBody = event.body || "";

  if (!verifySignature(rawBody, signature)) {
    console.error("❌ Invalid LemonSqueezy webhook signature");
    return { statusCode: 401, body: "Invalid signature" };
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const eventName: string = payload?.meta?.event_name || "";
  const attributes = payload?.data?.attributes || {};
  const customData = payload?.meta?.custom_data || {};

  // customer_email is the most reliable way to link back to our users table
  const customerEmail: string =
    attributes.user_email || customData.email || "";
  const customerId = String(payload?.data?.attributes?.customer_id || "");
  const subscriptionId = String(payload?.data?.id || "");
  const currentPeriodEnd: string | null =
    attributes.renews_at || attributes.ends_at || null;

  console.log(`📦 LemonSqueezy webhook: ${eventName} for ${customerEmail}`);

  if (!customerEmail) {
    console.error("No customer email in webhook payload");
    return { statusCode: 200, body: "OK (no email to match)" };
  }

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed": {
      const { error } = await supabase
        .from("users")
        .update({
          subscription_status: "active",
          lemon_squeezy_customer_id: customerId,
          lemon_squeezy_subscription_id: subscriptionId,
          current_period_end: currentPeriodEnd,
        })
        .eq("email", customerEmail);
      if (error) console.error("Supabase update error:", error);
      break;
    }

    case "subscription_cancelled": {
      // Cancelled but access continues until period end
      const { error } = await supabase
        .from("users")
        .update({
          subscription_status: "cancelled",
          lemon_squeezy_subscription_id: subscriptionId,
          current_period_end: currentPeriodEnd,
        })
        .eq("email", customerEmail);
      if (error) console.error("Supabase update error:", error);
      break;
    }

    case "subscription_expired":
    case "subscription_payment_failed": {
      const { error } = await supabase
        .from("users")
        .update({ subscription_status: "expired" })
        .eq("email", customerEmail);
      if (error) console.error("Supabase update error:", error);
      break;
    }

    default:
      console.log(`ℹ️ Unhandled LemonSqueezy event: ${eventName}`);
  }

  return { statusCode: 200, body: "OK" };
};
