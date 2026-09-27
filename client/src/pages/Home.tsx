import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Heart, Sparkles, X } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { BagDrawer, OrderConfirmation, useBag, type OrderSummary } from "@/components/BagDrawer";
import { SiteFooter } from "@/components/SiteFooter";

const moods = [
  { name: "Wild for Wildflowers", kicker: "Bloom loud", text: "Hand-painted florals over hot pink, glitter accents included.", tone: "hot", product: "Wild for Wildflowers" },
  { name: "Love Letters", kicker: "Write it in red", text: "Romantic red with hand-stamped linework and a glitter accent nail.", tone: "plum", product: "Love Letters" },
  { name: "Golden Afternoon", kicker: "Catch the light", text: "Warm foil, chrome gold, and reflective florals for golden hour.", tone: "gold", product: "Golden Afternoon" },
];

// Cover art for each collection card, by collection name. Kept here rather than in
// ops-products.json so publishing from the Operations app doesn't drop them.
const collectionCovers: Record<string, string> = {
  "wild for wildflowers": "/collections/wildflowers-cover.png",
  "love letters": "/collections/love-letters-cover.png",
  "golden afternoon": "/collections/golden-afternoon-cover.png",
  "halloween": "/collections/halloween-cover.png",
};

const products = [
  {
    name: "Wild for Wildflowers", price: "$24", mood: "Wild for Wildflowers", detail: "Hand-painted florals · long almond", image: "/products/wildflowers-box.png", accent: "#f445a1", badge: "Hand-painted",
    description: "Electric pink glitter meets watercolor wildflowers. Accent nails bloom with teal peonies, coral poppies, and buttery-yellow petals over a hot-pink base — handmade with care, one set at a time.",
    gallery: ["/products/wildflowers-box.png", "/products/wildflowers-hands.png", "/products/wildflowers-5.png", "/products/wildflowers-6.png"],
  },
  {
    name: "Love Letters", price: "$24", mood: "Love Letters", detail: "Romantic red · glossy almond", image: "/products/love-letters-box.png", accent: "#d92059", badge: "New drop",
    description: "Classic red with a love-note twist. Hand-drawn hearts, envelopes, and lace-like filigree sit alongside ruby glitter accents — made for anniversaries, date nights, and everyday romance.",
    gallery: ["/products/love-letters-box.png", "/products/love-letters-1.png", "/products/love-letters-2.png", "/products/love-letters-3.png", "/products/love-letters-4.png", "/products/love-letters-5.png", "/products/love-letters-6.png"],
  },
  {
    name: "Golden Afternoon", price: "$24", mood: "Golden Afternoon", detail: "Warm foil · chrome gold", image: "/products/golden-afternoon-box.png", accent: "#e3a62b", badge: "Golden florals",
    description: "Warm gold foil and amber florals over a soft peach-orange base. Metallic accent nails catch the light for a set that feels like a golden-hour glow.",
    gallery: ["/products/golden-afternoon-box.png", "/products/golden-afternoon-1.png", "/products/golden-afternoon-2.png", "/products/golden-afternoon-3.png", "/products/golden-afternoon-4.png", "/products/golden-afternoon-5.png", "/products/golden-afternoon-6.png"],
  },
];

