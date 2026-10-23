import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";

export default function AdminCategories() {
  const utils = trpc.useUtils();
  const {
    data: categories,
    isLoading,
    error,
  } = trpc.admin.categories.useQuery();
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", image: "", sortOrder: 0, active: true });
  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", description: "", image: "", sortOrder: 0, active: true });
  };

  const save = trpc.admin.saveCategory.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.categories.invalidate(),
        utils.shop.categories.invalidate(),
        utils.shop.products.invalidate(),
        utils.shop.productBySlug.invalidate(),
      ]);
      resetForm();
      toast.success("Collection saved");
    },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.admin.deleteCategory.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.categories.invalidate(),
        utils.shop.categories.invalidate(),
        utils.shop.products.invalidate(),
      ]);
      toast.success("Collection deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const input = "w-full bg-crochic-cream border border-crochic-blush px-4 py-3 text-sm focus:outline-none focus:border-crochic-rose";

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl mb-8">Collections</h1>

      <div className="bg-crochic-ivory border border-crochic-blush p-6 mb-10">
        <h2 className="font-display text-2xl mb-5">{editing ? "Edit collection" : "New collection"}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const name = form.name.trim();
            if (name.length < 2) {
              toast.error("Collection name must be at least 2 characters.");
              return;
            }
            save.mutate({
              id: editing ?? undefined,
              ...form,
              name,
              image: form.image.trim(),
            });
          }}
        >
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <input
              className={input}
              placeholder="Name"
              aria-label="Collection name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={2}
              maxLength={120}
            />
            <input
              className={input}
              placeholder="Image path (optional)"
              aria-label="Collection image path"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              maxLength={500}
            />
            <textarea
              className={`${input} sm:col-span-2`}
              placeholder="Description"
              aria-label="Collection description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          {editing !== null && (
            <label className="mb-4 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Visible in shop
            </label>
          )}
          <button
            type="submit"
            disabled={save.isPending}
            className="flex items-center gap-2 bg-crochic-dark text-crochic-cream px-5 py-3 text-xs uppercase tracking-[0.18em] hover:bg-crochic-rose transition-colors disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> {save.isPending ? "Saving…" : editing ? "Save changes" : "Add collection"}
          </button>
          {editing !== null && (
            <button
              type="button"
              className="ml-3 px-4 py-3 text-xs uppercase tracking-[0.18em] text-crochic-muted hover:text-crochic-rose"
              onClick={resetForm}
              disabled={save.isPending}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-destructive">Could not load collections: {error.message}</p>}
      {isLoading ? (
        <p role="status" className="p-6 text-sm text-crochic-muted">Loading collections…</p>
      ) : (
      <ul className="divide-y divide-crochic-blush bg-crochic-ivory border border-crochic-blush">
        {categories?.map((c) => (
          <li key={c.id} className="flex items-center gap-4 px-5 py-4">
            <div className="w-12 h-14 bg-crochic-blush/30 overflow-hidden shrink-0">
              {c.image && <img src={c.image} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-crochic-muted">/shop/{c.slug}</p>
              {!c.active && <p className="text-xs text-amber-700">Hidden from shop</p>}
            </div>
            <button
              className="p-2 hover:text-crochic-rose"
              aria-label={`Edit ${c.name}`}
              onClick={() => {
                setEditing(c.id);
                setForm({ name: c.name, description: c.description ?? "", image: c.image ?? "", sortOrder: c.sortOrder, active: c.active });
              }}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 hover:text-red-600"
              aria-label={`Delete ${c.name}`}
              disabled={del.isPending}
              onClick={() => confirm(`Delete "${c.name}"?`) && del.mutate({ id: c.id })}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
