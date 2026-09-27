import { useEffect, useState } from "react";
import { ArrowUpRight, Minus, Plus, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";

export type BagItem = {
  id: string;
  name: string;
  price: number; // display only — the server sets the real price at checkout
  image?: string;
  quantity: number;
  custom?: { shape: string; finish: string; color: string; note: string };
};

export const MAX_QTY = 10;
export const FLAT_SHIPPING = 4; // mirrors server/checkout.ts — placeholder until shipping policy is final
const STORAGE_KEY = "naildit-bag-v1";

export const money = (dollars: number) => `$${dollars.toFixed(2)}`;

export function useBag() {
  const [items, setItems] = useState<BagItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* private mode — bag just won't survive a reload */
    }
  }, [items]);

  const add = (item: Omit<BagItem, "quantity">) =>
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + 1) } : i));
      return [...prev, { ...item, quantity: 1 }];
    });
  const setQuantity = (id: string, quantity: number) =>
    setItems((prev) => (quantity <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i))));
  const clear = () => setItems([]);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { items, add, setQuantity, clear, count, subtotal };
}

export function BagDrawer({ bag, onClose }: { bag: ReturnType<typeof useBag>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const checkout = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: bag.items.map(({ name, quantity, custom }) => ({ name, quantity, custom })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout couldn't start — please try again.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout couldn't start — please try again.");
      setBusy(false);
    }
  };

  return <div className="modal-backdrop bag-backdrop" onClick={onClose}>
    <aside className="bag-drawer" role="dialog" aria-modal="true" aria-label="Your bag" onClick={(e) => e.stopPropagation()}>
      <div className="bag-head">
        <div><p className="eyebrow">Your bag</p><h2>{bag.count === 0 ? <>Quiet in <em>here.</em></> : <>Almost <em>yours.</em></>}</h2></div>
        <button className="modal-close" onClick={onClose} aria-label="Close bag"><X size={20} /></button>
      </div>

      {bag.items.length === 0 ? <div className="bag-empty"><ShoppingBag size={28} /><p>Your bag is looking a little quiet — start with a vibe.</p><a className="primary-button" href="#collection" onClick={onClose}>Shop the drop <ArrowUpRight size={18} /></a></div> : <>
        <ul className="bag-list">{bag.items.map((item) => <li key={item.id} className="bag-line">
          <div className="bag-thumb">{item.image ? <img src={item.image} alt="" /> : <Sparkles size={22} />}</div>
          <div className="bag-line-info">
            <strong>{item.name}</strong>
            {item.custom && <span className="bag-line-detail">{item.custom.shape} · {item.custom.finish} · {item.custom.color}</span>}
            <span className="bag-line-price">{money(item.price)}</span>
            <div className="bag-qty">
              <button onClick={() => bag.setQuantity(item.id, item.quantity - 1)} aria-label={`One less ${item.name}`}><Minus size={14} /></button>
              <span aria-live="polite">{item.quantity}</span>
              <button onClick={() => bag.setQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= MAX_QTY} aria-label={`One more ${item.name}`}><Plus size={14} /></button>
              <button className="bag-remove" onClick={() => bag.setQuantity(item.id, 0)} aria-label={`Remove ${item.name}`}><Trash2 size={14} /></button>
            </div>
          </div>
        </li>)}</ul>

        <div className="bag-foot">
          <div className="bag-row"><span>Subtotal</span><span>{money(bag.subtotal)}</span></div>
          <div className="bag-row muted"><span>Shipping</span><span>{money(FLAT_SHIPPING)}</span></div>
          <div className="bag-row total"><span>Total</span><span>{money(bag.subtotal + FLAT_SHIPPING)}</span></div>
          {error && <p className="bag-error" role="alert">{error}</p>}
          <button className="primary-button bag-checkout" onClick={checkout} disabled={busy}>{busy ? "Opening secure checkout…" : <>Checkout <ArrowUpRight size={18} /></>}</button>
          <p className="bag-note">Secure payment by Stripe. Shipping address is collected at checkout.</p>
        </div>
      </>}
    </aside>
  </div>;
}

export type OrderSummary = { paid: boolean; email: string | null; total: number | null; items: { name: string; quantity: number | null }[] };

export function OrderConfirmation({ order, onClose }: { order: OrderSummary | "loading"; onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}>
    <div className="quiz-modal order-modal" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
      {order === "loading" ? <><p className="eyebrow">Order received</p><h2>One sec…</h2><p>Confirming your payment.</p></> : <>
        <p className="eyebrow">{order.paid ? "Payment confirmed" : "Order received"}</p>
        <h2>You <em>Nail'd It!</em></h2>
        <p>{order.paid ? "Thank you — your set is officially in motion." : "Thanks! We're waiting on the payment to finish processing."}{order.email && <> A receipt is on its way to <strong>{order.email}</strong>.</>}</p>
        <ul className="order-items">{order.items.map((i, n) => <li key={n}><span>{i.name}</span><span>× {i.quantity}</span></li>)}</ul>
        {order.total != null && <div className="bag-row total"><span>Total paid</span><span>{money(order.total / 100)}</span></div>}
        <button className="primary-button" onClick={onClose}>Keep browsing <ArrowUpRight size={18} /></button>
      </>}
    </div>
  </div>;
}
