import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ImagePlus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";

const LIBRARY = [
  "/images/products/lipbalm-rose.jpg",
  "/images/products/lipbalm-duo.jpg",
  "/images/products/lipbalm-bow.jpg",
  "/images/products/lipbalm-mocha.jpg",
  "/images/products/keychain-leaf.jpg",
  "/images/products/charm-set.jpg",
  "/images/products/collection-flat.jpg",
  "/images/products/sunflower-tote.jpg",
  "/images/lifestyle/keyrings-hand.jpg",
  "/images/lifestyle/court-bag.jpg",
  "/images/lifestyle/tennis-player.jpg",
  "/images/lifestyle/racket-charm.jpg",
];

interface FormState {
  name: string;
  sku: string;
  categoryId: number;
  description: string;
  shortDescription: string;
  price: string;
  salePrice: string;
  stock: string;
  materials: string;
  dimensions: string;
  careInstructions: string;
  featured: boolean;
  isNew: boolean;
  active: boolean;
  seoTitle: string;
  seoDescription: string;
}

const EMPTY: FormState = {
  name: "",
  sku: "",
  categoryId: 0,
  description: "",
  shortDescription: "",
  price: "",
  salePrice: "",
  stock: "0",
  materials: "",
  dimensions: "",
  careInstructions: "",
  featured: false,
  isNew: false,
  active: true,
  seoTitle: "",
  seoDescription: "",
};

const TABS = ["Basics", "Pricing & stock", "Images", "Details & SEO"] as const;