// Accent colors come from the Operations app; lift very dark ones so product
// names stay readable on the dark cards (keeps the hue, raises the lightness).
function readableAccent(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  let [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  const lum = (x: number, y: number, z: number) => 0.2126 * x + 0.7152 * y + 0.0722 * z;
  for (let t = 0; lum(r, g, b) < 110 && t < 12; t++) {
    const max = Math.max(r, g, b, 1);
    const k = Math.min(255 / max, 1.35);
    [r, g, b] = [r, g, b].map((c) => Math.min(255, Math.round(c * k + (255 - c) * 0.08)));
  }
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

const galleryPhotos = [
  { src: "/gallery/gallery-1.png", alt: "Pink glitter press-on nails with hand-painted florals" },
  { src: "/gallery/gallery-2.png", alt: "Pink glitter press-on nails with hand-painted florals, second hand" },
  { src: "/products/wildflowers-5.png", alt: "Pink glitter press-on nails with watercolor floral accents in the sun" },
  { src: "/gallery/gallery-3.png", alt: "Red press-on nails with hand-drawn hearts beside white roses" },
  { src: "/gallery/gallery-4.png", alt: "Red press-on nails with hand-drawn love notes and rose petals" },
  { src: "/products/love-letters-5.png", alt: "Red press-on nails with hand-drawn linework beside white roses and pearls" },
  { src: "/gallery/gallery-5.png", alt: "Gold and orange press-on nails over a knit sweater with dried leaves" },
  { src: "/gallery/gallery-6.png", alt: "Gold and orange press-on nails folded together on damask fabric" },
  { src: "/products/golden-afternoon-5.png", alt: "Gold chrome and orange press-on nails over an autumn leaf backdrop" },
];

function GalleryCarousel({ photos, onOpen }: { photos: typeof galleryPhotos; onOpen: (index: number) => void }) {
  const [viewport, api] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    update();
    api.on("select", update).on("reInit", update);
    return () => { api.off("select", update).off("reInit", update); };
  }, [api]);
  return <div className="photo-carousel" role="region" aria-roledescription="carousel" aria-label="Customer photo gallery" onKeyDown={(event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); api?.scrollPrev(); }
    if (event.key === "ArrowRight") { event.preventDefault(); api?.scrollNext(); }
  }}>
    <div className="photo-carousel-viewport" ref={viewport}>
      <div className="photo-carousel-track">{photos.map((photo, index) => <div className="photo-carousel-slide" key={photo.src} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${photos.length}`}>
        <button className="gallery-thumb" onClick={() => onOpen(index)} aria-label={`Open photo ${index + 1}: ${photo.alt}`}><img src={photo.src} alt={photo.alt} loading="lazy" /><span className="view-more-hint">View <ArrowUpRight size={14} /></span></button>
      </div>)}</div>
    </div>
    <div className="photo-carousel-controls">
      <button type="button" onClick={() => api?.scrollPrev()} aria-label="Previous gallery photo"><ChevronLeft size={20} /></button>
      <span aria-live="polite" aria-atomic="true">{selected + 1} / {photos.length}</span>
      <button type="button" onClick={() => api?.scrollNext()} aria-label="Next gallery photo"><ChevronRight size={20} /></button>
    </div>
  </div>;
}

function Lightbox({ photos, index, onIndex, onClose }: { photos: typeof galleryPhotos; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const go = (delta: number) => onIndex((index + delta + photos.length) % photos.length);
  return <div className="modal-backdrop" onClick={onClose}>
    <div className="lightbox-modal" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><X size={20} /></button>
      <div className="lightbox-scroll">
        <div className="lightbox-main"><img src={photos[index].src} alt={photos[index].alt} />
          <button className="gallery-nav prev" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft size={20} /></button>
          <button className="gallery-nav next" onClick={() => go(1)} aria-label="Next photo"><ChevronRight size={20} /></button>
        </div>
        <div className="quickview-thumbs">{photos.map((p, i) => <button key={p.src} className={i === index ? "active" : ""} onClick={() => onIndex(i)} aria-label={`Show photo ${i + 1}`}><img src={p.src} alt="" /></button>)}</div>
      </div>
    </div>
  </div>;
}

function ProductCard({ product, onAdd, onOpen }: { product: typeof products[number]; onAdd: (name: string) => void; onOpen: (product: typeof products[number]) => void }) {
  return <article className="product-card" onClick={() => onOpen(product)} role="button" tabIndex={0} aria-label={`View ${product.name} details`} onKeyDown={(e) => { if (e.key === "Enter") onOpen(product); }}>
    <div className="product-image-wrap" style={{ background: `radial-gradient(circle at 30% 20%, ${product.accent}99, transparent 35%), #18151b` }}>
      <img src={product.image} alt={`${product.name} press-on nails`} />
      <span className="product-badge">{product.badge}</span>
      <button className="heart-button" aria-label={`Save ${product.name}`} onClick={(e) => e.stopPropagation()}><Heart size={17} /></button>
      <span className="image-caption">Press on. Stand out.</span>
      <span className="view-more-hint">View set <ArrowUpRight size={14} /></span>
    </div>
    <div className="product-info">
      <div className="product-title-row"><h3 style={{ color: readableAccent(product.accent), textShadow: `0 0 8px ${readableAccent(product.accent)}cc, 0 0 18px ${readableAccent(product.accent)}80` }}>{product.name}</h3><span>{product.price}</span></div>
      <p className="product-mood">{product.mood} collection</p>
      <p className="product-detail">{product.detail}</p>
      <button className="add-button" onClick={(e) => { e.stopPropagation(); onAdd(product.name); }}>Add to bag <ArrowUpRight size={16} /></button>
    </div>
  </article>;
}

function QuickView({ product, onClose, onAdd, onSwitch, onCollection }: { product: typeof products[number]; onClose: () => void; onAdd: (name: string) => void; onSwitch: (p: Product) => void; onCollection: () => void }) {
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [product]);
  const siblings = products.filter((p) => p.mood.toLowerCase() === product.mood.toLowerCase() && p.name !== product.name);
  const gallery = Array.from(new Set([product.image, ...product.gallery]));
  const go = (delta: number) => setIndex((i) => (i + delta + gallery.length) % gallery.length);

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="quickview-modal" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><X size={20} /></button>
      <div className="quickview-scroll">
        <div className="quickview-gallery">
          <div className="quickview-main"><img src={gallery[index]} alt={`${product.name} press-on nails, photo ${index + 1} of ${gallery.length}`} />
            {gallery.length > 1 && <><button className="gallery-nav prev" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft size={20} /></button><button className="gallery-nav next" onClick={() => go(1)} aria-label="Next photo"><ChevronRight size={20} /></button></>}
          </div>
          {gallery.length > 1 && <div className="quickview-thumbs">{gallery.map((src, i) => <button key={src} className={i === index ? "active" : ""} onClick={() => setIndex(i)} aria-label={`Show photo ${i + 1}`}><img src={src} alt="" /></button>)}</div>}
        </div>
        <div className="quickview-copy">
          <span className="product-badge">{product.badge}</span>
          <h2 style={{ color: readableAccent(product.accent), textShadow: `0 0 10px ${readableAccent(product.accent)}cc, 0 0 24px ${readableAccent(product.accent)}80` }}>{product.name}</h2>
          <button className="quickview-collection" onClick={onCollection}>Part of the {product.mood} collection <ChevronRight size={14} /></button>
          <p className="quickview-description">{product.description}</p>
          <div className="hero-proof"><span>30 nails</span><span>12 sizes</span><span>0 boring details</span></div>
          <div className="quickview-bottom"><span className="quickview-price">{product.price}</span><button className="primary-button" onClick={() => onAdd(product.name)}>Add to bag <ArrowUpRight size={18} /></button></div>
          {siblings.length > 0 && <div className="quickview-siblings"><p className="eyebrow">More in this collection</p><div>{siblings.map((p) => <button key={p.name} onClick={() => onSwitch(p)} aria-label={`View ${p.name}`}><img src={p.image} alt="" /><span>{p.name}</span></button>)}</div></div>}
        </div>
      </div>
    </div>
  </div>;
}

