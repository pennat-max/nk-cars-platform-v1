import Link from "next/link";
import { ExternalLink, Globe2, Link2, Share2, ShieldCheck, TabletSmartphone } from "lucide-react";

export default function SourceLaunchScreen() {
  return (
    <>
      <section className="bb-page-heading">
        <div>
          <p className="bb-kicker">Real Marketplace buying flow</p>
          <h1>Browse Facebook. Save the vehicle to NK.</h1>
          <p>Use your own Facebook account and normal Marketplace search. NK receives only the vehicle you choose to share.</p>
        </div>
      </section>
      <section className="bb-facebook-handoff" data-real-source-launch>
        <div><span><Globe2 size={21} /></span><div><b>Your Facebook session stays with Facebook</b><p>NK does not collect your Facebook password, MFA response, CAPTCHA, or browser cookies.</p></div></div>
        <a className="bb-button primary" href="https://www.facebook.com/marketplace/" target="_blank" rel="noreferrer">Browse real Facebook Marketplace<ExternalLink size={16} /></a>
        <ol>
          <li>Search and filter normally in Facebook Marketplace</li>
          <li>Open a vehicle and tap Share</li>
          <li>Choose Save to NK Cars when available</li>
        </ol>
        <div className="bb-source-safety"><Share2 size={16} /><p>On supported installed NK apps, sharing opens NK and creates the Vehicle Case automatically. iPhone requires the NK iOS Share Extension; the web preview cannot install that extension.</p></div>
      </section>
      <section className="bb-paste-tool bb-browser-entry">
        <div className="bb-section-heading"><div><p className="bb-kicker">Web app experiment</p><h2>Try the NK Web Browser</h2></div><span><TabletSmartphone size={20} /></span></div>
        <p>Open the real Facebook Marketplace, then return with the selected vehicle link to use the NK action bar and create a Vehicle Case.</p>
        <Link className="bb-button primary" href="/buy/browser">Open NK Web Browser</Link>
      </section>
      <section className="bb-paste-tool">
        <div className="bb-section-heading"><div><p className="bb-kicker">Other NK paths</p><h2>Continue inside NK</h2></div><span><ShieldCheck size={20} /></span></div>
        <div className="bb-fallback-actions">
          <Link className="bb-button secondary" href="/buy/browse">Browse saved NK results</Link>
          <Link className="bb-button secondary" href="/buy/paste"><Link2 size={17} />Last resort: paste a link</Link>
        </div>
      </section>
    </>
  );
}
