import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "brand_name", label: "Brand name" },
  { key: "tagline", label: "Tagline" },
  { key: "announcement", label: "Announcement bar" },
  { key: "currency", label: "Currency", hint: "e.g. USD" },
  { key: "whatsapp_number", label: "WhatsApp number", hint: "Digits with country code" },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "store_email", label: "Store email" },
  { key: "delivery_fee", label: "Delivery fee" },
  { key: "delivery_message", label: "Delivery message" },
];

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const { data: settings } = trpc.admin.settings.useQuery();
  const [form, setForm] = useState<Record<string, string>>({});
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(settings);
      setDeliveryEnabled(settings.delivery_enabled === "true");
    }
  }, [settings]);

  const save = trpc.admin.saveSettings.useMutation({
    onSuccess: () => {
      utils.admin.settings.invalidate();
      utils.shop.settings.invalidate();
      toast.success("Settings saved — the boutique is updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const input = "w-full bg-crochic-cream border border-crochic-blush px-4 py-3 text-sm focus:outline-none focus:border-crochic-rose";

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl mb-8">Settings</h1>
      <div className="bg-crochic-ivory border border-crochic-blush p-6 space-y-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-[11px] uppercase tracking-[0.16em] text-crochic-muted mb-2" htmlFor={f.key}>
              {f.label}
            </label>
            <input
              id={f.key}
              className={input}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
            {f.hint && <p className="text-xs text-crochic-muted mt-1">{f.hint}</p>}
          </div>
        ))}
        <label className="flex items-center gap-3 text-sm cursor-pointer pt-2">
          <input
            type="checkbox"
            className="accent-crochic-rose w-4 h-4"
            checked={deliveryEnabled}
            onChange={(e) => setDeliveryEnabled(e.target.checked)}
          />
          Delivery enabled (turn off to show “coming soon”)
        </label>
        <button
          onClick={() =>
            save.mutate({ ...form, delivery_enabled: String(deliveryEnabled) })
          }
          disabled={save.isPending}
          className="bg-crochic-dark text-crochic-cream px-8 py-3.5 text-xs uppercase tracking-[0.18em] hover:bg-crochic-rose transition-colors disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
