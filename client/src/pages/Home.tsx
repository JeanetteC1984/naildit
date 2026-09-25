import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Heart, Sparkles, X } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

const moods = [
  { name: "Wild for Wildflowers", kicker: "Bloom loud", text: "Hand-painted florals over hot pink, glitter accents included.", tone: "hot", product: "Wild for Wildflowers" },
  { name: "Love Letters", kicker: "Write it in red", text: "Romantic red with hand-stamped linework and a glitter accent nail.", tone: "plum", product: "Love Letters" },
  { name: "Golden Afternoon", kicker: "Catch the light", text: "Warm foil, chrome gold, and reflective florals for golden hour.", tone: "gold", product: "Golden Afternoon" },
];

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
      <span className="view-more-hint">View gallery <ArrowUpRight size={14} /></span>
    </div>
    <div className="product-info">
      <div className="product-title-row"><h3>{product.name}</h3><span>{product.price}</span></div>
      <p className="product-mood">{product.mood}</p>
      <p className="product-detail">{product.detail}</p>
      <button className="add-button" onClick={(e) => { e.stopPropagation(); onAdd(product.name); }}>Add to bag <ArrowUpRight size={16} /></button>
    </div>
  </article>;
}

function QuickView({ product, onClose, onAdd }: { product: typeof products[number]; onClose: () => void; onAdd: (name: string) => void }) {
  const [index, setIndex] = useState(0);
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
          <h2 style={{ color: product.accent, textShadow: `0 0 10px ${product.accent}cc, 0 0 24px ${product.accent}80` }}>{product.name}</h2>
          <p className="product-mood">{product.mood}</p>
          <p className="quickview-description">{product.description}</p>
          <div className="hero-proof"><span>30 nails</span><span>12 sizes</span><span>0 boring details</span></div>
          <div className="quickview-bottom"><span className="quickview-price">{product.price}</span><button className="primary-button" onClick={() => onAdd(product.name)}>Add to bag <ArrowUpRight size={18} /></button></div>
        </div>
      </div>
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
    if (i >= 0) moods[i] = m; else moods.push(m);
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
  const [quizStep, setQuizStep] = useState(0);
  const [toast, setToast] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState<typeof products[number] | null>(null);
  const [flippedMoods, setFlippedMoods] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [customShape, setCustomShape] = useState("Almond");
  const [customFinish, setCustomFinish] = useState("Glossy");
  const [customColor, setCustomColor] = useState("Hot Pink");
  const [customNote, setCustomNote] = useState("");

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
  const findMoodProduct = (name: string) => products.find((product) => product.name.toLowerCase() === name.toLowerCase()) ?? products.find((product) => product.mood.toLowerCase() === name.toLowerCase());
  const addToBag = (name: string) => { setToast(`${name} is in your bag. Your vibe is officially in motion.`); window.setTimeout(() => setToast(""), 3200); };
  const toggleFlip = (name: string) => setFlippedMoods((prev) => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
  const openGallery = (moodProduct: string) => { const p = findMoodProduct(moodProduct); if (p) setQuickViewProduct(p); };
  const submitCustom = (e: FormEvent) => {
    e.preventDefault();
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
      <div className="header-actions"><button className="bag-button" onClick={() => setToast("Your bag is looking a little quiet — start with a vibe.")}>Bag <span>0</span></button></div>
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
        <div className="hero-art"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-image"><img src="/wildflower-hero.png" alt="Pink glitter press-on nails with hand-painted floral accents" /></div><div className="hero-note"><strong>Current vibe</strong><b>Impossible<br />to ignore.</b></div><div className="hero-sticker"><img src="/hero-badge-new.png" alt="" /></div></div>
      </section>

      <section className="ticker" aria-label="Brand benefits"><div className="ticker-track"><div>Hand-Painted Details</div><div>12-Size Fit</div><div>Vibes Welcome</div><div>No Boring Nails</div><div>Hand-Painted Details</div><div>12-Size Fit</div><div>Vibes Welcome</div><div>No Boring Nails</div></div></section>

      <section className="mood-section" id="shop"><div className="section-intro"><p className="eyebrow">Find your feeling</p><h2>Shop the vibe,<br /><em>Not the Rulebook.</em></h2><p>Start with the feeling and find the set that takes it from there. Click a card to flip it and peek the gallery.</p></div><div className="mood-grid">{moods.map((m) => {
        const flipped = flippedMoods.has(m.name);
        const moodProduct = findMoodProduct(m.product) ?? findMoodProduct(m.name);
        const galleryPreview = moodProduct ? Array.from(new Set([moodProduct.image, ...moodProduct.gallery])) : [];
        return <div key={m.name} className={`mood-card-flip${flipped ? " is-flipped" : ""}`}>
          <div className="mood-card-inner">
            <button type="button" className={`mood-card mood-card-face mood-${m.tone}`} onClick={() => toggleFlip(m.name)} aria-label={`Flip ${m.name} card`}>
              <span className="mood-kicker">{m.kicker}</span><strong>{m.name}</strong><span className="mood-copy">{m.text}</span><span className="mood-arrow"><ArrowUpRight size={20} /></span>
            </button>
            <button type="button" className={`mood-card mood-card-face mood-card-back mood-${m.tone}`} onClick={() => openGallery(moodProduct?.name ?? m.product)} aria-label={`View ${m.name} gallery`}>
              <span className="mood-back-count">{galleryPreview.length} photos in this gallery</span>
              <span className="mood-back-grid">{galleryPreview.slice(0, 5).map((src) => <img key={src} src={src} alt="" />)}</span>
              <strong>View the gallery</strong>
              <span className="mood-copy">See every angle of {m.name}.</span>
              <span className="mood-arrow"><Sparkles size={20} /></span>
            </button>
          </div>
        </div>;
      })}</div></section>

      <section className="collection-section" id="collection"><div className="collection-header"><div><p className="eyebrow">The launch drop</p><h2>Meet your <em>New Vibe.</em></h2></div><p className="collection-description">Hand-painted florals, glossy stamped detail, and warm chrome gold — three sets to start the drop.</p></div><div className="filter-row">{["All sets", ...Array.from(new Set(products.map((p) => p.mood)))].map((m) => <button key={m} className={activeMood === m ? "filter active" : "filter"} onClick={() => setActiveMood(m)}>{m}</button>)}</div><div className="product-grid">{visibleProducts.map((p) => <ProductCard key={p.name} product={p} onAdd={addToBag} onOpen={setQuickViewProduct} />)}</div>{visibleProducts.length === 0 && <div className="empty-state">That vibe is taking a tiny break. Try another feeling.</div>}</section>

      <section className="custom-section" id="custom"><div className="section-intro"><p className="eyebrow">One of a kind</p><h2>Design your <em>Own Set.</em></h2><p>Pick your shape, finish, and base color, then tell us your vision. Every custom set is made to order at an upgraded price.</p></div>
        <div className="custom-panel">
          <div className="custom-info">
            <span className="product-badge">Made to order</span>
            <h3>Custom Set</h3>
            <span className="custom-price">$22.00</span>
            <p>Custom sets take a little longer since they're hand-painted just for you — expect a follow-up email to confirm details before we start.</p>
          </div>
          <form className="custom-form" onSubmit={submitCustom}>
            <div className="custom-row">
              <div className="custom-field"><label htmlFor="customShape">Shape</label><select id="customShape" value={customShape} onChange={(e) => setCustomShape(e.target.value)}><option>Almond</option><option>Coffin</option><option>Square</option><option>Stiletto</option></select></div>
              <div className="custom-field"><label htmlFor="customFinish">Finish</label><select id="customFinish" value={customFinish} onChange={(e) => setCustomFinish(e.target.value)}><option>Glossy</option><option>Matte</option><option>Chrome</option></select></div>
              <div className="custom-field"><label htmlFor="customColor">Base color</label><select id="customColor" value={customColor} onChange={(e) => setCustomColor(e.target.value)}><option>Hot Pink</option><option>Ruby Red</option><option>Golden Chrome</option><option>Milk White</option></select></div>
            </div>
            <div className="custom-field"><label htmlFor="customNote">Describe your vision</label><textarea id="customNote" value={customNote} onChange={(e) => setCustomNote(e.target.value)} placeholder="Colors, art, occasion, inspiration photos you can email over..." required /></div>
            <button className="primary-button" type="submit">Add custom set — $22.00 <ArrowUpRight size={18} /></button>
          </form>
        </div>
      </section>

      <section className="ritual-section" id="ritual"><div className="ritual-image"><img src="/products/love-letters-2.jpg" alt="Hand wearing the Love Letters press-on set" /><span className="vertical-label">THE NAIL’D IT! RITUAL</span></div><div className="ritual-copy"><p className="eyebrow">Your manicure, simplified</p><h2>Prep.<br /><em>Press.</em><br />Impress.</h2><p>Salon appointments mean chemical fumes, sticky discomfort, and an hour-plus in the chair — just to chip a week later. An instant mani gets you the same fresh-set look in minutes, with way less commitment. Choose the best fit, follow the adhesive instructions, and let the set do the rest.</p><div className="ritual-steps"><div><b>01</b><span>Find your fit</span></div><div><b>02</b><span>Prep & press</span></div><div><b>03</b><span>Show them off</span></div></div><a className="arrow-link" href="#story">Read the full ritual <ChevronRight size={18} /></a></div></section>

      <section className="gallery-section" id="gallery"><div className="section-intro"><p className="eyebrow">Real sets, real hands</p><h2>The <em>gallery.</em></h2><p>A closer look at the collection. Swipe or use the arrows to explore, and select a photo to see every detail.</p></div><GalleryCarousel photos={publishedPhotos} onOpen={setLightboxIndex} /></section>

      <section className="story-section" id="story"><div className="story-quote"><p className="eyebrow">The Nail’d It! vibe</p><blockquote>“Life’s too short for nails that don’t feel like you.”</blockquote><p>Quiet neutrals one day. Hot-pink florals the next. Your style doesn’t have to stay in one lane — and neither should your manicure.</p><a className="arrow-link" href="#collection">Meet your next set <ChevronRight size={18} /></a></div><div className="story-collage"><div className="collage-small"><img src="/products/golden-afternoon-3.jpg" alt="Hand wearing the Golden Afternoon press-on set" /><img src="/products/golden-afternoon-framed-box.png" alt="Framed Nail'd It! Golden Afternoon fall collection box" /></div><div className="collage-tall"><img src="/wildflowers-hands.png" alt="Hands wearing the Wild for Wildflowers press-on set" /><img src="/products/wildflowers-framed-box.png" alt="Framed Nail'd It! Wild for Wildflowers collection box" /></div><span className="collage-word">Extra</span></div></section>

      <section className="newsletter"><div><p className="eyebrow">Get the next vibe first</p><h2>New drops, limited sets,<br /><em>Good Excuses.</em></h2></div><form onSubmit={(e) => { e.preventDefault(); setToast("You’re on the list. The next vibe is coming your way."); }}><input type="email" required placeholder="Your email address" aria-label="Your email address" /><button className="primary-button" type="submit">Join the list <ArrowUpRight size={18} /></button></form></section>
    </main>

    <footer className="site-footer"><div className="footer-top"><a className="wordmark" href="#top"><img src="/logo-wordmark.png" alt="Nail'd It!" /></a><p>Your next favorite detail<br />starts here.</p><div className="footer-links"><a href="#shop">Shop by vibe</a><a href="#ritual">Application guide</a><a href="#story">About Nail’d It!</a><a href="#top">Contact</a></div></div><div className="footer-bottom"><span>© 2026 Nail’d It! All rights reserved.</span><span>Press on. Stand out.</span><span>Instagram ↗ &nbsp; TikTok ↗</span></div></footer>

    {quizOpen && <div className="modal-backdrop" onClick={() => setQuizOpen(false)}><div className="quiz-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setQuizOpen(false)}><X size={20} /></button>{quizStep === 0 ? <><p className="eyebrow">Find your vibe</p><h2>Which set feels like <em>you</em> today?</h2><p>Answer one quick question and we’ll point you toward a very good decision.</p><div className="quiz-options"><button onClick={() => setQuizStep(1)}>I’m blooming loud <ArrowUpRight size={17} /></button><button onClick={() => setQuizStep(2)}>I’m feeling romantic <ArrowUpRight size={17} /></button><button onClick={() => setQuizStep(3)}>I want warm and golden <ArrowUpRight size={17} /></button></div></> : <><p className="eyebrow">Your Nail’d It! match</p><h2>{quizStep === 2 ? "You’re giving Love Letters." : quizStep === 3 ? "You’re giving Golden Afternoon." : "You’re giving Wild for Wildflowers."}</h2><p>{quizStep === 2 ? "Meet Love Letters: romantic red with hand-stamped detail and a glitter accent nail." : quizStep === 3 ? "Meet Golden Afternoon: warm foil and chrome gold for golden hour." : "Meet Wild for Wildflowers: hand-painted florals over hot pink, glitter included."}</p><button className="primary-button" onClick={() => { setQuizOpen(false); setActiveMood(quizStep === 2 ? "Love Letters" : quizStep === 3 ? "Golden Afternoon" : "Wild for Wildflowers"); document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" }); }}>Shop my match <ArrowUpRight size={18} /></button></>}</div></div>}

    {quickViewProduct && <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onAdd={(name) => { addToBag(name); setQuickViewProduct(null); }} />}

    {lightboxIndex !== null && <Lightbox photos={publishedPhotos} index={lightboxIndex} onIndex={setLightboxIndex} onClose={() => setLightboxIndex(null)} />}
  </div>;
}
