import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { ProductCard } from "@/components/product/ProductCard";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results, isFetching } = trpc.shop.products.useQuery(
    { search: debounced || undefined },
    { enabled: debounced.length > 1 },
  );

  return (
    <div className="container-crochic py-12 lg:py-20 max-w-6xl">
      <h1 className="font-display text-4xl sm:text-5xl mb-8 text-center">Search</h1>
      <div className="relative max-w-xl mx-auto mb-12">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-crochic-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lip balm holders, bags, charms…"
          aria-label="Search products"
          autoFocus
          className="w-full bg-crochic-ivory border border-crochic-blush pl-11 pr-4 py-4 text-sm focus:outline-none focus:border-crochic-rose"
        />
      </div>

      {debounced.length > 1 && !isFetching && results && (
        results.length ? (
          <>
            <p className="text-xs uppercase tracking-[0.18em] text-crochic-muted mb-8 text-center">
              {results.length} result{results.length === 1 ? "" : "s"} for “{debounced}”
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-center font-display text-2xl italic text-crochic-muted py-16">
            We couldn't find that little treasure.
          </p>
        )
      )}
    </div>
  );
}