type Product = typeof products[number];
type Mood = typeof moods[number];

// Each answer adds a point to the collections it fits; the highest score among
// collections that actually have sets in the shop wins.
const quizQuestions = [
  { q: <>Which set feels like <em>you</em> today?</>, options: [
    { label: "I’m blooming loud", picks: ["Wild for Wildflowers"] },
    { label: "I’m feeling romantic", picks: ["Love Letters"] },
    { label: "I want warm and golden", picks: ["Golden Afternoon"] },
    { label: "Something a little spooky", picks: ["Halloween"] },
  ] },
  { q: <>Where are these nails <em>going first?</em></>, options: [
    { label: "Brunch or a garden party", picks: ["Wild for Wildflowers"] },
    { label: "Date night", picks: ["Love Letters"] },
    { label: "A cozy fall weekend", picks: ["Golden Afternoon"] },
    { label: "A costume party", picks: ["Halloween"] },
  ] },
  { q: <>Pick a <em>palette.</em></>, options: [
    { label: "Hot pink and brights", picks: ["Wild for Wildflowers"] },
    { label: "Ruby red and blush", picks: ["Love Letters"] },
    { label: "Gold, amber, and rust", picks: ["Golden Afternoon"] },
    { label: "Black, orange, and neon", picks: ["Halloween"] },
  ] },
  { q: <>Your dream <em>finish?</em></>, options: [
    { label: "Glitter, obviously", picks: ["Wild for Wildflowers", "Halloween"] },
    { label: "Glossy and classic", picks: ["Love Letters"] },
    { label: "Chrome and foil", picks: ["Golden Afternoon"] },
    { label: "Moody and dramatic", picks: ["Halloween", "Love Letters"] },
  ] },
  { q: <>Choose your <em>word.</em></>, options: [
    { label: "Playful", picks: ["Wild for Wildflowers"] },
    { label: "Sweet", picks: ["Love Letters"] },
    { label: "Cozy", picks: ["Golden Afternoon"] },
    { label: "Mysterious", picks: ["Halloween"] },
  ] },
];

