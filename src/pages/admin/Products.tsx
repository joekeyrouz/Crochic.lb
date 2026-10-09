import { useState } from "react";
import { Link } from "react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { formatPrice } from "@/lib/shop";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.admin.products.useQuery({ search: search || undefined });
  const del = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => {
      utils.admin.products.invalidate();
      toast.success("Product deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-4xl">Products</h1>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 bg-crochic-dark text-crochic-cream px-5 py-3 text-xs uppercase tracking-[0.18em] hover:bg-crochic-rose transition-colors"
        >
          <Plus className="w-4 h-4" /> New product
        </Link>
      </div>
      <input
        type="search"
        placeholder="Search by name or SKU…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm bg-crochic-ivory border border-crochic-blush px-4 py-3 text-sm mb-8 focus:outline-none focus:border-crochic-rose"
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 bg-crochic-blush/30" />
          ))}
        </div>
      ) : (
        <div className="bg-crochic-ivory border border-crochic-blush overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-crochic-muted border-b border-crochic-blush">
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Collection</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-crochic-blush">
              {products?.map((p) => (
                <tr key={p.id} className="hover:bg-crochic-blush/10">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-crochic-blush/30 overflow-hidden shrink-0">
                        {p.images[0] && (
                          <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-crochic-muted">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-crochic-muted">{p.category?.name}</td>
                  <td className="px-5 py-3">
                    {p.salePrice ? (
                      <>
                        <span className="text-crochic-rose">{formatPrice(p.salePrice)}</span>{" "}
                        <span className="line-through text-crochic-muted text-xs">{formatPrice(p.price)}</span>
                      </>
                    ) : (
                      formatPrice(p.price)
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={p.stock <= 5 ? "text-amber-600 font-medium" : ""}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] uppercase tracking-[0.14em] px-2 py-1 ${p.active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                      {p.active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 justify-end">
                      <Link to={`/admin/products/${p.id}`} className="p-2 hover:text-crochic-rose" aria-label={`Edit ${p.name}`}>
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-2 hover:text-red-600"
                        aria-label={`Delete ${p.name}`}
                        onClick={() => {
                          if (confirm(`Delete "${p.name}"?`)) del.mutate({ id: p.id });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products?.length === 0 && (
            <p className="p-8 text-center text-sm text-crochic-muted italic">No products found.</p>
          )}
        </div>
      )}
    </div>
  );
}
