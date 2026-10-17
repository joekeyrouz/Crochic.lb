import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, MessageCircle, Minus, Plus } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useCart } from "@/context/CartContext";
import { formatPrice, useSettings, whatsappLink } from "@/lib/shop";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = trpc.shop.productBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug },
  );
  const { addItem } = useCart();
  const { get } = useSettings();
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const currency = get("currency", "USD");

  const product = data?.product;

  useEffect(() => {
    if (product) {
      document.title = product.seoTitle ?? `${product.name} — CroChic`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta && product.seoDescription)
        meta.setAttribute("content", product.seoDescription);
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="container-crochic py-12 grid lg:grid-cols-2 gap-12">
        <Skeleton className="aspect-[3/4] w-full rounded-none bg-crochic-blush/30" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3 bg-crochic-blush/30" />
          <Skeleton className="h-5 w-1/4 bg-crochic-blush/30" />
          <Skeleton className="h-24 w-full bg-crochic-blush/30" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-crochic py-32 text-center">
        <h1 className="font-display text-4xl italic text-crochic-muted">
          We couldn't find that little treasure.
        </h1>
        <Link
          to="/shop"
          className="inline-block mt-6 text-xs uppercase tracking-[0.18em] border-b border-crochic-brown pb-0.5"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  const images = product.images.length
    ? product.images
    : [{ url: "/images/logo.jpg", alt: product.name }];
  const soldOut = product.stock <= 0;
  const effectivePrice = Number(product.salePrice ?? product.price);

  return (
    <div className="container-crochic py-10 lg:py-16">
      <nav
        className="flex items-center gap-1.5 text-xs text-crochic-muted mb-8"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="hover:text-crochic-rose">
          Home
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/shop" className="hover:text-crochic-rose">
          Shop
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-crochic-dark">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* gallery */}
        <div>
          <div className="relative overflow-hidden bg-crochic-blush/30 aspect-[3/4]">
            <AnimatePresence mode="wait">
              <motion.img
                key={images[imageIndex]?.url}
                src={images[imageIndex]?.url}
                alt={images[imageIndex]?.alt ?? product.name}
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              />
            </AnimatePresence>
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button
                  key={img.url + i}
                  onClick={() => setImageIndex(i)}
                  className={`w-20 aspect-[3/4] overflow-hidden shrink-0 border-2 transition-colors ${
                    i === imageIndex
                      ? "border-crochic-rose"
                      : "border-transparent"
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div className="lg:sticky lg:top-28 self-start">
          <p className="eyebrow mb-3">{product.category.name}</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-tight">
            {product.name}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            {product.salePrice ? (
              <>
                <span className="text-2xl text-crochic-rose font-medium">
                  {formatPrice(product.salePrice, currency)}
                </span>
                <span className="line-through text-crochic-muted">
                  {formatPrice(product.price, currency)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-medium">
                {formatPrice(product.price, currency)}
              </span>
            )}
            {product.isNew && (
              <span className="bg-crochic-dark text-crochic-cream text-[10px] uppercase tracking-[0.14em] px-2.5 py-1">
                New
              </span>
            )}
          </div>

          <p className="mt-6 text-crochic-muted leading-relaxed">
            {product.description}
          </p>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-crochic-blush">
              <button
                className="p-3"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center">{quantity}</span>
              <button
                className="p-3"
                onClick={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              disabled={soldOut}
              onClick={() =>
                addItem(
                  {
                    productId: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: effectivePrice,
                    image: images[0]?.url ?? null,
                    stock: product.stock,
                  },
                  quantity,
                )
              }
              className="flex-1 bg-crochic-dark text-crochic-cream py-3.5 text-xs uppercase tracking-[0.2em] hover:bg-crochic-rose transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {soldOut ? "Sold out" : "Add to basket"}
            </button>
          </div>

          <a
            href={whatsappLink(
              get("whatsapp_number"),
              `Hi CroChic! I'd love to ask about the ${product.name}.`,
            )}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-center gap-2 border border-crochic-blush py-3.5 text-xs uppercase tracking-[0.2em] hover:bg-crochic-blush/30 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Ask on WhatsApp
          </a>
          <p className="mt-4 text-xs italic text-crochic-muted text-center">
            {soldOut
              ? "This piece found its home — message us for a custom one."
              : product.stock <= 5
                ? `Only ${product.stock} left — each one is handmade.`
                : get(
                    "delivery_message",
                    "Delivery is available! Contact us to confirm delivery options and fees for your location.",
                  )}
          </p>
          <dl className="mt-10 border-t border-crochic-blush divide-y divide-crochic-blush text-sm">
            {[
              ["Materials", product.materials],
              ["Dimensions", product.dimensions],
              ["Care", product.careInstructions],
              ["SKU", product.sku],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div
                  key={k}
                  className="py-3.5 grid grid-cols-[120px_1fr] gap-4"
                >
                  <dt className="text-crochic-muted uppercase text-[11px] tracking-[0.14em] pt-0.5">
                    {k}
                  </dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      {data.related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-3xl sm:text-4xl mb-10 text-center">
            You may also love
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
            {data.related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