function Quiz({ collections, setsIn, onClose, onShop }: { collections: Mood[]; setsIn: (m: Mood) => Product[]; onClose: () => void; onShop: (m: Mood) => void }) {
  const [answers, setAnswers] = useState<string[][]>([]);
  const step = answers.length;
  const done = step >= quizQuestions.length;
  let match: Mood | null = null;
  if (done) {
    const score = new Map<string, number>();
    answers.flat().forEach((name) => score.set(name.toLowerCase(), (score.get(name.toLowerCase()) ?? 0) + 1));
    match = collections.filter((m) => setsIn(m).length > 0).sort((a, b) => (score.get(b.name.toLowerCase()) ?? 0) - (score.get(a.name.toLowerCase()) ?? 0))[0] ?? null;
  }
  const matchCount = match ? setsIn(match).length : 0;
  return <div className="modal-backdrop" onClick={onClose}><div className="quiz-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={20} /></button>
    {!done ? <>
      <p className="eyebrow">Find your vibe · {step + 1} of {quizQuestions.length}</p>
      <div className="quiz-progress"><span style={{ width: `${(step / quizQuestions.length) * 100}%` }} /></div>
      <h2>{quizQuestions[step].q}</h2>
      <p>{step === 0 ? "Five quick questions and we’ll point you toward a very good decision." : "No wrong answers, only better nails."}</p>
      <div className="quiz-options">{quizQuestions[step].options.map((o) => <button key={o.label} onClick={() => setAnswers([...answers, o.picks])}>{o.label} <ArrowUpRight size={17} /></button>)}</div>
      {step > 0 && <button className="quiz-back" onClick={() => setAnswers(answers.slice(0, -1))}><ChevronLeft size={15} /> Back</button>}
    </> : match ? <>
      <p className="eyebrow">Your Nail’d It! match</p>
      <h2>You’re giving <em>{match.name}.</em></h2>
      <p>{match.text} {matchCount} {matchCount === 1 ? "set" : "sets"} in this collection.</p>
      <div className="hero-actions"><button className="primary-button" onClick={() => onShop(match!)}>Shop my collection <ArrowUpRight size={18} /></button><button className="secondary-button" onClick={() => setAnswers([])}>Retake</button></div>
    </> : <><h2>Every set is <em>you.</em></h2><button className="primary-button" onClick={onClose}>Browse all sets <ArrowUpRight size={18} /></button></>}
  </div></div>;
}

function CollectionView({ collection, sets, onClose, onAdd, onOpenSet }: { collection: Mood; sets: Product[]; onClose: () => void; onAdd: (name: string) => void; onOpenSet: (p: Product) => void }) {
  return <div className="modal-backdrop" onClick={onClose}>
    <div className="collection-modal" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><X size={20} /></button>
      <div className="collection-modal-head">
        <p className="eyebrow">{collection.kicker} · {sets.length} {sets.length === 1 ? "set" : "sets"}</p>
        <h2>The <em>{collection.name}</em> collection</h2>
        <p>{collection.text}</p>
      </div>
      <div className="collection-sets">{sets.map((p) => <article key={p.name} className="collection-set">
        <button className="collection-set-image" style={{ background: `radial-gradient(circle at 30% 20%, ${p.accent}99, transparent 45%), #18151b` }} onClick={() => onOpenSet(p)} aria-label={`View ${p.name} photos`}>
          <img src={p.image} alt={`${p.name} press-on nails`} />
          <span className="product-badge">{p.badge}</span>
          <span className="view-more-hint">{Array.from(new Set([p.image, ...p.gallery])).length} photos <ArrowUpRight size={14} /></span>
        </button>
        <div className="product-title-row"><h3 style={{ color: readableAccent(p.accent), textShadow: `0 0 8px ${readableAccent(p.accent)}cc, 0 0 18px ${readableAccent(p.accent)}80` }}>{p.name}</h3><span>{p.price}</span></div>
        <p className="product-detail">{p.detail}</p>
        <button className="add-button" onClick={() => onAdd(p.name)}>Add to bag <ArrowUpRight size={16} /></button>
      </article>)}</div>
      {sets.length === 0 && <div className="empty-state">New sets for this collection are on the way.</div>}
    </div>
  </div>;
}

