import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, useSettings } from "@/lib/shop";

export function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeItem, subtotal } =
    useCart();
  const { get } = useSettings();
  const currency = get("currency", "USD");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-crochic-dark/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-crochic-ivory z-50 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "tween",
              duration: 0.34,
              ease: [0.22, 1, 0.36, 1],
            }}
            role="dialog"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-crochic-blush">
              <h2 className="font-display text-2xl">Your basket</h2>
              <button onClick={closeCart} aria-label="Close cart">
                <X className="w-5 h-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <ShoppingBag className="w-10 h-10 text-crochic-blush" />
                <p className="font-display text-xl italic text-crochic-muted">
                  Your little basket is waiting for something special.
                </p>
                <Link
                  to="/shop"
                  onClick={closeCart}
                  className="mt-2 text-xs uppercase tracking-[0.18em] border-b border-crochic-brown pb-0.5 hover:text-crochic-rose transition-colors"
                >
                  Explore the collection
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                  {items.map((item) => (
                    <motion.li
                      layout
                      key={item.productId}
                      className="flex gap-4"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <Link
                        to={`/product/${item.slug}`}
                        onClick={closeCart}
                        className="w-20 h-24 bg-crochic-blush/40 overflow-hidden shrink-0"
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
                        <div className="flex justify-between gap-2">
                          <Link
                            to={`/product/${item.slug}`}
                            onClick={closeCart}
                            className="font-display text-lg leading-tight hover:text-crochic-rose transition-colors"
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
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center border border-crochic-blush">
                            <button
                              className="p-1.5"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity - 1,
                                )
                              }
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              className="p-1.5"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity + 1,
                                )
                              }
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-medium">
                            {formatPrice(item.price * item.quantity, currency)}
                          </span>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
                <div className="border-t border-crochic-blush p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-crochic-muted">Subtotal</span>
                    <span className="font-medium">
                      {formatPrice(subtotal, currency)}
                    </span>
                  </div>
                  <p className="text-xs text-crochic-muted italic">
                    {get(
                      "delivery_message",
                      "Delivery is available! Contact us to confirm delivery options and fees for your location.",
                    )}
                  </p>
                  <Link
                    to="/checkout"
                    onClick={closeCart}
                    className="block text-center bg-crochic-dark text-crochic-cream py-3.5 text-xs uppercase tracking-[0.2em] hover:bg-crochic-brown transition-colors"
                  >
                    Checkout
                  </Link>
                  <Link
                    to="/cart"
                    onClick={closeCart}
                    className="block text-center text-xs uppercase tracking-[0.18em] text-crochic-muted hover:text-crochic-rose transition-colors"
                  >
                    View full basket
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
