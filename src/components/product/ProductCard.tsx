import { Link } from "react-router";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatPrice, useSettings } from "@/lib/shop";

export interface ProductCardProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  salePrice: string | null;
  stock: number;
  isNew: boolean;
  images?: { url: string; alt: string | null }[];
  category?: { name: string } | null;
}

export function ProductCard({ product, index = 0 }: { product: ProductCardProduct; index?: number }) {
  const { addItem } = useCart();
  const { get } = useSettings();
  const currency = get("currency", "USD");
  const primary = product.images?.[0]?.url ?? null;
  const secondary = product.images?.[1]?.url ?? null;
  const soldOut = product.stock <= 0;
  const effectivePrice = Number(product.salePrice ?? product.price);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className="relative overflow-hidden bg-crochic-blush/30 aspect-[3/4]">
        <Link to={`/product/${product.slug}`} aria-label={product.name}>
          {primary && (
            <img
              src={primary}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          )}
          {secondary && (
            <img
              src={secondary}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.salePrice && (
            <span className="bg-crochic-rose text-white text-[10px] uppercase tracking-[0.14em] px-2.5 py-1">
              Sale
            </span>
          )}
          {product.isNew && !product.salePrice && (
            <span className="bg-crochic-dark text-crochic-cream text-[10px] uppercase tracking-[0.14em] px-2.5 py-1">
              New
            </span>
          )}
          {soldOut && (
            <span className="bg-crochic-muted text-white text-[10px] uppercase tracking-[0.14em] px-2.5 py-1">
              Sold out
            </span>
          )}
        </div>
        {!soldOut && (
          <button
            onClick={() =>
              addItem({
                productId: product.id,
                name: product.name,
                slug: product.slug,
                price: effectivePrice,
                image: primary,
                stock: product.stock,
              })
            }
            className="absolute bottom-0 left-0 right-0 bg-crochic-dark/90 text-crochic-cream text-[11px] uppercase tracking-[0.2em] py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hover:bg-crochic-rose"
          >
            Quick add
          </button>
        )}
      </div>
      <div className="pt-4 text-center">
        {product.category && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-crochic-muted mb-1">
            {product.category.name}
          </p>
        )}
        <Link
          to={`/product/${product.slug}`}
          className="font-display text-lg leading-tight hover:text-crochic-rose transition-colors"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-sm">
          {product.salePrice ? (
            <>
              <span className="text-crochic-rose font-medium">
                {formatPrice(product.salePrice, currency)}
              </span>{" "}
              <span className="line-through text-crochic-muted text-xs ml-1">
                {formatPrice(product.price, currency)}
              </span>
            </>
          ) : (
            <span className="font-medium">{formatPrice(product.price, currency)}</span>
          )}
        </p>
      </div>
    </motion.article>
  );
}
