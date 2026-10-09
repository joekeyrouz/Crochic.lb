import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name" },
] as const;

export default function Shop() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sort = (searchParams.get("sort") ?? "newest") as
    | "newest"
    | "price-asc"
    | "price-desc"
    | "name";
  const onSale = searchParams.get("sale") === "1";
  const isNew = searchParams.get("new") === "1";
  const inStock = searchParams.get("stock") === "1";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value == null) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const { data: categories } = trpc.shop.categories.useQuery();
  const activeCategory = categories?.find((c) => c.slug === category);

  const { data: products, isLoading } = trpc.shop.products.useQuery({
    category,
    sort,
    onSale: onSale || undefined,
    isNew: isNew || undefined,
    inStock: inStock || undefined,
  });

  useEffect(() => {
    document.title = activeCategory
      ? `${activeCategory.name} — CroChic`
      : "Shop — CroChic";
  }, [activeCategory]);

  const filters = (
    <div className="space-y-8">
      <div>
        <h3 className="eyebrow mb-4">Collections</h3>
        <ul className="space-y-2.5 text-sm">
          <li>
            <Link to="/shop" className={!category ? "text-crochic-rose font-medium" : "hover:text-crochic-rose transition-colors"}>
              All pieces
            </Link>
          </li>
          {categories?.map((c) => (
            <li key={c.id}>
              <Link
                to={`/shop/${c.slug}`}
                className={category === c.slug ? "text-crochic-rose font-medium" : "hover:text-crochic-rose transition-colors"}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="eyebrow mb-4">Refine</h3>
        <div className="space-y-3 text-sm">
          {[
            { key: "sale", label: "On sale", active: onSale },
            { key: "new", label: "New arrivals", active: isNew },
            { key: "stock", label: "In stock", active: inStock },
          ].map((f) => (
            <label key={f.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={f.active}
                onChange={(e) => setParam(f.key, e.target.checked ? "1" : null)}
                className="accent-crochic-rose w-4 h-4"
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-crochic py-10 lg:py-16">
      {/* breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-crochic-muted mb-6" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-crochic-rose">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/shop" className="hover:text-crochic-rose">Shop</Link>
        {activeCategory && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-crochic-dark">{activeCategory.name}</span>
          </>
        )}
      </nav>

      <header className="mb-10">
        <h1 className="font-display text-4xl sm:text-5xl">
          {activeCategory ? activeCategory.name : "All pieces"}
        </h1>
        {activeCategory?.description && (
          <p className="mt-3 text-crochic-muted max-w-xl">{activeCategory.description}</p>
        )}
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-crochic-muted">
          {products ? `${products.length} piece${products.length === 1 ? "" : "s"}` : "…"}
        </p>
      </header>

      <div className="grid lg:grid-cols-[220px_1fr] gap-12">
        <aside className="hidden lg:block">{filters}</aside>

        <div>
          <div className="flex items-center justify-between mb-8">
            <button
              className="lg:hidden flex items-center gap-2 text-xs uppercase tracking-[0.18em] border border-crochic-blush px-4 py-2.5"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            <label className="flex items-center gap-3 text-xs uppercase tracking-[0.14em]">
              <span className="text-crochic-muted hidden sm:inline">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setParam("sort", e.target.value === "newest" ? null : e.target.value)}
                className="bg-transparent border border-crochic-blush px-3 py-2.5 text-xs focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[3/4] w-full rounded-none bg-crochic-blush/30" />
                  <Skeleton className="h-4 w-2/3 mx-auto mt-4 bg-crochic-blush/30" />
                  <Skeleton className="h-3 w-1/3 mx-auto mt-2 bg-crochic-blush/30" />
                </div>
              ))}
            </div>
          ) : products?.length ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-12">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="font-display text-2xl italic text-crochic-muted">
                No pieces match those filters — yet.
              </p>
              <Link to="/shop" onClick={() => setSearchParams({})} className="inline-block mt-4 text-xs uppercase tracking-[0.18em] border-b border-crochic-brown pb-0.5">
                Clear filters
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* mobile filter drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-crochic-dark/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-crochic-ivory z-50 p-6 overflow-y-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-2xl">Filters</h2>
                <button onClick={() => setDrawerOpen(false)} aria-label="Close filters">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div onClick={() => setDrawerOpen(false)}>{filters}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
