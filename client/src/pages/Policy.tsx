import { useEffect, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";
import { SiteFooter } from "@/components/SiteFooter";

// Details still to be confirmed by the owner are wrapped in <Todo> so they
// stand out on the page and are easy to find in code (search "<Todo>").
function Todo({ children }: { children: ReactNode }) {
  return <mark className="policy-placeholder" title="Placeholder: confirm before launch">{children}</mark>;
}

const CONTACT_EMAIL = "hello@[your-domain].com";
const UPDATED = "September 24, 2026";

const TABS = [["/shipping", "Shipping"], ["/returns", "Returns & exchanges"], ["/privacy", "Privacy"]];

function PolicyLayout({ eyebrow, title, accent, intro, children }: { eyebrow: string; title: string; accent: string; intro: ReactNode; children: ReactNode }) {
  const [location] = useLocation();
  useEffect(() => {
    document.title = `${title} ${accent.replace(/\.$/, "")} · Nail’d It!`;
    window.scrollTo(0, 0);
  }, [title, accent]);

  return <div className="site-shell">
    <header className="site-header">
      <a className="wordmark" href="/#top" aria-label="Nail'd It home"><img src="/logo-wordmark.png" alt="Nail'd It!" /></a>
      <nav className="main-nav">
        <a href="/#shop">Shop by vibe</a><a href="/#collection">All sets</a><a href="/#custom">Custom order</a><a href="/#ritual">The ritual</a><a href="/#gallery">Gallery</a><a href="/#story">Our story</a>
      </nav>
      <div className="header-actions"><a className="secondary-button" href="/#collection">Back to shop</a></div>
    </header>

    <main id="top" className="policy-page">
      <div className="policy-intro"><p className="eyebrow">{eyebrow}</p><h1>{title} <em>{accent}</em></h1><div className="policy-lede">{intro}</div><p className="policy-updated">Last updated {UPDATED}</p></div>
      <nav className="policy-tabs" aria-label="Store policies">{TABS.map(([href, label]) => <a key={href} href={href} aria-current={location === href ? "page" : undefined}>{label}</a>)}</nav>
      <article className="policy-body">{children}</article>
      <aside className="policy-contact"><div><p className="eyebrow">Still wondering?</p><h2>Just <em>Ask Us.</em></h2><p>We’re a small, home-based studio and a real person reads every message.</p></div><a className="primary-button" href={`mailto:${CONTACT_EMAIL}`}>Email <Todo>{CONTACT_EMAIL}</Todo> <ArrowUpRight size={18} /></a></aside>
    </main>

    <SiteFooter />
  </div>;
}

export function ShippingPolicy() {
  return <PolicyLayout eyebrow="Store policies" title="Shipping" accent="Policy." intro={<p>Every set is packed by hand in our home studio. Here’s how long that takes and how it gets to you.</p>}>
    <section><h2>Processing time</h2>
      <p>Ready-to-ship sets leave our studio within <Todo>3–5 business days</Todo> (Monday–Friday, excluding holidays) after your order is placed.</p>
      <p>Custom sets are hand-painted to order, so they take longer. We’ll email you to confirm your design and sizing before we start, and your processing time begins once your design is confirmed: usually <Todo>7–10 business days</Todo>.</p>
      <p>During new drops and holidays, processing can run a little longer. If there’s a delay, we’ll email you.</p>
    </section>
    <section><h2>Where we ship</h2>
      <p>For now we ship <Todo>within the United States only</Todo>, including APO/FPO addresses. We can’t ship outside the US yet, but we’d love to someday.</p>
    </section>
    <section><h2>Shipping rates &amp; delivery</h2>
      <ul>
        <li><strong>Standard shipping:</strong> <Todo>$4.00 flat rate</Todo> per order, via <Todo>USPS First-Class / Ground Advantage</Todo>.</li>
        <li><strong>Estimated delivery:</strong> <Todo>2–5 business days</Todo> after your order ships.</li>
      </ul>
      <p>Delivery estimates come from the carrier and aren’t guaranteed. Your shipping cost is shown in your bag and at checkout before you pay.</p>
    </section>
    <section><h2>Tracking</h2>
      <p>When your order ships, you’ll get an email with a tracking number. If you don’t see it, check your spam or promotions folder, or email us.</p>
    </section>
    <section><h2>Lost, late, or damaged packages</h2>
      <p>Once a package is handed to the carrier, it’s in their care, but we’ll still help. If tracking hasn’t updated in <Todo>7 days</Todo>, or it shows delivered and you can’t find it, email us and we’ll open a claim with the carrier.</p>
      <p>If your set arrives damaged, email us within <Todo>7 days</Todo> of delivery with a photo of the package and the nails, and we’ll make it right with a replacement or refund.</p>
    </section>
    <section><h2>Address changes</h2>
      <p>Please double-check your shipping address at checkout. If you need to change it, email us as soon as possible. We can update it any time before your order ships. Packages returned to us because of an incorrect address can be reshipped for the cost of postage.</p>
    </section>
  </PolicyLayout>;
}

export function ReturnsPolicy() {
  return <PolicyLayout eyebrow="Store policies" title="Returns &" accent="Exchanges." intro={<p>Nails are personal, so we keep this simple and fair for you and for us.</p>}>
    <section><h2>Ready-to-ship sets</h2>
      <p>You can return <strong>unworn, unopened</strong> ready-to-ship sets within <Todo>14 days</Todo> of delivery for a refund to your original payment method.</p>
      <p>For hygiene reasons, we can’t accept sets that have been opened, tried on, applied, or had their packaging seal broken.</p>
    </section>
    <section><h2>Custom &amp; custom-sized sets</h2>
      <p>Custom sets and sets made to your measurements are made just for you, so they are <Todo>final sale</Todo> and can’t be returned or exchanged.</p>
      <p>That’s why we confirm your design and sizing by email before we start painting. If something about your finished set doesn’t match what we agreed on, email us and we’ll work it out.</p>
    </section>
    <section><h2>Sizing</h2>
      <p>Not sure of your size? Email us before you order and we’ll help you measure. If a ready-to-ship set doesn’t fit and you haven’t opened it, you can return it within the return window.</p>
    </section>
    <section><h2>How to start a return</h2>
      <ol>
        <li>Email <Todo>{CONTACT_EMAIL}</Todo> within <Todo>14 days</Todo> of delivery with your order number and the set you’re returning.</li>
        <li>We’ll reply with our return address and instructions.</li>
        <li>Send the set back unopened in its original packaging. We recommend a trackable shipping method.</li>
      </ol>
      <p>Return shipping is <Todo>paid by the customer</Todo>, and the original shipping charge isn’t refundable, unless the return is because of our mistake.</p>
    </section>
    <section><h2>Refunds</h2>
      <p>Once your return arrives and we’ve checked it, we’ll email you and issue your refund within <Todo>3–5 business days</Todo>. Depending on your bank, it can take another 5–10 business days to show up.</p>
    </section>
    <section><h2>Damaged, defective, or wrong items</h2>
      <p>If your set arrives damaged, defective, or isn’t what you ordered, email us within <Todo>7 days</Todo> of delivery with a photo. We’ll send a replacement or a full refund, including shipping, at no cost to you. This applies to custom sets too.</p>
    </section>
    <section><h2>Cancellations</h2>
      <p>Need to cancel? Email us right away. Ready-to-ship orders can be cancelled for a full refund until they ship. Custom orders can be cancelled for a full refund until we’ve started painting.</p>
    </section>
  </PolicyLayout>;
}

export function PrivacyPolicy() {
  return <PolicyLayout eyebrow="Store policies" title="Privacy" accent="Policy." intro={<p>This policy explains what information <Todo>Nail’d It!</Todo> (“we,” “us”), a home-based business in <Todo>[City, State]</Todo>, collects when you visit or shop with us, and how we use it. We keep it to what we need to make and send your nails.</p>}>
    <section><h2>What we collect</h2>
      <ul>
        <li><strong>Order details:</strong> your name, email, shipping address, and what you ordered.</li>
        <li><strong>Custom order details:</strong> your chosen shape, finish, color, design notes, and any sizing information you share with us.</li>
        <li><strong>Email list:</strong> your email address, if you sign up for new-drop updates.</li>
        <li><strong>Messages:</strong> anything you send us by email or on social media.</li>
        <li><strong>Your bag:</strong> the items in your shopping bag are saved in your own browser’s local storage so they’re still there when you come back. This stays on your device and isn’t sent to us until you check out.</li>
      </ul>
    </section>
    <section><h2>Payments</h2>
      <p>Payments are processed securely by <strong>Stripe</strong>. Your card details go directly to Stripe and are never seen or stored by us. Stripe’s use of your information is covered by the <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer">Stripe Privacy Policy</a>.</p>
    </section>
    <section><h2>How we use your information</h2>
      <ul>
        <li>To make, pack, and ship your order, and send you order and shipping updates.</li>
        <li>To confirm custom designs and sizing with you.</li>
        <li>To answer your questions and handle returns.</li>
        <li>To send new-drop emails, only if you signed up. Every email has an unsubscribe link, or you can email us to be removed.</li>
        <li>To keep records we’re required to keep for taxes and accounting.</li>
      </ul>
    </section>
    <section><h2>Who we share it with</h2>
      <p>We <strong>never sell</strong> your personal information. We share only what’s needed with the services that help us run the shop:</p>
      <ul>
        <li>Stripe, to take payments.</li>
        <li>Shipping carriers such as <Todo>USPS</Todo>, to deliver your order.</li>
        <li><Todo>[Email newsletter provider, if any]</Todo>, to send new-drop emails.</li>
        <li><Todo>[Website host, e.g. Render]</Todo>, which hosts this site.</li>
      </ul>
      <p>We may also share information if the law requires it.</p>
    </section>
    <section><h2>Cookies &amp; analytics</h2>
      <p>We don’t use advertising cookies. The site stores your bag in your browser as described above. <Todo>We don’t currently use analytics tools.</Todo> If that changes, we’ll update this page.</p>
    </section>
    <section><h2>How long we keep it</h2>
      <p>We keep order records for as long as we need them for shipping, returns, and tax purposes (generally <Todo>up to 7 years</Todo>). You can unsubscribe from emails at any time.</p>
    </section>
    <section><h2>Your choices &amp; rights</h2>
      <p>You can ask us to see, correct, or delete the personal information we hold about you, or to stop sending you marketing emails. Just email <Todo>{CONTACT_EMAIL}</Todo> and we’ll respond within <Todo>30 days</Todo>. Depending on where you live, such as California, you may have additional rights under state privacy laws, and we’ll honor them.</p>
    </section>
    <section><h2>Children</h2>
      <p>Our shop isn’t directed to children under 13, and we don’t knowingly collect their information.</p>
    </section>
    <section><h2>Changes to this policy</h2>
      <p>If we change this policy, we’ll update it here and change the “last updated” date above.</p>
    </section>
    <section><h2>Contact</h2>
      <p><Todo>Nail’d It!</Todo> · <Todo>[City, State]</Todo> · <Todo>{CONTACT_EMAIL}</Todo></p>
    </section>
  </PolicyLayout>;
}
