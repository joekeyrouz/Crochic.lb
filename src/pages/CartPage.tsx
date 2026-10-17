import { Link } from "react-router";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, useSettings } from "@/lib/shop";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear, subtotal } = useCart();
  const { get } = useSettings();
  const currency = get("currency", "USD");

  if (items.length === 0) {
    return (
      <div className="container-crochic py-32 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-crochic-blush mb-6" />
        <h1 className="font-display text-4xl italic text-crochic-muted">
          Your little basket is waiting for something special.
        </h1>
        <Link
          to="/shop"
          className="inline-block mt-8 bg-crochic-dark text-crochic-cream px-10 py-4 text-xs uppercase tracking-[0.2em] hover:bg-crochic-rose transition-colors"
        >
          Explore the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="container-crochic py-10 lg:py-16">
      <h1 className="font-display text-4xl sm:text-5xl mb-10">Your basket</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-12">
        <ul className="divide-y divide-crochic-blush">
          {items.map((item) => (
            <li key={item.productId} className="py-6 flex gap-5">
              <Link
                to={`/product/${item.slug}`}
                className="w-24 h-32 bg-crochic-blush/30 overflow-hidden shrink-0"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-3">
                  <Link
                    to={`/product/${item.slug}`}
                    className="font-display text-xl hover:text-crochic-rose transition-colors"
                  >
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.name}`}
                    className="text-crochic-muted hover:text-crochic-rose"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-crochic-muted mt-1">
                  {formatPrice(item.price, currency)}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center border border-crochic-blush">
                    <button
                      className="p-2"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      className="p-2"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="font-medium">
                    {formatPrice(item.price * item.quantity, currency)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="bg-crochic-ivory border border-crochic-blush p-7 self-start lg:sticky lg:top-28">
          <h2 className="font-display text-2xl mb-6">Summary</h2>
          <div className="flex justify-between text-sm py-2">
            <span className="text-crochic-muted">Subtotal</span>
            <span>{formatPrice(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-sm py-2 border-b border-crochic-blush">
            <span className="text-crochic-muted">Delivery</span>
            <span className="italic text-crochic-rose">
              {get(
                "delivery_message",
                "Delivery is available! Contact us to confirm delivery options and fees for your location.",
              )}
            </span>
          </div>
          <div className="flex justify-between py-4 font-medium">
            <span>Estimated total</span>
            <span>{formatPrice(subtotal, currency)}</span>
          </div>
          <Link
            to="/checkout"
            className="block text-center bg-crochic-dark text-crochic-cream py-4 text-xs uppercase tracking-[0.2em] hover:bg-crochic-rose transition-colors"
          >
            Proceed to checkout
          </Link>
          <button
            onClick={clear}
            className="mt-4 w-full text-center text-xs uppercase tracking-[0.18em] text-crochic-muted hover:text-crochic-rose transition-colors"
          >
            Clear basket
          </button>
        </aside>
      </div>
    </div>
  );
}
