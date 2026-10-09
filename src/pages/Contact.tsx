import { Instagram, Mail, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";
import { useSettings, whatsappLink } from "@/lib/shop";

export default function Contact() {
  const { get } = useSettings();
  return (
    <div className="container-crochic py-20 lg:py-28 max-w-3xl mx-auto text-center">
      <Reveal>
        <p className="eyebrow mb-4">Contact</p>
        <h1 className="font-display text-5xl sm:text-6xl leading-tight">
          Say hello — <em className="text-crochic-rose">we'd love that.</em>
        </h1>
        <p className="mt-6 text-crochic-muted leading-relaxed max-w-md mx-auto">
          Questions about a piece, a custom order, or a wholesale enquiry?
          Reach us wherever feels easiest.
        </p>
      </Reveal>
      <div className="mt-14 grid sm:grid-cols-3 gap-6">
        {[
          {
            icon: MessageCircle,
            label: "WhatsApp",
            value: "Chat with us",
            href: whatsappLink(get("whatsapp_number"), "Hi CroChic!"),
          },
          {
            icon: Instagram,
            label: "Instagram",
            value: "@c.cro.chic",
            href: get("instagram_url", "https://www.instagram.com/c.cro.chic/"),
          },
          {
            icon: Mail,
            label: "Email",
            value: get("store_email", "hello@crochic.shop"),
            href: `mailto:${get("store_email", "hello@crochic.shop")}`,
          },
        ].map((c, i) => (
          <Reveal key={c.label} delay={i * 0.1}>
            <a
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className="block bg-crochic-ivory border border-crochic-blush p-8 hover:border-crochic-rose transition-colors"
            >
              <c.icon className="w-6 h-6 mx-auto mb-4 text-crochic-rose" />
              <p className="text-[11px] uppercase tracking-[0.18em] text-crochic-muted mb-1">{c.label}</p>
              <p className="font-medium text-sm">{c.value}</p>
            </a>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
