import { useState } from "react";
import { Link } from "react-router";
import { AlertCircle, CheckCircle2, Pencil, Plus, Trash2, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { formatPrice } from "@/lib/shop";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null);
  const [alert, setAlert] = useState<{
    variant: "success" | "destructive";
    title: string;
    message: string;
  } | null>(null);

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.admin.products.useQuery({ search: search || undefined });
  const del = trpc.admin.deleteProduct.useMutation({
    onSuccess: async (result) => {
      await Promise.all([
        utils.admin.products.invalidate(),
        utils.admin.stats.invalidate(),
        utils.shop.products.invalidate(),
        utils.shop.productBySlug.invalidate(),
      ]);
      setProductToDelete(null);
      setAlert({
        variant: "success",
        title: "Product Deleted",
        message: result.archived
          ? "Product hidden from boutique; order history was preserved."
          : "Product has been permanently deleted.",
      });
    },
    onError: (e) => {
      setProductToDelete(null);
      setAlert({
        variant: "destructive",
        title: "Deletion Failed",
        message: e.message,
      });
    },
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

      {alert && (
        <div className="mb-6">
          <Alert variant={alert.variant} className="relative pr-10">
            {alert.variant === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
            <button
              onClick={() => setAlert(null)}
              className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground rounded-sm"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </Alert>
        </div>
      )}
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
                        disabled={del.isPending}
                        onClick={() => setProductToDelete({ id: p.id, name: p.name })}
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

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(productToDelete)}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent className="bg-white border-crochic-blush">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl text-crochic-dark">
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-crochic-muted">
              Are you sure you want to delete{" "}
              <strong className="text-crochic-dark">{productToDelete?.name}</strong>?
              If this product has existing customer orders, it will be hidden instead of permanently removed to preserve order history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-crochic-blush text-crochic-dark">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (productToDelete) {
                  del.mutate({ id: productToDelete.id });
                }
              }}
              disabled={del.isPending}
            >
              {del.isPending ? "Deleting…" : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
