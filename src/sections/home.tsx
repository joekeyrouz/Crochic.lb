import { Link } from "react-router";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Reveal } from "@/components/animations/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { useSettings } from "@/lib/shop";

/* --------------------------------- Hero --------------------------------- */
function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yImage = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section ref={ref} className="relative overflow-hidden texture-paper">
      <div className="container-crochic grid lg:grid-cols-2 gap-10 lg:gap-6 items-center py-14 lg:py-24">
        <div className="relative z-10 order-2 lg:order-1">
          <motion.p
            className="eyebrow mb-6"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Handmade crochet boutique
          </motion.p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] text-crochic-dark">
            {["Small stitches.", "Big personality."].map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                >
                  {i === 1 ? <em className="text-crochic-rose">{line}</em> : line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="mt-6 text-crochic-muted max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Handmade crochet pieces designed to make everyday moments a little
            more special — lip balm charms, little bags, keychains and tiny
            treasures.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
          >
            <Link
              to="/shop"
              className="bg-crochic-dark text-crochic-cream px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-crochic-rose transition-colors"
            >
              Shop the collection
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 text-xs uppercase tracking-[0.2em] border border-crochic-brown/40 hover:border-crochic-brown hover:bg-crochic-blush/30 transition-all"
            >
              Discover CroChic
            </Link>
          </motion.div>
        </div>

        <div className="relative order-1 lg:order-2">
          <motion.div
            style={reduce ? undefined : { y: yImage }}
            className="relative"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative aspect-[4/5] max-w-md mx-auto lg:ml-auto overflow-hidden rounded-t-[10rem] border-[6px] border-crochic-ivory shadow-[0_24px_60px_rgba(51,38,33,0.14)]">
              <img
                src="/images/lifestyle/tennis-player.jpg"
                alt="CroChic crochet charms styled at golden hour"
                className="w-full h-full object-cover"
              />
            </div>
            <motion.div
              className="absolute -bottom-6 -left-2 sm:left-6 w-36 sm:w-44 aspect-square overflow-hidden rounded-full border-4 border-crochic-ivory shadow-lg"
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src="/images/products/lipbalm-bow.jpg" alt="Crochet lip balm holder with bow" className="w-full h-full object-cover" />
            </motion.div>
            <motion.div
              className="absolute -top-4 right-4 sm:right-10 bg-crochic-ivory px-5 py-3 shadow-md rotate-3"
              animate={reduce ? undefined : { rotate: [3, 5, 3] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="font-display italic text-lg text-crochic-brown">handmade with elegance</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Brand statement --------------------------- */
function BrandStatement() {
  return (
    <section className="py-24 lg:py-32 bg-crochic-ivory">
      <div className="container-crochic text-center">
        <Reveal>
          <p className="eyebrow mb-6">The CroChic way</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-tight max-w-3xl mx-auto">
            Made slowly. <em className="text-crochic-rose">Made by hand.</em>
            <br />
            Made for you.
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-xl mx-auto text-crochic-muted leading-relaxed">
            Every CroChic piece begins as a skein of cotton yarn and a single
            hook. No machines, no production line — just patient stitches,
            soft colours, and the quiet joy of making something real.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------- Collections ------------------------------- */
function Collections() {
  const { data: cats } = trpc.shop.categories.useQuery();
  if (!cats?.length) return null;
  return (
    <section className="py-24">
      <div className="container-crochic">
        <Reveal className="flex items-end justify-between mb-12">
          <div>
            <p className="eyebrow mb-3">Collections</p>
            <h2 className="font-display text-4xl sm:text-5xl">Find your little thing</h2>
          </div>
          <Link to="/shop" className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-[0.18em] link-underline">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {cats.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 0.12}>
              <Link
                to={`/shop/${cat.slug}`}
                className="group relative block overflow-hidden aspect-[4/5] bg-crochic-blush/30"
              >
                {cat.image && (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-crochic-dark/70 via-crochic-dark/10 to-transparent" />
                <div className="absolute bottom-0 p-7 text-crochic-cream">
                  <h3 className="font-display text-3xl mb-2">{cat.name}</h3>
                  <p className="text-sm text-crochic-cream/80 line-clamp-2 max-w-[28ch]">{cat.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] border-b border-crochic-cream/50 pb-1 group-hover:gap-3 transition-all">
                    Explore <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Featured products -------------------------- */
function Featured() {
  const { data } = trpc.shop.products.useQuery({ featured: true });
  if (!data?.length) return null;
  return (
    <section className="py-24 bg-crochic-ivory">
      <div className="container-crochic">
        <Reveal className="text-center mb-14">
          <p className="eyebrow mb-3">Loved pieces</p>
          <h2 className="font-display text-4xl sm:text-5xl">Featured this season</h2>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
          {data.slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
        <Reveal className="text-center mt-14">
          <Link
            to="/shop"
            className="inline-block border border-crochic-brown/40 px-10 py-4 text-xs uppercase tracking-[0.2em] hover:bg-crochic-dark hover:text-crochic-cream hover:border-crochic-dark transition-all"
          >
            Shop all pieces
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------- Story ----------------------------------- */
function Story() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const reduce = useReducedMotion();

  return (
    <section ref={ref} className="py-24 lg:py-32 overflow-hidden">
      <div className="container-crochic grid lg:grid-cols-2 gap-14 items-center">
        <div className="relative">
          <motion.div style={reduce ? undefined : { y }} className="grid grid-cols-2 gap-4">
            <img src="/images/lifestyle/keyrings-hand.jpg" alt="Hands holding crochet keyrings" className="w-full aspect-[3/4] object-cover rounded-t-[6rem]" loading="lazy" />
            <img src="/images/products/collection-flat.jpg" alt="Flat lay of CroChic crochet pieces" className="w-full aspect-[3/4] object-cover mt-12 rounded-b-[6rem]" loading="lazy" />
          </motion.div>
          <div className="absolute -z-10 top-1/3 -left-8 w-48 h-48 rounded-full bg-crochic-blush/50 blur-2xl" />
        </div>
        <div>
          <Reveal>
            <p className="eyebrow mb-4">Our story</p>
            <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-6">
              Every stitch <em className="text-crochic-rose">has a story.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-crochic-muted leading-relaxed mb-5">
              CroChic began with a single crochet hook and a love for small,
              beautiful things. What started as gifts for friends became a
              boutique of tiny treasures — each one stitched by hand, in soft
              rose and warm cocoa tones.
            </p>
            <p className="text-crochic-muted leading-relaxed mb-8">
              From the first loop of yarn to the final ribbon on your package,
              every step is done by hand and with intention.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <Link to="/about" className="text-xs uppercase tracking-[0.2em] border-b border-crochic-brown pb-1 hover:text-crochic-rose transition-colors">
              Read our story
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Why CroChic ------------------------------ */
const WHY = [
  { title: "Handmade", text: "Every piece is made by hand — one hook, one stitch at a time.", icon: "✿" },
  { title: "Thoughtful", text: "Designed for the small everyday moments that deserve beauty.", icon: "❀" },
  { title: "Unique", text: "No two handmade pieces feel exactly the same. Yours is yours.", icon: "✽" },
  { title: "Made with love", text: "Every stitch carries the character of the maker.", icon: "❁" },
];

function WhyCroChic() {
  return (
    <section className="py-24 bg-crochic-blush/25">
      <div className="container-crochic">
        <Reveal className="text-center mb-14">
          <p className="eyebrow mb-3">Why CroChic</p>
          <h2 className="font-display text-4xl sm:text-5xl">Little reasons to love us</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {WHY.map((w, i) => (
            <Reveal key={w.title} delay={i * 0.1} className="text-center">
              <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-crochic-ivory border border-crochic-rose/30 flex items-center justify-center text-2xl text-crochic-rose">
                {w.icon}
              </div>
              <h3 className="font-display text-2xl mb-2">{w.title}</h3>
              <p className="text-sm text-crochic-muted leading-relaxed">{w.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Testimonials ------------------------------ */
function Testimonials() {
  const { data: reviews } = trpc.shop.reviews.useQuery();
  if (!reviews?.length) return null;
  return (
    <section className="py-24">
      <div className="container-crochic">
        <Reveal className="text-center mb-12">
          <p className="eyebrow mb-3">Kind words</p>
          <h2 className="font-display text-4xl sm:text-5xl">From our little community</h2>
        </Reveal>
        <div className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible">
          {reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.1} className="snap-center shrink-0 w-[85vw] sm:w-[60vw] lg:w-auto">
              <figure className="h-full bg-crochic-ivory border border-crochic-blush p-8 flex flex-col">
                <div className="text-crochic-gold tracking-widest mb-4" aria-label={`${r.rating} stars`}>
                  {"★".repeat(r.rating)}
                </div>
                <blockquote className="font-display text-xl italic leading-relaxed flex-1">
                  “{r.review}”
                </blockquote>
                <figcaption className="mt-6 text-xs uppercase tracking-[0.18em] text-crochic-muted">
                  {r.customerName}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Instagram ------------------------------- */
const IG_IMAGES = [
  "/images/lifestyle/girl-sunset.jpg",
  "/images/lifestyle/court-close.jpg",
  "/images/lifestyle/duo-court.jpg",
  "/images/lifestyle/blue-top.jpg",
  "/images/lifestyle/dress-detail.jpg",
  "/images/lifestyle/racket-charm.jpg",
];

function InstagramSection() {
  const { get } = useSettings();
  const url = get("instagram_url", "https://www.instagram.com/c.cro.chic/");
  return (
    <section className="py-24 bg-crochic-ivory">
      <div className="container-crochic">
        <Reveal className="text-center mb-12">
          <p className="eyebrow mb-3">Instagram</p>
          <h2 className="font-display text-4xl sm:text-5xl">Follow the little things</h2>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-4 text-xs uppercase tracking-[0.2em] link-underline text-crochic-rose-deep"
          >
            Follow @c.cro.chic
          </a>
        </Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {IG_IMAGES.map((src, i) => (
            <Reveal key={src} delay={i * 0.06}>
              <a href={url} target="_blank" rel="noreferrer" className="group block relative overflow-hidden aspect-square bg-crochic-blush/30">
                <img src={src} alt="CroChic on Instagram" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-crochic-rose/0 group-hover:bg-crochic-rose/30 transition-colors duration-300" />
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Newsletter ------------------------------ */
import { useState } from "react";
import { toast } from "sonner";

function Newsletter() {
  const [email, setEmail] = useState("");
  const subscribe = trpc.shop.subscribe.useMutation({
    onSuccess: () => {
      toast.success("Welcome to the CroChic circle 💌");
      setEmail("");
    },
    onError: () => toast.error("Please enter a valid email address."),
  });

  return (
    <section className="py-24 bg-crochic-dark text-crochic-cream">
      <div className="container-crochic text-center">
        <Reveal>
          <p className="eyebrow !text-crochic-blush mb-4">The CroChic circle</p>
          <h2 className="font-display text-4xl sm:text-5xl max-w-2xl mx-auto leading-tight">
            Be the first to discover the next little thing.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <form
            className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              subscribe.mutate({ email });
            }}
          >
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-transparent border border-crochic-cream/30 px-5 py-4 text-sm placeholder:text-crochic-cream/40 focus:outline-none focus:border-crochic-blush"
            />
            <button
              type="submit"
              disabled={subscribe.isPending}
              className="bg-crochic-blush text-crochic-dark px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-crochic-cream transition-colors disabled:opacity-60"
            >
              {subscribe.isPending ? "Joining…" : "Subscribe"}
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

export function HomeSections() {
  return (
    <>
      <Hero />
      <BrandStatement />
      <Collections />
      <Featured />
      <Story />
      <WhyCroChic />
      <Testimonials />
      <InstagramSection />
      <Newsletter />
    </>
  );
}
