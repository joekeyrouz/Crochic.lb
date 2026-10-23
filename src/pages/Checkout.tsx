import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, useSettings } from "@/lib/shop";

const FIELDS = [
  { name: "name", label: "Full name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  {
    name: "address",
    label: "Address",
    type: "text",
    autoComplete: "street-address",
  },
  { name: "city", label: "City", type: "text", autoComplete: "address-level2" },
  {
    name: "country",
    label: "Country",
    type: "text",
    autoComplete: "country-name",
  },
] as const;

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { get } = useSettings();
  const currency = get("currency", "USD");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const checkout = trpc.shop.checkout.useMutation({
    onSuccess: (data) => {
      clear();
      navigate(`/order-success/${data.orderNumber}`, {
        state: { total: data.total, deliveryMessage: data.deliveryMessage },
      });
    },
    onError: (err) => toast.error(err.message),
  });

  if (items.length === 0) {
    return (
      <div className="container-crochic py-32 text-center">
        <h1 className="font-display text-4xl italic text-crochic-muted">
          Your basket is empty.
        </h1>
        <Link
          to="/shop"
          className="inline-block mt-6 text-xs uppercase tracking-[0.18em] border-b border-crochic-brown pb-0.5"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="container-crochic py-10 lg:py-16">
      <h1 className="font-display text-4xl sm:text-5xl mb-3">Checkout</h1>
      <p className="text-sm text-crochic-muted mb-10 italic">
        Payment: Cash on delivery.{" "}
        {get(
          "delivery_message",
          "Delivery is available! Contact us to confirm delivery options and fees for your location.",
        )}
      </p>
      <form
        className="grid lg:grid-cols-[1fr_380px] gap-12"
        onSubmit={(e) => {
          e.preventDefault();
          checkout.mutate({
            customer: {
              name: form.name ?? "",
              email: form.email ?? "",
              phone: form.phone ?? "",
              address: form.address ?? "",
              city: form.city ?? "",
              country: form.country ?? "",
              notes: notes || undefined,
            },
            items: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          });
        }}
      >
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {FIELDS.map((f) => (
              <div
                key={f.name}
                className={f.name === "address" ? "sm:col-span-2" : ""}
              >
                <label
                  htmlFor={f.name}
                  className="block text-[11px] uppercase tracking-[0.16em] text-crochic-muted mb-2"
                >
                  {f.label}
                </label>
                <input
                  id={f.name}
                  name={f.name}
                  type={f.type}
                  required
                  autoComplete={f.autoComplete}
                  value={form[f.name] ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, [f.name]: e.target.value })
                  }
                  className="w-full bg-crochic-ivory border border-crochic-blush px-4 py-3.5 text-sm focus:outline-none focus:border-crochic-rose"
                />
              </div>
            ))}
          </div>
          <div>
            <label
              htmlFor="notes"
              className="block text-[11px] uppercase tracking-[0.16em] text-crochic-muted mb-2"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything we should know? Gift wrap, colour preferences…"
              className="w-full bg-crochic-ivory border border-crochic-blush px-4 py-3.5 text-sm focus:outline-none focus:border-crochic-rose"
            />
          </div>
        </div>

        <aside className="bg-crochic-ivory border border-crochic-blush p-7 self-start lg:sticky lg:top-28">
          <h2 className="font-display text-2xl mb-6">Your order</h2>
          <ul className="space-y-4 mb-6">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-3 items-center">
                <div className="w-14 h-[4.5rem] bg-crochic-blush/30 overflow-hidden shrink-0">
                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.name}</p>
                  <p className="text-xs text-crochic-muted">
                    × {item.quantity}
                  </p>
                </div>
                <span className="text-sm">
                  {formatPrice(item.price * item.quantity, currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm py-2 border-t border-crochic-blush">
            <span className="text-crochic-muted">Subtotal</span>
            <span>{formatPrice(subtotal, currency)}</span>
          </div>

          <div className="flex justify-between text-sm py-2 border-t border-crochic-blush">
            <span className="text-crochic-muted">Delivery fee</span>
            <span className="text-right text-crochic-rose">
              Confirmed based on your location
            </span>
          </div>
          <div className="flex justify-between py-3 font-medium border-t border-crochic-blush">
            <span>Order subtotal</span>
            <span>{formatPrice(subtotal, currency)}</span>
          </div>
          <p className="text-xs text-crochic-muted leading-relaxed">
            Your final total will include the delivery fee, which we will
            confirm with you before finalizing your order.
          </p>

          <button
            type="submit"
            disabled={checkout.isPending}
            className="mt-4 w-full bg-crochic-dark text-crochic-cream py-4 text-xs uppercase tracking-[0.2em] hover:bg-crochic-rose transition-colors disabled:opacity-60"
          >
            {checkout.isPending
              ? "Placing order…"
              : "Place order — cash on delivery"}
          </button>
        </aside>
      </form>
    </div>
  );
}
