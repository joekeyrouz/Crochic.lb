import { Link, useLocation, useParams } from "react-router";
import { motion } from "framer-motion";
import { Check, MessageCircle } from "lucide-react";
import { formatPrice, useSettings, whatsappLink } from "@/lib/shop";

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const state = (location.state ?? {}) as {
    total?: number;
    deliveryMessage?: string;
  };
  const { get } = useSettings();

  return (
    <div className="container-crochic py-24 text-center max-w-xl mx-auto">
      <motion.div
        className="w-20 h-20 mx-auto rounded-full bg-crochic-blush/50 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 14,
          delay: 0.15,
        }}
      >
        <Check className="w-9 h-9 text-crochic-rose-deep" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="font-display text-4xl sm:text-5xl mt-8 leading-tight">
          Your CroChic order is being prepared{" "}
          <em className="text-crochic-rose">with love.</em>
        </h1>
        <p className="mt-6 text-sm text-crochic-muted">
          Order number{" "}
          <span className="font-medium text-crochic-dark tracking-wider">
            {orderNumber}
          </span>
        </p>
        {state.total != null && (
          <p className="mt-1 text-sm text-crochic-muted">
            Total: {formatPrice(state.total, get("currency", "USD"))} — cash on
            delivery
          </p>
        )}
        <p className="mt-4 text-sm italic text-crochic-muted">
          {state.deliveryMessage ??
            get(
              "delivery_message",
              "Delivery is available! Contact us to confirm delivery options and fees for your location.",
            )}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={whatsappLink(
              get("whatsapp_number"),
              `Hi CroChic! About my order ${orderNumber}`,
            )}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-crochic-blush px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-crochic-blush/30 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Message us
          </a>
          <Link
            to="/shop"
            className="bg-crochic-dark text-crochic-cream px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-crochic-rose transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
