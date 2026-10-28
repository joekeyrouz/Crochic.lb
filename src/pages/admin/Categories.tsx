import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Pencil,
  Upload,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
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

export default function AdminCategories() {
  const utils = trpc.useUtils();
  const {
    data: categories,
    isLoading,
    error,
  } = trpc.admin.categories.useQuery();
  const {
    data: libraryPhotos,
    isLoading: libraryLoading,
    error: libraryError,
  } = trpc.admin.photoLibrary.useQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [alert, setAlert] = useState<{
    variant: "success" | "destructive";
    title: string;
    message: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    sortOrder: 0,
    active: true,
  });

  const resetForm = () => {
    setEditing(null);
    setShowPhotoLibrary(false);
    setForm({
      name: "",
      description: "",
      image: "",
      sortOrder: 0,
      active: true,
    });
  };

  const save = trpc.admin.saveCategory.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.categories.invalidate(),
        utils.shop.categories.invalidate(),
        utils.shop.products.invalidate(),
        utils.shop.productBySlug.invalidate(),
      ]);
      setAlert({
        variant: "success",
        title: editing ? "Collection Updated" : "Collection Created",
        message: editing
          ? `Changes to collection "${form.name}" have been saved.`
          : `Collection "${form.name}" has been created.`,
      });
      resetForm();
    },
    onError: (e) => {
      setAlert({
        variant: "destructive",
        title: "Could Not Save Collection",
        message: e.message,
      });
    },
  });

  const del = trpc.admin.deleteCategory.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.categories.invalidate(),
        utils.shop.categories.invalidate(),
        utils.shop.products.invalidate(),
      ]);
      setCategoryToDelete(null);
      setAlert({
        variant: "success",
        title: "Collection Deleted",
        message:
          "The collection has been deleted. Assigned products are now unassigned.",
      });
    },
    onError: (e) => {
      setCategoryToDelete(null);
      setAlert({
        variant: "destructive",
        title: "Deletion Failed",
        message: e.message,
      });
    },
  });

  const uploadCollectionImage = async (file?: File) => {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setAlert({
        variant: "destructive",
        title: "Unsupported Image",
        message: "Choose a JPG, PNG, WebP, or GIF image.",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAlert({
        variant: "destructive",
        title: "Image Too Large",
        message: "Choose an image smaller than 5 MB.",
      });
      return;
    }
    setUploadingImage(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/admin/product-images", {
        method: "POST",
        body,
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || typeof result.url !== "string") {
        throw new Error(
          result.error || "Image upload failed. Please try again.",
        );
      }
      setForm((current) => ({ ...current, image: result.url }));
      await utils.admin.photoLibrary.invalidate();
      setShowPhotoLibrary(false);
      setAlert({
        variant: "success",
        title: "Image Uploaded",
        message:
          "The image was uploaded and selected for this collection. Save the collection to keep it.",
      });
    } catch (error) {
      setAlert({
        variant: "destructive",
        title: "Image Upload Failed",
        message:
          error instanceof Error
            ? error.message
            : "Image upload failed. Please try again.",
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const input =
    "w-full bg-crochic-cream border border-crochic-blush px-4 py-3 text-sm focus:outline-none focus:border-crochic-rose";

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl mb-8">Collections</h1>

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

      <div className="bg-crochic-ivory border border-crochic-blush p-6 mb-10">
        <h2 className="font-display text-2xl mb-5">
          {editing ? "Edit collection" : "New collection"}
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const name = form.name.trim();
            if (name.length < 2) {
              setAlert({
                variant: "destructive",
                title: "Validation Error",
                message: "Collection name must be at least 2 characters.",
              });
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
            <div className="sm:col-span-2 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-2 border border-crochic-blush px-4 py-3 text-xs uppercase tracking-[0.12em] hover:border-crochic-rose disabled:opacity-60"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingImage ? "Uploading…" : "Upload image"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPhotoLibrary((shown) => !shown)}
                  className="inline-flex items-center gap-2 border border-crochic-blush px-4 py-3 text-xs uppercase tracking-[0.12em] hover:border-crochic-rose"
                >
                  <ImagePlus className="w-4 h-4" />
                  {showPhotoLibrary
                    ? "Close Photo Library"
                    : "Choose from Photo Library"}
                </button>
                {form.image && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({ ...current, image: "" }))
                    }
                    className="px-2 py-2 text-xs text-crochic-muted hover:text-crochic-rose"
                  >
                    Remove image
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) =>
                  void uploadCollectionImage(event.target.files?.[0])
                }
              />
              {form.image ? (
                <div className="flex items-start gap-4 border border-crochic-blush p-3">
                  <img
                    src={form.image}
                    alt="Selected collection"
                    className="h-28 w-28 object-cover bg-crochic-blush/30"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Collection image selected
                    </p>
                    <p className="mt-1 break-all text-xs text-crochic-muted">
                      {form.image}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-crochic-muted">
                  No collection image selected (optional).
                </p>
              )}
              {showPhotoLibrary && (
                <div className="border border-crochic-blush p-4">
                  <h3 className="mb-3 text-sm font-medium">Choose an image</h3>
                  {libraryLoading ? (
                    <p className="text-sm text-crochic-muted">
                      Loading Photo Library…
                    </p>
                  ) : libraryError ? (
                    <p role="alert" className="text-sm text-red-700">
                      Could not load Photo Library: {libraryError.message}
                    </p>
                  ) : libraryPhotos?.length ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {libraryPhotos.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => {
                            setForm((current) => ({
                              ...current,
                              image: photo.url,
                            }));
                            setShowPhotoLibrary(false);
                          }}
                          className={`overflow-hidden border text-left transition-colors ${form.image === photo.url ? "border-crochic-rose ring-2 ring-crochic-rose" : "border-crochic-blush hover:border-crochic-rose"}`}
                          aria-label={`Choose ${photo.fileName}`}
                        >
                          <img
                            src={photo.url}
                            alt={photo.alt || photo.fileName}
                            className="aspect-square w-full object-cover bg-crochic-blush/20"
                          />
                          <span className="block truncate px-2 py-2 text-xs">
                            {photo.fileName}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-crochic-muted">
                      Your Photo Library is empty. Upload an image to get
                      started.
                    </p>
                  )}
                </div>
              )}
            </div>
            <textarea
              className={`${input} sm:col-span-2`}
              placeholder="Description"
              aria-label="Collection description"
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
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
            <Plus className="w-4 h-4" />{" "}
            {save.isPending
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Add collection"}
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

      {error && (
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Could Not Load Collections</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      )}
      {isLoading ? (
        <p role="status" className="p-6 text-sm text-crochic-muted">
          Loading collections…
        </p>
      ) : (
        <ul className="divide-y divide-crochic-blush bg-crochic-ivory border border-crochic-blush">
          {categories?.map((c) => (
            <li key={c.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-12 h-14 bg-crochic-blush/30 overflow-hidden shrink-0">
                {c.image && (
                  <img
                    src={c.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-crochic-muted">/shop/{c.slug}</p>
                {!c.active && (
                  <p className="text-xs text-amber-700">Hidden from shop</p>
                )}
              </div>
              <button
                className="p-2 hover:text-crochic-rose"
                aria-label={`Edit ${c.name}`}
                onClick={() => {
                  setEditing(c.id);
                  setForm({
                    name: c.name,
                    description: c.description ?? "",
                    image: c.image ?? "",
                    sortOrder: c.sortOrder,
                    active: c.active,
                  });
                }}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 hover:text-red-600"
                aria-label={`Delete ${c.name}`}
                disabled={del.isPending}
                onClick={() => setCategoryToDelete({ id: c.id, name: c.name })}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent className="bg-white border-crochic-blush">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl text-crochic-dark">
              Delete Collection
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-crochic-muted">
              Are you sure you want to delete the collection{" "}
              <strong className="text-crochic-dark">
                &ldquo;{categoryToDelete?.name}&rdquo;
              </strong>
              ? Products in this collection will become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-crochic-blush text-crochic-dark">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (categoryToDelete) {
                  del.mutate({ id: categoryToDelete.id });
                }
              }}
              disabled={del.isPending}
            >
              {del.isPending ? "Deleting…" : "Delete Collection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
