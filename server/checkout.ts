import fs from "node:fs";
import Stripe from "stripe";

// Prices are decided here on the server, never taken from the browser.
// The three launch sets are built in; anything the Operations app publishes to
// public/data/ops-products.json is merged over them by name, same as the storefront does.
const LAUNCH_SETS: Record<string, number> = {
  "Wild for Wildflowers": 2400,
  "Love Letters": 2400,
  "Golden Afternoon": 2400,
};
const CUSTOM_SET_NAME = "Custom Set";
const CUSTOM_SET_PRICE = 2200;
// Placeholder until the real shipping policy is written (brand guide, Pre-Launch — Store).
const FLAT_SHIPPING = 400;
const MAX_QTY_PER_ITEM = 10;

export type CheckoutItem = { name: string; quantity: number; custom?: { shape: string; finish: string; color: string; note: string } };

let stripeClient: Stripe | null = null;
let stripeKey = "";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new CheckoutError(503, "Checkout isn't set up yet — add STRIPE_SECRET_KEY to the .env file.");
  // Test mode only for now: refuse live keys so no real card can be charged by accident.
  if (!/^(sk|rk)_test_/.test(key)) throw new CheckoutError(503, "Checkout only accepts Stripe test-mode keys (sk_test_…) right now.");
  if (stripeKey !== key) {
    stripeClient = new Stripe(key);
    stripeKey = key;
  }
  return stripeClient!;
}

export class CheckoutError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function loadPrices(opsCatalogPath: string): Record<string, number> {
  const prices = { ...LAUNCH_SETS };
  try {
    const catalog = JSON.parse(fs.readFileSync(opsCatalogPath, "utf-8")) as { products?: { name?: string; price?: string }[] };
    for (const p of catalog.products ?? []) {
      const dollars = Number(String(p.price ?? "").replace(/[^0-9.]/g, ""));
      if (p.name && dollars > 0) prices[p.name] = Math.round(dollars * 100);
    }
  } catch {
    /* no ops catalog published — launch sets only */
  }
  return prices;
}

const clip = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

export async function createCheckoutSession(body: unknown, origin: string, opsCatalogPath: string) {
  const items = (body as { items?: CheckoutItem[] })?.items;
  if (!Array.isArray(items) || items.length === 0) throw new CheckoutError(400, "Your bag is empty.");
  if (items.length > 20) throw new CheckoutError(400, "That's a lot of sets — please split it into smaller orders.");

  const prices = loadPrices(opsCatalogPath);
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const metadata: Record<string, string> = {};

  items.forEach((item, i) => {
    const quantity = Math.floor(Number(item?.quantity));
    if (!(quantity >= 1 && quantity <= MAX_QTY_PER_ITEM)) throw new CheckoutError(400, `Quantity for ${clip(item?.name, 60)} must be 1–${MAX_QTY_PER_ITEM}.`);

    if (item.name === CUSTOM_SET_NAME && item.custom) {
      const summary = `${clip(item.custom.shape, 20)} · ${clip(item.custom.finish, 20)} · ${clip(item.custom.color, 30)}`;
      const note = clip(item.custom.note, 450);
      metadata[`custom_${i + 1}`] = `${summary} — ${note}`.slice(0, 500);
      lineItems.push({
        quantity,
        price_data: { currency: "usd", unit_amount: CUSTOM_SET_PRICE, product_data: { name: `Custom Set (${summary})`, description: note || undefined } },
      });
      return;
    }

    const unitAmount = prices[item?.name];
    if (!unitAmount) throw new CheckoutError(400, `${clip(item?.name, 60) || "One item"} isn't available right now.`);
    lineItems.push({ quantity, price_data: { currency: "usd", unit_amount: unitAmount, product_data: { name: item.name } } });
  });

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    shipping_address_collection: { allowed_countries: ["US"] },
    shipping_options: [
      { shipping_rate_data: { type: "fixed_amount", display_name: "Standard shipping", fixed_amount: { amount: FLAT_SHIPPING, currency: "usd" } } },
    ],
    metadata,
    success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancelled`,
  });
  return { url: session.url };
}

// Used by the thank-you screen to show what was paid.
export async function getCheckoutSummary(sessionId: string) {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) throw new CheckoutError(400, "Unknown order.");
  const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
  return {
    paid: session.payment_status === "paid",
    email: session.customer_details?.email ?? null,
    total: session.amount_total,
    items: session.line_items?.data.map((li) => ({ name: li.description, quantity: li.quantity })) ?? [],
  };
}

// Tiny framework-agnostic handler so the Vite dev server and the Express server share one code path.
type Req = { method?: string; url?: string; headers: Record<string, string | string[] | undefined>; on: (e: string, cb: (chunk?: any) => void) => void };
type Res = { writeHead: (status: number, headers: Record<string, string>) => void; end: (body: string) => void };

export function checkoutApi(opsCatalogPath: string) {
  return async (req: Req, res: Res, next: () => void) => {
    const url = new URL(req.url ?? "/", "http://local");
    const send = (status: number, data: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify(data));
    };
    try {
      if (req.method === "POST" && url.pathname === "/api/checkout") {
        const raw = await new Promise<string>((resolve, reject) => {
          let data = "";
          req.on("data", (chunk) => {
            data += chunk;
            if (data.length > 50_000) reject(new CheckoutError(413, "Request too large."));
          });
          req.on("end", () => resolve(data));
          req.on("error", reject);
        });
        const origin = process.env.PUBLIC_SITE_URL?.replace(/\/+$/, "") || `${req.headers["x-forwarded-proto"] ?? "http"}://${req.headers.host}`;
        return send(200, await createCheckoutSession(JSON.parse(raw || "{}"), origin, opsCatalogPath));
      }
      if (req.method === "GET" && url.pathname === "/api/checkout/session") {
        return send(200, await getCheckoutSummary(url.searchParams.get("id") ?? ""));
      }
      next();
    } catch (err) {
      if (err instanceof CheckoutError) return send(err.status, { error: err.message });
      if (err instanceof SyntaxError) return send(400, { error: "Bad request." });
      console.error("[checkout]", err);
      send(502, { error: "Checkout is having a moment — please try again." });
    }
  };
}
