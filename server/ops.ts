import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express, { type Request, type Response, type NextFunction } from "express";
import { getStore, loadCatalog, type Order, type Store } from "./store";

// Nail'd Ops on the web: the same app as the desktop version, served at /ops behind a password.
// Its data (normally kept only on the PC) is saved to the shared store instead, so it works from
// any device, and "Publish" updates the live storefront straight away.
//
// Needs OPS_PASSWORD. OPS_SESSION_SECRET is optional (it signs the login cookie; without it the
// password is used, so changing the password signs everyone out).

const COOKIE = "naildit_ops";
const SESSION_DAYS = 30;

function secret() {
  return process.env.OPS_SESSION_SECRET?.trim() || `ops:${process.env.OPS_PASSWORD ?? ""}`;
}

function sign(expires: number) {
  return crypto.createHmac("sha256", secret()).update(String(expires)).digest("base64url");
}

function readCookie(req: Request, name: string) {
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function isSignedIn(req: Request) {
  const [expires, sig] = (readCookie(req, COOKIE) ?? "").split(".");
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(sign(Number(expires)));
  const given = Buffer.from(sig);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

function passwordMatches(given: string) {
  const want = process.env.OPS_PASSWORD ?? "";
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(want).digest();
  return want.length > 0 && crypto.timingSafeEqual(a, b);
}

// Slow down password guessing: a handful of tries per address every 15 minutes.
const attempts = new Map<string, { count: number; reset: number }>();
function tooManyAttempts(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.reset < now) {
    attempts.set(ip, { count: 1, reset: now + 15 * 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 8;
}

function requireSignIn(req: Request, res: Response, next: NextFunction) {
  if (isSignedIn(req)) return next();
  if (req.path.startsWith("/api/")) return res.status(401).json({ error: "Please sign in again." });
  res.redirect(`/ops/login`);
}

const loginPage = (error = "") => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Nail'd Ops sign in</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1a0f1f;color:#fff;font-family:system-ui,sans-serif}
  form{background:#2a1832;padding:32px;border-radius:16px;width:min(320px,calc(100vw - 32px));box-sizing:border-box}
  h1{margin:0 0 16px;font-size:22px}
  input{width:100%;box-sizing:border-box;padding:12px;border-radius:8px;border:1px solid #6b4a78;background:#1a0f1f;color:#fff;font-size:16px}
  button{margin-top:12px;width:100%;padding:12px;border:0;border-radius:8px;background:#e00078;color:#fff;font-weight:700;font-size:16px;cursor:pointer}
  p{color:#ff8fb8;margin:10px 0 0;font-size:14px}
</style></head><body>
<form method="post" action="/ops/login">
  <h1>Nail'd Ops</h1>
  <input type="password" name="password" placeholder="Password" autocomplete="current-password" autofocus required>
  <button type="submit">Sign in</button>
  ${error ? `<p>${error}</p>` : ""}
</form></body></html>`;

// Loaded before the Ops app's own scripts. Fills localStorage from the server, then mirrors every
// Ops change back, so the unchanged desktop app code runs against the shared data.
function syncShim(state: Record<string, string>) {
  return `<script>
(function(){
  var PREFIX = "naildit-ops-";
  var server = ${JSON.stringify(state).replace(/</g, "\\u003c")};
  var ls = window.localStorage;
  var setItem = ls.setItem.bind(ls), removeItem = ls.removeItem.bind(ls);
  for (var i = ls.length - 1; i >= 0; i--) { var k = ls.key(i); if (k && k.indexOf(PREFIX) === 0 && !(k in server)) removeItem(k); }
  Object.keys(server).forEach(function(k){ setItem(k, server[k]); });
  var pending = {}, timer = null, banner = null;
  function show(msg){
    if (!banner) { banner = document.createElement("div"); banner.style.cssText = "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;background:#b00020;color:#fff;padding:10px 16px;border-radius:8px;font:14px system-ui"; document.body.appendChild(banner); }
    banner.textContent = msg; banner.style.display = msg ? "block" : "none";
  }
  function flush(){
    timer = null;
    var batch = pending; pending = {};
    fetch("/ops/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(batch) })
      .then(function(r){
        if (r.status === 401) { show("Signed out. Your last change wasn't saved. Reload to sign in."); return; }
        if (!r.ok) throw new Error(r.status);
        show("");
      })
      .catch(function(){ Object.keys(batch).forEach(function(k){ if (!(k in pending)) pending[k] = batch[k]; }); show("Can't reach the server. Retrying…"); if (!timer) timer = setTimeout(flush, 5000); });
  }
  function queue(k, v){ if (String(k).indexOf(PREFIX) !== 0) return; pending[k] = v; if (!timer) timer = setTimeout(flush, 400); }
  Storage.prototype.setItem = function(k, v){ var r = setItem.call(this, k, v); if (this === ls) queue(k, String(v)); return r; };
  Storage.prototype.removeItem = function(k){ var r = removeItem.call(this, k); if (this === ls) queue(k, null); return r; };
  window.addEventListener("beforeunload", function(){ if (Object.keys(pending).length) navigator.sendBeacon("/ops/api/state", new Blob([JSON.stringify(pending)], { type: "application/json" })); });
  window.__NAILDIT_OPS_WEB__ = true;
  // The desktop app publishes through two Tauri commands. Answer them here so the same
  // "Publish to Storefront" button (and its automatic publish on every product save) updates the live store.
  window.__TAURI__ = { core: { invoke: function(cmd, args){
    if (cmd === "publish_catalog") {
      return fetch("/ops/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ catalog: JSON.parse(args.json) }) })
        .then(function(r){ if (!r.ok) throw new Error(r.status === 401 ? "signed out, reload to sign in" : "server error " + r.status); });
    }
    if (cmd === "import_image") return Promise.reject("photos from your PC can't be published from the website yet; use a /products/... photo path");
    return Promise.reject("not available on the website");
  } } };
  document.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll('a[href^="http://localhost:3000"]').forEach(function(a){ a.setAttribute("href", "/"); });
  });
})();
</script>`;
}

// Paid store orders (saved by the Stripe webhook) are added to Ops' own Orders list the next time
// Ops opens, once each, so they can be tracked and edited like any other order.
const OPS_ORDERS = "naildit-ops-orders";
const IMPORTED = "naildit-ops-imported-store-orders";

function toOpsOrder(o: Order) {
  const custom = Object.entries(o.metadata ?? {}).filter(([k]) => k.startsWith("custom_")).map(([, v]) => v);
  const ship = (o.shipping ?? null) as { name?: string; address?: Record<string, string | null> } | null;
  const address = ship?.address ? [ship.address.line1, ship.address.line2, ship.address.city, ship.address.state, ship.address.postal_code].filter(Boolean).join(", ") : "";
  const placed = o.createdAt.slice(0, 10);
  const due = new Date(o.createdAt);
  due.setDate(due.getDate() + 7);
  return {
    id: o.id,
    customer: ship?.name || o.name || o.email || "Store customer",
    contact: o.email ?? "",
    items: o.items.map((i) => `${i.name ?? "Item"} x${i.quantity ?? 1}`).join(", "),
    total: o.total != null ? o.total / 100 : 0,
    status: "New",
    orderDate: placed,
    dueDate: due.toISOString().slice(0, 10),
    ...(custom.length ? { isCustom: true } : {}),
    notes: [address && `Ship to: ${address}`, ...custom.map((c) => `Custom: ${c}`), "Paid online through the store."].filter(Boolean).join("\n"),
  };
}

async function importStoreOrders(store: Store, state: Record<string, string>) {
  const paid = (await store.listOrders()).filter((o) => o.paid);
  if (!paid.length) return state;
  const parse = <T>(raw: string | undefined, fallback: T): T => {
    try {
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };
  const imported = new Set(parse<string[]>(state[IMPORTED], []));
  const fresh = paid.filter((o) => !imported.has(o.id)).reverse();
  if (!fresh.length) return state;
  const orders = parse<unknown[]>(state[OPS_ORDERS], []);
  const next = { ...state, [OPS_ORDERS]: JSON.stringify([...fresh.map(toOpsOrder), ...(Array.isArray(orders) ? orders : [])]), [IMPORTED]: JSON.stringify([...Array.from(imported), ...fresh.map((o) => o.id)]) };
  await store.setState(OPS_ORDERS, next[OPS_ORDERS]);
  await store.setState(IMPORTED, next[IMPORTED]);
  return next;
}

// The first time Ops opens online it has no products yet and would fill in its three demo sets,
// which its automatic publish would then push over the live catalog. Start it from the catalog
// the store already shows instead.
const OPS_PRODUCTS = "naildit-ops-products";
type CatalogProduct = Record<string, unknown> & { name?: string; mood?: string };
type CatalogMood = { name?: string; kicker?: string; text?: string; tone?: string };

async function seedProducts(store: Store, state: Record<string, string>, catalogPath: string) {
  if (state[OPS_PRODUCTS]) return state;
  const catalog = (await loadCatalog(catalogPath)) as { products?: CatalogProduct[]; moods?: CatalogMood[] } | null;
  if (!catalog?.products?.length) return state;
  const moodsLeft = new Map((catalog.moods ?? []).map((m) => [m.name, m]));
  const products = catalog.products.map((p, i) => {
    const mood = moodsLeft.get(p.mood);
    moodsLeft.delete(p.mood);
    const slug = String(p.name ?? i).toLowerCase().replace(/[^a-z0-9]+/g, "");
    return { id: `prod-${slug || i}`, ...p, ...(mood ? { moodKicker: mood.kicker ?? "", moodBlurb: mood.text ?? "", tone: mood.tone ?? "hot" } : {}) };
  });
  const value = JSON.stringify(products);
  await store.setState(OPS_PRODUCTS, value);
  return { ...state, [OPS_PRODUCTS]: value };
}

const IMAGE_TYPES: Record<string, string> = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".avif": "image/avif" };

export function opsApp(opsDir: string, catalogPath: string) {
  const router = express.Router();
  const store = getStore();

  router.get("/ops/login", (req, res) => {
    if (isSignedIn(req)) return res.redirect("/ops/");
    res.type("html").send(loginPage(process.env.OPS_PASSWORD ? "" : "Nail'd Ops isn't set up yet: add OPS_PASSWORD on the server."));
  });

  router.post("/ops/login", express.urlencoded({ extended: false, limit: "4kb" }), (req, res) => {
    if (tooManyAttempts(req.ip ?? "")) return res.status(429).type("html").send(loginPage("Too many tries. Wait 15 minutes and try again."));
    if (!passwordMatches(String(req.body?.password ?? ""))) return res.status(401).type("html").send(loginPage("That password isn't right."));
    attempts.delete(req.ip ?? "");
    const expires = Date.now() + SESSION_DAYS * 86_400_000;
    res.cookie(COOKIE, `${expires}.${sign(expires)}`, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/ops",
      expires: new Date(expires),
    });
    res.redirect("/ops/");
  });

  router.post("/ops/logout", (_req, res) => {
    res.clearCookie(COOKIE, { path: "/ops" });
    res.redirect("/ops/login");
  });

  router.use("/ops", (_req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex");
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  router.use("/ops", requireSignIn);

  // Ops' saved data. Values are the raw localStorage strings; null deletes a key.
  router.get("/ops/api/state", async (_req, res) => res.json(await store.getState()));
  router.post("/ops/api/state", express.json({ limit: "20mb" }), async (req, res) => {
    const changes = (req.body ?? {}) as Record<string, string | null>;
    for (const [key, value] of Object.entries(changes)) {
      if (!key.startsWith("naildit-ops-")) continue;
      if (value === null) await store.deleteState(key);
      else await store.setState(key, String(value));
    }
    res.json({ ok: true });
  });

  // Publish to Storefront: the catalog the store shows, plus any new product photos.
  router.post("/ops/api/publish", express.json({ limit: "40mb" }), async (req, res) => {
    const { catalog, images } = (req.body ?? {}) as { catalog?: { products?: unknown[] }; images?: { path: string; dataUrl: string }[] };
    if (!catalog || !Array.isArray(catalog.products)) return res.status(400).json({ error: "Nothing to publish." });
    for (const img of images ?? []) {
      const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(img.dataUrl ?? "");
      const ext = path.extname(img.path ?? "").toLowerCase();
      if (!m || !/^\/products\/[A-Za-z0-9._-]+$/.test(img.path ?? "") || !IMAGE_TYPES[ext]) continue;
      await store.putFile(img.path, { contentType: IMAGE_TYPES[ext], data: Buffer.from(m[2], "base64") });
    }
    await store.setCatalog(catalog);
    res.json({ ok: true, products: catalog.products.length });
  });

  router.get("/ops/api/orders", async (_req, res) => res.json(await store.listOrders()));

  router.get(["/ops", "/ops/", "/ops/index.html"], async (req, res) => {
    if (req.path === "/ops") return res.redirect("/ops/");
    let html: string;
    try {
      html = fs.readFileSync(path.join(opsDir, "index.html"), "utf-8");
    } catch {
      return res.status(503).send("Nail'd Ops hasn't been added to this server yet.");
    }
    const state = await seedProducts(store, await store.getState(), catalogPath);
    const shim = syncShim(await importStoreOrders(store, state));
    html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => `${m}\n${shim}`) : shim + html;
    res.type("html").send(html);
  });
  router.use("/ops", express.static(opsDir, { index: false }));

  return router;
}

// The storefront's side: published catalog and photos come from the shared store first.
export function storefrontData() {
  const router = express.Router();
  const store = getStore();

  router.get("/data/ops-products.json", async (_req, res, next) => {
    try {
      const catalog = await store.getCatalog();
      if (!catalog) return next();
      res.setHeader("Cache-Control", "no-store");
      res.json(catalog);
    } catch (err) {
      console.error("[store] catalog read failed, using the bundled file", err);
      next();
    }
  });

  router.get("/products/:file", async (req, res, next) => {
    try {
      const file = await store.getFile(`/products/${req.params.file}`);
      if (!file) return next();
      res.setHeader("Cache-Control", "public, max-age=300");
      res.type(file.contentType).send(file.data);
    } catch {
      next();
    }
  });

  return router;
}
