import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";

export default function AdminCategories() {
  const utils = trpc.useUtils();
  const { data: categories } = trpc.admin.categories.useQuery();
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", image: "", sortOrder: 0, active: true });

  const save = trpc.admin.saveCategory.useMutation({
    onSuccess: () => {
      utils.admin.categories.invalidate();
      setEditing(null);
      setForm({ name: "", description: "", image: "", sortOrder: 0, active: true });
      toast.success("Collection saved");
    },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.admin.deleteCategory.useMutation({
    onSuccess: () => {
      utils.admin.categories.invalidate();
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
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <input className={input} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={input} placeholder="Image path (optional)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          <textarea className={`${input} sm:col-span-2`} placeholder="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button
          className="flex items-center gap-2 bg-crochic-dark text-crochic-cream px-5 py-3 text-xs uppercase tracking-[0.18em] hover:bg-crochic-rose transition-colors"
          onClick={() => save.mutate({ id: editing ?? undefined, ...form })}
        >
          <Plus className="w-4 h-4" /> {editing ? "Save changes" : "Add collection"}
        </button>
      </div>

      <ul className="divide-y divide-crochic-blush bg-crochic-ivory border border-crochic-blush">
        {categories?.map((c) => (
          <li key={c.id} className="flex items-center gap-4 px-5 py-4">
            <div className="w-12 h-14 bg-crochic-blush/30 overflow-hidden shrink-0">
              {c.image && <img src={c.image} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-crochic-muted">/shop/{c.slug}</p>
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
              className="p-2 hover:text-red-600"
              aria-label={`Delete ${c.name}`}
              onClick={() => confirm(`Delete "${c.name}"?`) && del.mutate({ id: c.id })}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
