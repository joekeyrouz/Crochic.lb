import { Link } from "react-router";
import { Instagram, MessageCircle } from "lucide-react";
import { useSettings, whatsappLink } from "@/lib/shop";

export function Footer() {
  const { get } = useSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-crochic-dark text-crochic-cream/90 mt-24">
      <div className="container-crochic py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-display text-3xl mb-4 text-crochic-cream">
            Cro<span className="italic text-crochic-blush">Chic</span>
          </div>
          <p className="text-sm leading-relaxed text-crochic-cream/70 max-w-xs">
            Handmade crochet pieces designed to make everyday moments a little
            more special. Made slowly, made by hand, made for you.
          </p>
          <div className="flex gap-4 mt-6">
            <a
              href={get("instagram_url", "https://www.instagram.com/c.cro.chic/")}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="hover:text-crochic-blush transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href={whatsappLink(get("whatsapp_number"))}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="hover:text-crochic-blush transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
        <div>
          <h3 className="eyebrow !text-crochic-blush mb-5">Shop</h3>
          <ul className="space-y-3 text-sm">
            <li><Link className="hover:text-crochic-blush transition-colors" to="/shop">All pieces</Link></li>
            <li><Link className="hover:text-crochic-blush transition-colors" to="/shop/lip-balm-charms">Lip Balm Charms</Link></li>
            <li><Link className="hover:text-crochic-blush transition-colors" to="/shop/little-bags">Little Bags</Link></li>
            <li><Link className="hover:text-crochic-blush transition-colors" to="/shop/keychains-charms">Keychains &amp; Charms</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow !text-crochic-blush mb-5">CroChic</h3>
          <ul className="space-y-3 text-sm">
            <li><Link className="hover:text-crochic-blush transition-colors" to="/about">About</Link></li>
            <li><Link className="hover:text-crochic-blush transition-colors" to="/faq">FAQ</Link></li>
            <li><Link className="hover:text-crochic-blush transition-colors" to="/contact">Contact</Link></li>
            <li><Link className="hover:text-crochic-blush transition-colors" to="/privacy">Privacy</Link></li>
            <li><Link className="hover:text-crochic-blush transition-colors" to="/terms">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow !text-crochic-blush mb-5">Visit us</h3>
          <ul className="space-y-3 text-sm text-crochic-cream/70">
            <li>{get("store_email", "hello@crochic.shop")}</li>
            <li>
              <a
                className="hover:text-crochic-blush transition-colors"
                href={get("instagram_url")}
                target="_blank"
                rel="noreferrer"
              >
                @c.cro.chic
              </a>
            </li>
            <li className="pt-3 text-crochic-blush italic font-display text-base">
              {get("delivery_message", "Delivery coming soon.")}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-crochic py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-crochic-cream/50">
          <span>© {year} CroChic. All pieces handmade with love.</span>
          <span className="tracking-[0.18em] uppercase">Small stitches, big personality</span>
        </div>
      </div>
    </footer>
  );
}