export default function AdminProductEdit() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data: categories } = trpc.admin.categories.useQuery();
  const { data: existing } = trpc.admin.product.useQuery(
    { id: Number(id) },
    { enabled: !isNew },
  );

  const [tab, setTab] = useState<(typeof TABS)[number]>("Basics");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [images, setImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState("");

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        sku: existing.sku,
        categoryId: existing.categoryId,
        description: existing.description ?? "",
        shortDescription: existing.shortDescription ?? "",
        price: existing.price,
        salePrice: existing.salePrice ?? "",
        stock: String(existing.stock),
        materials: existing.materials ?? "",
        dimensions: existing.dimensions ?? "",
        careInstructions: existing.careInstructions ?? "",
        featured: existing.featured,
        isNew: existing.isNew,
        active: existing.active,
        seoTitle: existing.seoTitle ?? "",
        seoDescription: existing.seoDescription ?? "",
      });
      setImages(existing.images.map((i) => i.url));
    }
  }, [existing]);

  const saveMutation = trpc.admin.saveProduct.useMutation();
  const updateMutation = trpc.admin.updateProduct.useMutation();

  const set = (k: keyof FormState, v: string | boolean | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.sku || !form.categoryId || !form.price) {
      toast.error("Name, SKU, collection and price are required.");
      return;
    }
    const payload = {
      ...form,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      stock: Number(form.stock) || 0,
      images,
    };
    try {
      const res = isNew
        ? await saveMutation.mutateAsync(payload)
        : await updateMutation.mutateAsync({ ...payload, id: Number(id) });
      utils.admin.products.invalidate();
      toast.success(isNew ? "Product created" : "Product saved");
      if (isNew) navigate(`/admin/products/${res.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const input = "w-full bg-crochic-cream border border-crochic-blush px-4 py-3 text-sm focus:outline-none focus:border-crochic-rose";
  const label = "block text-[11px] uppercase tracking-[0.16em] text-crochic-muted mb-2";

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-crochic-muted hover:text-crochic-rose mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl">{isNew ? "New product" : form.name || "Edit product"}</h1>
        <button
          onClick={submit}
          disabled={saveMutation.isPending || updateMutation.isPending}
          className="bg-crochic-dark text-crochic-cream px-6 py-3 text-xs uppercase tracking-[0.18em] hover:bg-crochic-rose transition-colors disabled:opacity-60"
        >
          {saveMutation.isPending || updateMutation.isPending ? "Saving…" : "Save product"}
        </button>
      </div>

      <div className="flex gap-2 mb-8 border-b border-crochic-blush">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-xs uppercase tracking-[0.14em] border-b-2 -mb-px transition-colors ${
              tab === t ? "border-crochic-rose text-crochic-dark" : "border-transparent text-crochic-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Basics" && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className={label} htmlFor="p-name">Name</label>
            <input id="p-name" className={input} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="p-sku">SKU</label>
            <input id="p-sku" className={input} value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="p-cat">Collection</label>
            <select id="p-cat" className={input} value={form.categoryId} onChange={(e) => set("categoryId", Number(e.target.value))}>
              <option value={0}>Choose…</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="p-short">Short description</label>
            <input id="p-short" className={input} value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="p-desc">Description</label>
            <textarea id="p-desc" rows={5} className={input} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
      )}

      {tab === "Pricing & stock" && (
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <label className={label}>Price</label>
            <input type="number" min="0" step="0.01" className={input} value={form.price} onChange={(e) => set("price", e.target.value)} />
          </div>
          <div>
            <label className={label}>Sale price</label>
            <input type="number" min="0" step="0.01" className={input} value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} />
          </div>
          <div>
            <label className={label}>Stock</label>
            <input type="number" min="0" className={input} value={form.stock} onChange={(e) => set("stock", e.target.value)} />
          </div>
          <div className="sm:col-span-3 flex gap-8 pt-2">
            {([
              ["featured", "Featured"],
              ["isNew", "New arrival"],
              ["active", "Active (visible in shop)"],
            ] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-3 text-sm cursor-pointer">
                <input type="checkbox" className="accent-crochic-rose w-4 h-4" checked={form[k]} onChange={(e) => set(k, e.target.checked)} />
                {l}
              </label>
            ))}
          </div>
        </div>
      )}

      {tab === "Images" && (
        <div>
          <div className="flex gap-3 mb-6">
            <input className={input} placeholder="Paste an image path or URL…" value={newImage} onChange={(e) => setNewImage(e.target.value)} />
            <button
              className="flex items-center gap-2 border border-crochic-blush px-5 text-xs uppercase tracking-[0.14em] hover:bg-crochic-blush/30"
              onClick={() => {
                if (newImage.trim()) {
                  setImages([...images, newImage.trim()]);
                  setNewImage("");
                }
              }}
            >
              <ImagePlus className="w-4 h-4" /> Add
            </button>
          </div>
          <p className={label}>Photo library — click to add</p>
          <div className="flex gap-2 flex-wrap mb-8">
            {LIBRARY.map((src) => (
              <button key={src} onClick={() => !images.includes(src) && setImages([...images, src])} className="w-16 h-20 overflow-hidden border border-crochic-blush hover:border-crochic-rose">
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <p className={label}>Current images (first = primary)</p>
          <div className="flex gap-3 flex-wrap">
            {images.map((src, i) => (
              <div key={src + i} className="relative w-24 h-32 group border border-crochic-blush">
                <img src={src} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-crochic-gold text-white p-1"><Star className="w-3 h-3" /></span>
                )}
                <button
                  className="absolute top-1 right-1 bg-crochic-dark/80 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                  aria-label="Remove image"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length === 0 && <p className="text-sm text-crochic-muted italic">No images yet.</p>}
          </div>
        </div>
      )}

      {tab === "Details & SEO" && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className={label}>Materials</label>
            <input className={input} value={form.materials} onChange={(e) => set("materials", e.target.value)} />
          </div>
          <div>
            <label className={label}>Dimensions</label>
            <input className={input} value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Care instructions</label>
            <textarea rows={3} className={input} value={form.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} />
          </div>
          <div>
            <label className={label}>SEO title</label>
            <input className={input} value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
          </div>
          <div>
            <label className={label}>SEO description</label>
            <input className={input} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}
