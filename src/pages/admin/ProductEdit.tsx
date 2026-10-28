import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const {
    data: existing,
    isLoading: productLoading,
    error: productError,
  } = trpc.admin.product.useQuery({ id: Number(id) }, { enabled: !isNew });

  const {
    data: libraryPhotos = [],
    isLoading: libraryLoading,
    error: libraryError,
  } = trpc.admin.photoLibrary.useQuery();

  const [tab, setTab] = useState<(typeof TABS)[number]>("Basics");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [images, setImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [alert, setAlert] = useState<{
    variant: "success" | "destructive" | "warning";
    title: string;
    message: string;
  } | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);

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

      setImages(existing.images.map((image) => image.url));
    }
  }, [existing]);

  const saveMutation = trpc.admin.saveProduct.useMutation();
  const updateMutation = trpc.admin.updateProduct.useMutation();

  const isSaving = saveMutation.isPending || updateMutation.isPending;

  const set = (key: keyof FormState, value: string | boolean | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addImage = (source = newImage) => {
    const image = source.trim();

    if (!image) {
      setAlert({
        variant: "warning",
        title: "Missing Image",
        message:
          "Paste an image path or URL, or choose a photo from the library.",
      });
      return;
    }

    if (images.includes(image)) {
      setAlert({
        variant: "warning",
        title: "Duplicate Image",
        message: "This image is already included in the gallery.",
      });
      return;
    }

    setImages((current) => [...current, image]);
    setNewImage("");

    setAlert({
      variant: "success",
      title: "Image Added",
      message: "Image added to gallery. Click Save product to store changes.",
    });
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAlert({
        variant: "destructive",
        title: "File Too Large",
        message: "Uploaded image must be 5 MB or smaller.",
      });
      event.target.value = "";
      return;
    }

    const data = new FormData();
    data.append("image", file);

    setIsUploading(true);

    try {
      const response = await fetch("/api/admin/product-images", {
        method: "POST",
        credentials: "include",
        body: data,
      });

      const result: { url?: string; error?: string } = await response.json();

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Image upload failed.");
      }

      const uploadedUrl = result.url;

      setImages((current) =>
        current.includes(uploadedUrl) ? current : [...current, uploadedUrl],
      );

      // Refresh the library so the newly uploaded photo appears there.
      await utils.admin.photoLibrary.invalidate();

      setAlert({
        variant: "success",
        title: "Image Uploaded",
        message:
          "Image uploaded and added to the gallery. Save the product to persist product changes.",
      });
    } catch (error) {
      setAlert({
        variant: "destructive",
        title: "Upload Failed",
        message:
          error instanceof Error ? error.message : "Image upload failed.",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const submit = async () => {
    if (!form.name || !form.sku || !form.categoryId || !form.price) {
      setAlert({
        variant: "destructive",
        title: "Required Fields Missing",
        message:
          "Name, SKU, collection, and price are required to save this product.",
      });
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
      const result = isNew
        ? await saveMutation.mutateAsync(payload)
        : await updateMutation.mutateAsync({
            ...payload,
            id: Number(id),
          });

      await Promise.all([
        utils.admin.products.invalidate(),
        utils.admin.stats.invalidate(),
        utils.shop.products.invalidate(),
        utils.shop.productBySlug.invalidate(),
      ]);

      setAlert({
        variant: "success",
        title: isNew ? "Product Created" : "Product Saved",
        message: isNew
          ? `Product "${form.name}" has been created successfully.`
          : `All updates to "${form.name}" have been saved.`,
      });

      if (isNew) {
        navigate(`/admin/products/${result.id}`);
      }
    } catch (error) {
      setAlert({
        variant: "destructive",
        title: "Save Failed",
        message:
          error instanceof Error ? error.message : "Failed to save product.",
      });
    }
  };

  const input =
    "w-full bg-crochic-cream border border-crochic-blush px-4 py-3 text-sm focus:outline-none focus:border-crochic-rose";

  const label =
    "block text-[11px] uppercase tracking-[0.16em] text-crochic-muted mb-2";

  if (!isNew && productLoading) {
    return (
      <p role="status" className="text-sm text-crochic-muted">
        Loading product…
      </p>
    );
  }

  if (!isNew && (productError || !existing)) {
    return (
      <div className="space-y-4 max-w-lg">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Product Load Error</AlertTitle>
          <AlertDescription>
            Could not load this product
            {productError ? `: ${productError.message}` : "."}
          </AlertDescription>
        </Alert>

        <button
          type="button"
          onClick={() => navigate("/admin/products")}
          className="text-sm underline text-crochic-muted hover:text-crochic-dark"
        >
          Back to products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-crochic-muted hover:text-crochic-rose mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

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
              type="button"
              onClick={() => setAlert(null)}
              className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground rounded-sm"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </Alert>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl">
          {isNew ? "New product" : form.name || "Edit product"}
        </h1>

        <button
          type="button"
          onClick={submit}
          disabled={isSaving || isUploading}
          className="bg-crochic-dark text-crochic-cream px-6 py-3 text-xs uppercase tracking-[0.18em] hover:bg-crochic-rose transition-colors disabled:opacity-60"
        >
          {isUploading
            ? "Uploading image…"
            : isSaving
              ? "Saving…"
              : "Save product"}
        </button>
      </div>

      <div className="flex gap-2 mb-8 border-b border-crochic-blush">
        {TABS.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setTab(item)}
            className={`px-4 py-3 text-xs uppercase tracking-[0.14em] border-b-2 -mb-px transition-colors ${
              tab === item
                ? "border-crochic-rose text-crochic-dark"
                : "border-transparent text-crochic-muted"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Basics" && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className={label} htmlFor="p-name">
              Name
            </label>
            <input
              id="p-name"
              className={input}
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </div>

          <div>
            <label className={label} htmlFor="p-sku">
              SKU
            </label>
            <input
              id="p-sku"
              className={input}
              value={form.sku}
              onChange={(event) => set("sku", event.target.value)}
            />
          </div>

          <div>
            <label className={label} htmlFor="p-cat">
              Collection
            </label>
            <select
              id="p-cat"
              className={input}
              value={form.categoryId}
              onChange={(event) =>
                set("categoryId", Number(event.target.value))
              }
            >
              <option value={0}>Choose…</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label} htmlFor="p-short">
              Short description
            </label>
            <input
              id="p-short"
              className={input}
              value={form.shortDescription}
              onChange={(event) => set("shortDescription", event.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={label} htmlFor="p-desc">
              Description
            </label>
            <textarea
              id="p-desc"
              rows={5}
              className={input}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>
        </div>
      )}

      {tab === "Pricing & stock" && (
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <label className={label} htmlFor="p-price">
              Price
            </label>
            <input
              id="p-price"
              type="number"
              min="0"
              step="0.01"
              className={input}
              value={form.price}
              onChange={(event) => set("price", event.target.value)}
            />
          </div>

          <div>
            <label className={label} htmlFor="p-sale-price">
              Sale price
            </label>
            <input
              id="p-sale-price"
              type="number"
              min="0"
              step="0.01"
              className={input}
              value={form.salePrice}
              onChange={(event) => set("salePrice", event.target.value)}
            />
          </div>

          <div>
            <label className={label} htmlFor="p-stock">
              Stock
            </label>
            <input
              id="p-stock"
              type="number"
              min="0"
              className={input}
              value={form.stock}
              onChange={(event) => set("stock", event.target.value)}
            />
          </div>

          <div className="sm:col-span-3 flex gap-8 pt-2">
            {(
              [
                ["featured", "Featured"],
                ["isNew", "New arrival"],
                ["active", "Active (visible in shop)"],
              ] as const
            ).map(([key, text]) => (
              <label
                key={key}
                className="flex items-center gap-3 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="accent-crochic-rose w-4 h-4"
                  checked={form[key]}
                  onChange={(event) => set(key, event.target.checked)}
                />
                {text}
              </label>
            ))}
          </div>
        </div>
      )}

      {tab === "Images" && (
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            aria-label="Choose product image from device"
            onChange={uploadImage}
          />

          <div className="mb-6">
            <button
              type="button"
              className="flex items-center gap-2 bg-crochic-dark text-crochic-cream px-5 py-3 text-xs uppercase tracking-[0.14em] hover:bg-crochic-rose transition-colors disabled:opacity-60"
              onClick={() => fileInput.current?.click()}
              disabled={isUploading || isSaving}
            >
              <ImagePlus className="w-4 h-4" />
              {isUploading ? "Uploading…" : "Add image from device"}
            </button>

            <p className="mt-2 text-xs text-crochic-muted">
              JPEG, PNG, WebP, or GIF; maximum 5 MB.
            </p>
          </div>

          <p className={label}>
            Photo library — click to add. Changes are saved with Save product.
          </p>

          {libraryLoading ? (
            <p role="status" className="text-sm text-crochic-muted mb-8">
              Loading photo library…
            </p>
          ) : libraryError ? (
            <div className="mb-8">
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Photo Library Error</AlertTitle>
                <AlertDescription>
                  Could not load photos: {libraryError.message}
                </AlertDescription>
              </Alert>
              <button
                type="button"
                onClick={() => utils.admin.photoLibrary.invalidate()}
                className="mt-2 text-sm underline text-crochic-muted"
              >
                Try again
              </button>
            </div>
          ) : libraryPhotos.length === 0 ? (
            <p className="text-sm text-crochic-muted italic mb-8">
              Your photo library is empty. Upload an image from your device to
              add the first photo.
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap mb-8">
              {libraryPhotos.map((photo) => (
                <button
                  type="button"
                  key={photo.id}
                  aria-label={`Add ${photo.fileName} from photo library`}
                  title={photo.fileName}
                  onClick={() => addImage(photo.url)}
                  disabled={isUploading || isSaving}
                  className="w-16 h-20 overflow-hidden border border-crochic-blush hover:border-crochic-rose disabled:opacity-60"
                >
                  <img
                    src={photo.url}
                    alt={photo.alt ?? photo.fileName}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <p className={label}>Current images (first = primary)</p>

          <div className="flex gap-3 flex-wrap">
            {images.map((src, index) => (
              <div
                key={src + index}
                className="relative w-24 h-32 group border border-crochic-blush"
              >
                <img src={src} alt="" className="w-full h-full object-cover" />

                {index === 0 && (
                  <span className="absolute top-1 left-1 bg-crochic-gold text-white p-1">
                    <Star className="w-3 h-3" />
                  </span>
                )}

                <button
                  type="button"
                  className="absolute top-1 right-1 bg-crochic-dark/80 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    setImages((current) =>
                      current.filter((_, imageIndex) => imageIndex !== index),
                    )
                  }
                  disabled={isUploading || isSaving}
                  aria-label="Remove image"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {images.length === 0 && (
              <p className="text-sm text-crochic-muted italic">
                No images yet.
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "Details & SEO" && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className={label} htmlFor="p-materials">
              Materials
            </label>
            <input
              id="p-materials"
              className={input}
              value={form.materials}
              onChange={(event) => set("materials", event.target.value)}
            />
          </div>

          <div>
            <label className={label} htmlFor="p-dimensions">
              Dimensions
            </label>
            <input
              id="p-dimensions"
              className={input}
              value={form.dimensions}
              onChange={(event) => set("dimensions", event.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={label} htmlFor="p-care">
              Care instructions
            </label>
            <textarea
              id="p-care"
              rows={3}
              className={input}
              value={form.careInstructions}
              onChange={(event) => set("careInstructions", event.target.value)}
            />
          </div>

          <div>
            <label className={label} htmlFor="p-seo-title">
              SEO title
            </label>
            <input
              id="p-seo-title"
              className={input}
              value={form.seoTitle}
              onChange={(event) => set("seoTitle", event.target.value)}
            />
          </div>

          <div>
            <label className={label} htmlFor="p-seo-description">
              SEO description
            </label>
            <input
              id="p-seo-description"
              className={input}
              value={form.seoDescription}
              onChange={(event) => set("seoDescription", event.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
