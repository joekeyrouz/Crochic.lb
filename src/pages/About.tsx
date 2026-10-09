import { Link } from "react-router";
import { Instagram } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";
import { useSettings } from "@/lib/shop";

export default function About() {
  const { get } = useSettings();
  return (
    <div>
      <section className="container-crochic py-20 lg:py-28 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <Reveal>
            <p className="eyebrow mb-4">About CroChic</p>
            <h1 className="font-display text-5xl sm:text-6xl leading-tight mb-8">
              A love letter to <em className="text-crochic-rose">handmade things.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-5 text-crochic-muted leading-relaxed">
              <p>
                CroChic is a small handmade crochet boutique. Every lip balm
                holder, every little bag, every charm begins the same way: a
                skein of cotton yarn, a single hook, and time.
              </p>
              <p>
                We believe the small things you carry every day should be
                beautiful — and that handmade pieces carry a warmth no machine
                can stitch. That's why no two CroChic pieces are ever exactly
                alike.
              </p>
              <p>
                Thank you for being here, and for loving the little things
                with us.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex gap-4">
              <a
                href={get("instagram_url", "https://www.instagram.com/c.cro.chic/")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-crochic-blush px-6 py-3.5 text-xs uppercase tracking-[0.18em] hover:bg-crochic-blush/30 transition-colors"
              >
                <Instagram className="w-4 h-4" /> @c.cro.chic
              </a>
              <Link
                to="/shop"
                className="bg-crochic-dark text-crochic-cream px-6 py-3.5 text-xs uppercase tracking-[0.18em] hover:bg-crochic-rose transition-colors"
              >
                Shop the pieces
              </Link>
            </div>
          </Reveal>
        </div>
        <Reveal className="relative">
          <div className="aspect-[4/5] overflow-hidden rounded-t-[8rem]">
            <img
              src="/images/lifestyle/keyrings-hand.jpg"
              alt="Hands holding handmade CroChic crochet keyrings"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-8 -left-6 w-40 aspect-square overflow-hidden rounded-full border-4 border-crochic-ivory shadow-lg">
            <img src="/images/products/charm-set.jpg" alt="CroChic charm set" className="w-full h-full object-cover" />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
