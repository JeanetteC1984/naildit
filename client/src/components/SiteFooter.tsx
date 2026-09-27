// Shared by the home page and the policy pages. Links use "/#section" so they
// work from any route (same-page scroll on "/", full navigation elsewhere).
export function SiteFooter() {
  return <footer className="site-footer"><div className="footer-top"><a className="wordmark" href="/#top"><img src="/logo-wordmark.png" alt="Nail'd It!" /></a><p>Your next favorite detail<br />starts here.</p><div className="footer-links"><a href="/#shop">Shop by vibe</a><a href="/#ritual">Application guide</a><a href="/#story">About Nail’d It!</a><a href="/#top">Contact</a><a href="/shipping">Shipping policy</a><a href="/returns">Returns &amp; exchanges</a><a href="/privacy">Privacy policy</a></div></div><div className="footer-bottom"><span>© 2026 Nail’d It! All rights reserved.</span><span>Press on. Stand out.</span><span>Instagram ↗ &nbsp; TikTok ↗</span></div></footer>;
}