// Products/moods published by the Operations app (public/data/ops-products.json) are merged over the built-in ones by name.
const baseProductCount = products.length;
const baseMoodCount = moods.length;
function mergeOpsCatalog(catalog: { products?: typeof products; moods?: typeof moods }) {
  products.length = baseProductCount;
  moods.length = baseMoodCount;
  for (const p of catalog.products ?? []) {
    const i = products.findIndex((x) => x.name === p.name);
    if (i >= 0) products[i] = p; else products.push(p);
  }
  for (const m of catalog.moods ?? []) {
    const i = moods.findIndex((x) => x.name === m.name);
    if (i >= 0) moods[i] = { ...moods[i], ...m }; else moods.push(m);
  }
}

export default function Home() {
  const [catalogVersion, setCatalogVersion] = useState(0);
  useEffect(() => {
    fetch("/data/ops-products.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => { if (c) { mergeOpsCatalog(c); setCatalogVersion((v) => v + 1); } })
      .catch(() => {});
  }, []);
  const [activeMood, setActiveMood] = useState("All sets");
  const [quizOpen, setQuizOpen] = useState(false);
  const [openCollection, setOpenCollection] = useState<Mood | null>(null);
  const [toast, setToast] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState<typeof products[number] | null>(null);
  const [flippedMoods, setFlippedMoods] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [customShape, setCustomShape] = useState("Almond");
  const [customFinish, setCustomFinish] = useState("Glossy");
  const [customColor, setCustomColor] = useState("Hot Pink");
  const [customNote, setCustomNote] = useState("");
  const bag = useBag();
  const [bagOpen, setBagOpen] = useState(false);
  const [order, setOrder] = useState<OrderSummary | "loading" | null>(null);

  // Arriving from another page via a "/#section" link: the section didn't exist
  // yet when the browser tried to jump to it, so scroll once it has rendered.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
  }, []);

  // Coming back from Stripe Checkout: ?checkout=success&session_id=… or ?checkout=cancelled
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("checkout");
    if (!status) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    if (status === "cancelled") {
      setToast("Checkout cancelled — your bag is right where you left it.");
      setBagOpen(true);
      return;
    }
    const sessionId = params.get("session_id");
    if (status !== "success" || !sessionId) return;
    bag.clear();
    setOrder("loading");
    fetch(`/api/checkout/session?id=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((summary: OrderSummary) => setOrder(summary))
      .catch(() => setOrder({ paid: false, email: null, total: null, items: [] }));
  }, []);

  const visibleProducts = useMemo(() => activeMood === "All sets" ? products : products.filter((p) => p.mood.toLowerCase() === activeMood.toLowerCase()), [activeMood, catalogVersion]);
  const publishedPhotos = useMemo(() => {
    const photos = new Map(galleryPhotos.map((photo) => [photo.src, photo]));
    for (const product of products) {
      for (const src of product.gallery ?? []) {
        if (!photos.has(src)) photos.set(src, { src, alt: `${product.name} press-on nails` });
      }
    }
    return Array.from(photos.values());
  }, [catalogVersion]);
  const addToBag = (name: string) => {
    const product = products.find((p) => p.name === name);
    if (!product) return;
    bag.add({ id: product.name, name: product.name, price: Number(product.price.replace(/[^0-9.]/g, "")), image: product.image });
    setToast(`${name} is in your bag. Your vibe is officially in motion.`);
    window.setTimeout(() => setToast(""), 3200);
  };
  const toggleFlip = (name: string) => setFlippedMoods((prev) => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
  const setsIn = (m: Mood) => products.filter((p) => p.mood.toLowerCase() === m.name.toLowerCase());
  const submitCustom = (e: FormEvent) => {
    e.preventDefault();
    bag.add({ id: `custom-${Date.now()}`, name: "Custom Set", price: 22, custom: { shape: customShape, finish: customFinish, color: customColor, note: customNote } });
    setToast(`Custom ${customShape} · ${customFinish} · ${customColor} set added to your bag — $22.00. We'll follow up to confirm the details.`);
    window.setTimeout(() => setToast(""), 3800);
    setCustomNote("");
  };

  return <div className="site-shell">
    {toast && <div className="toast"><Sparkles size={16} /> {toast}</div>}
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="Nail'd It home"><img src="/logo-wordmark.png" alt="Nail'd It!" /></a>
      <nav className="main-nav">
        <a href="#shop">Shop by vibe</a><a href="#collection">All sets</a><a href="#custom">Custom order</a><a href="#ritual">The ritual</a><a href="#gallery">Gallery</a><a href="#story">Our story</a>
      </nav>
      <div className="header-actions"><button className="bag-button" onClick={() => setBagOpen(true)} aria-label={`Open bag, ${bag.count} ${bag.count === 1 ? "item" : "items"}`}>Bag <span>{bag.count}</span></button></div>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Press on. Stand out.</p>
          <h1>Your next<br /><em>Favorite Detail</em><br />starts here.</h1>
          <p className="hero-description">Hand-painted press-ons for every version of you — from soft and understated to impossible to ignore.</p>
          <div className="hero-actions"><a className="primary-button" href="#shop">Shop by vibe <ArrowDownRight size={18} /></a><button className="secondary-button" onClick={() => setQuizOpen(true)}>Find my set <Sparkles size={17} /></button></div>
          <div className="hero-proof"><span>30 nails</span><span>12 sizes</span><span>0 boring details</span></div>
        </div>
        <div className="hero-art"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-image"><img src="/wildflower-hero.png" alt="Pink glitter press-on nails with hand-painted floral accents" /></div><div className="hero-note"><strong>Current vibe</strong><b>Impossible<br />to ignore.</b></div><div className="hero-sticker"><img src="/logo-polish-duo.webp" alt="" /></div></div>
      </section>

      <section className="ticker" aria-label="Brand benefits"><div className="ticker-track"><div>Hand-Painted Details</div><div>12-Size Fit</div><div>Vibes Welcome</div><div>No Boring Nails</div><div>Hand-Painted Details</div><div>12-Size Fit</div><div>Vibes Welcome</div><div>No Boring Nails</div></div></section>

      <section className="mood-section" id="shop"><div className="mood-intro-row"><div className="section-intro"><p className="eyebrow">Find your feeling</p><h2>Shop the vibe,<br /><em>Not the Rulebook.</em></h2><p>Each collection holds a handful of sets that share one theme. Click a card to flip it, then open the collection to shop its sets.</p></div><img className="mood-logo" src="/logo-disco-nails.webp" alt="Neon hand with long pink nails holding a disco ball" /></div><div className="mood-grid">{moods.map((m) => {
        const flipped = flippedMoods.has(m.name);
        const sets = setsIn(m);
        const cover = collectionCovers[m.name.toLowerCase()];
        const accent = sets[0] ? readableAccent(sets[0].accent) : undefined;
        const titleStyle = accent ? { color: accent, animation: "none", textShadow: `0 0 3px ${accent}, 0 0 10px ${accent}cc, 0 0 22px ${accent}80` } : undefined;
        return <div key={m.name} className={`mood-card-flip${flipped ? " is-flipped" : ""}`}>
          <div className="mood-card-inner">
            <button type="button" className={`mood-card mood-card-face mood-${m.tone}${cover ? " has-cover" : ""}`} onClick={() => toggleFlip(m.name)} aria-label={`Flip ${m.name} card`}>
              {cover && <img className="mood-cover" src={cover} alt="" />}
              <span className="mood-set-count">{sets.length} {sets.length === 1 ? "set" : "sets"}</span>
              <span className="mood-kicker">{m.kicker}</span><strong style={titleStyle}>{m.name}</strong><span className="mood-copy">{m.text}</span><span className="mood-arrow"><ArrowUpRight size={20} /></span>
            </button>
            <button type="button" className={`mood-card mood-card-face mood-card-back mood-${m.tone}`} onClick={() => setOpenCollection(m)} aria-label={`Shop the ${m.name} collection`}>
              <span className="mood-back-count">{sets.length} {sets.length === 1 ? "set" : "sets"} in this collection</span>
              <span className="mood-back-grid">{sets.slice(0, 5).map((p) => <img key={p.name} src={p.image} alt="" />)}</span>
              <strong style={titleStyle}>Shop the collection</strong>
              <span className="mood-copy">{sets.map((p) => p.name).join(" · ")}</span>
              <span className="mood-arrow"><Sparkles size={20} /></span>
            </button>
          </div>
        </div>;
      })}</div></section>

      <section className="collection-section" id="collection"><div className="collection-header"><img className="collection-logo" src="/logo-heart-nails.webp" alt="Neon heart with a hand painting its long pink nails" /><div><p className="eyebrow">The launch drop</p><h2>Meet your <em>New Vibe.</em></h2><p className="collection-description">Hand-painted florals, glossy stamped detail, and warm chrome gold — three sets to start the drop.</p></div></div><div className="filter-row">{["All sets", ...Array.from(new Set(products.map((p) => p.mood)))].map((m) => <button key={m} className={activeMood === m ? "filter active" : "filter"} onClick={() => setActiveMood(m)}>{m}</button>)}</div><div className="product-grid">{visibleProducts.map((p) => <ProductCard key={p.name} product={p} onAdd={addToBag} onOpen={setQuickViewProduct} />)}</div>{visibleProducts.length === 0 && <div className="empty-state">That vibe is taking a tiny break. Try another feeling.</div>}</section>

      <section className="custom-section" id="custom"><div className="custom-intro-row"><div className="section-intro"><p className="eyebrow">One of a kind</p><h2>Design your <em>Own Set.</em></h2><p>Pick your shape, finish, and base color, then tell us your vision. Every custom set is made to order at an upgraded price.</p></div><img className="custom-logo" src="/logo-moon-nails.webp" alt="Neon hand with long pink nails under a crescent moon and sparkles" /></div>
        <div className="custom-panel">
          <div className="custom-info">
            <span className="product-badge">Made to order</span>
            <h3>Custom Set</h3>
            <span className="custom-price">$22.00</span>
            <p>Custom sets take a little longer since they're hand-painted just for you — expect a follow-up email to confirm details before we start.</p>
          </div>
          <form className="custom-form" onSubmit={submitCustom}>
            <div className="custom-row">
              <div className="custom-field"><label htmlFor="customShape">Shape</label><select id="customShape" value={customShape} onChange={(e) => setCustomShape(e.target.value)}><option>Almond</option><option>Coffin</option><option>Square</option><option>Stiletto</option><option>Oval</option><option>Round</option><option>Squoval</option><option>Ballerina</option><option>Lipstick</option><option>Duck / Flare</option></select></div>
              <div className="custom-field"><label htmlFor="customFinish">Finish</label><select id="customFinish" value={customFinish} onChange={(e) => setCustomFinish(e.target.value)}><option>Glossy</option><option>Matte</option><option>Chrome</option><option>Glitter</option><option>Holographic</option><option>Cat Eye</option><option>Velvet</option><option>Jelly</option><option>Pearl Shimmer</option><option>Satin</option></select></div>
              <div className="custom-field"><label htmlFor="customColor">Base color</label><select id="customColor" value={customColor} onChange={(e) => setCustomColor(e.target.value)}><option>Hot Pink</option><option>Ruby Red</option><option>Golden Chrome</option><option>Milk White</option><option>Jet Black</option><option>Nude Blush</option><option>Lavender</option><option>Baby Blue</option><option>Neon Green</option><option>Sunset Orange</option><option>Electric Purple</option><option>Cherry Wine</option><option>Silver Chrome</option><option>Sheer Clear</option></select></div>
            </div>
            <div className="custom-field"><label htmlFor="customNote">Describe your vision</label><textarea id="customNote" value={customNote} onChange={(e) => setCustomNote(e.target.value)} placeholder="Colors, art, occasion, inspiration photos you can email over..." required /></div>
            <button className="primary-button" type="submit">Add custom set — $22.00 <ArrowUpRight size={18} /></button>
          </form>
        </div>
      </section>

      <section className="ritual-section" id="ritual"><div className="ritual-image"><img src="/products/spider-ritual.png" alt="Hand wearing the Spidergirl Lives! Halloween press-on nails" /><span className="vertical-label">THE NAIL’D IT! RITUAL</span></div><div className="ritual-copy"><img className="ritual-logo" src="/logo-skeleton-hand.png" alt="Neon skeleton hand holding a nail polish bottle" /><p className="eyebrow">Your manicure, simplified</p><h2>Prep.<br /><em>Press.</em><br />Impress.</h2><p>Salon appointments mean chemical fumes, sticky discomfort, and an hour-plus in the chair — just to chip a week later. An instant mani gets you the same fresh-set look in minutes, with way less commitment. Choose the best fit, follow the adhesive instructions, and let the set do the rest.</p><div className="ritual-steps"><div><b>01</b><span>Find your fit</span></div><div><b>02</b><span>Prep & press</span></div><div><b>03</b><span>Show them off</span></div></div><a className="arrow-link" href="#story">Read the full ritual <ChevronRight size={18} /></a></div></section>

      <section className="gallery-section" id="gallery"><div className="section-intro"><p className="eyebrow">Real sets, real hands</p><h2>The <em>gallery.</em></h2><p>A closer look at the collection. Swipe or use the arrows to explore, and select a photo to see every detail.</p></div><GalleryCarousel photos={publishedPhotos} onOpen={setLightboxIndex} /></section>

      <section className="story-section" id="story"><div className="story-quote"><p className="eyebrow">The Nail’d It! vibe</p><blockquote>“Life’s too short for nails that don’t feel like you.”</blockquote><p>Quiet neutrals one day. Hot-pink florals the next. Your style doesn’t have to stay in one lane — and neither should your manicure.</p><a className="arrow-link" href="#collection">Meet your next set <ChevronRight size={18} /></a></div><div className="story-collage"><div className="collage-small"><img src="/products/golden-afternoon-3.jpg" alt="Hand wearing the Golden Afternoon press-on set" /><img src="/products/golden-afternoon-framed-box.png" alt="Framed Nail'd It! Golden Afternoon fall collection box" /></div><div className="collage-tall"><img src="/wildflowers-hands.png" alt="Hands wearing the Wild for Wildflowers press-on set" /><img src="/products/wildflowers-framed-box.png" alt="Framed Nail'd It! Wild for Wildflowers collection box" /></div><span className="collage-word">Extra</span></div></section>

      <section className="newsletter"><div><p className="eyebrow">Get the next vibe first</p><h2>New drops, limited sets,<br /><em>Good Excuses.</em></h2></div><form onSubmit={(e) => { e.preventDefault(); setToast("You’re on the list. The next vibe is coming your way."); }}><input type="email" required placeholder="Your email address" aria-label="Your email address" /><button className="primary-button" type="submit">Join the list <ArrowUpRight size={18} /></button></form></section>
    </main>

    <SiteFooter />

    {quizOpen && <Quiz collections={moods} setsIn={setsIn} onClose={() => setQuizOpen(false)} onShop={(m) => { setQuizOpen(false); setOpenCollection(m); }} />}

    {openCollection && <CollectionView collection={openCollection} sets={setsIn(openCollection)} onClose={() => setOpenCollection(null)} onAdd={addToBag} onOpenSet={setQuickViewProduct} />}

    {quickViewProduct && <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onAdd={(name) => { addToBag(name); setQuickViewProduct(null); }} onSwitch={setQuickViewProduct} onCollection={() => { const m = moods.find((x) => x.name.toLowerCase() === quickViewProduct.mood.toLowerCase()); setQuickViewProduct(null); if (m) setOpenCollection(m); }} />}

    {bagOpen && <BagDrawer bag={bag} onClose={() => setBagOpen(false)} />}

    {order && <OrderConfirmation order={order} onClose={() => setOrder(null)} />}

    {lightboxIndex !== null && <Lightbox photos={publishedPhotos} index={lightboxIndex} onIndex={setLightboxIndex} onClose={() => setLightboxIndex(null)} />}
  </div>;
}
