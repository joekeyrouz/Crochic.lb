import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  MapPin,
  Calendar,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Search,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, useSettings, whatsappLink } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string; step: number }
> = {
  pending: {
    label: "Pending Confirmation",
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    step: 1,
  },
  confirmed: {
    label: "Order Confirmed",
    color: "text-blue-800",
    bg: "bg-blue-50",
    border: "border-blue-200",
    step: 2,
  },
  preparing: {
    label: "Handcrafting with Love",
    color: "text-purple-800",
    bg: "bg-purple-50",
    border: "border-purple-200",
    step: 3,
  },
  ready: {
    label: "Ready for Dispatch",
    color: "text-indigo-800",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    step: 4,
  },
  shipped: {
    label: "On the Way",
    color: "text-sky-800",
    bg: "bg-sky-50",
    border: "border-sky-200",
    step: 4,
  },
  delivered: {
    label: "Delivered",
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    step: 5,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-rose-800",
    bg: "bg-rose-50",
    border: "border-rose-200",
    step: 0,
  },
};

const TRACKING_STEPS = [
  { step: 1, title: "Placed" },
  { step: 2, title: "Confirmed" },
  { step: 3, title: "Crafting" },
  { step: 4, title: "Shipped" },
  { step: 5, title: "Delivered" },
];

export default function MyOrders() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { get } = useSettings();
  const currency = get("currency", "USD");
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: orders = [],
    isLoading: ordersLoading,
    refetch,
    isRefetching,
  } = trpc.shop.myOrders.useQuery(undefined, {
    enabled: Boolean(isAuthenticated && user),
  });

  const toggleExpand = (orderId: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  if (authLoading) {
    return (
      <div className="container-crochic py-24 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-crochic-rose border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs tracking-widest uppercase text-crochic-muted">
          Loading your account...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container-crochic py-20 lg:py-28 max-w-xl mx-auto text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-crochic-blush/60 flex items-center justify-center text-crochic-rose mb-6">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-crochic-dark">
          Track Your Orders
        </h1>
        <p className="mt-3 text-sm text-crochic-muted">
          Please sign in to view your order history, live fulfillment tracking,
          and receipts.
        </p>
        <div className="mt-8">
          <Link
            to="/login"
            className="inline-block bg-crochic-dark text-crochic-cream px-8 py-3.5 text-xs uppercase tracking-[0.18em] hover:bg-crochic-rose transition-colors shadow-sm"
          >
            Sign in with email
          </Link>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        if (order.status === "delivered" || order.status === "cancelled") return false;
      } else if (order.status !== statusFilter) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = order.orderNumber.toLowerCase().includes(q);
      const matchItem = order.items.some((i) =>
        i.productName.toLowerCase().includes(q),
      );
      return matchNumber || matchItem;
    }
    return true;
  });

  return (
    <div className="container-crochic py-10 lg:py-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-crochic-blush">
        <div>
          <span className="text-xs tracking-[0.2em] uppercase text-crochic-rose font-medium">
            Account Dashboard
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-crochic-dark mt-1">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-crochic-muted mt-1.5">
            Signed in as <strong className="text-crochic-dark">{user.email}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border-crochic-blush hover:bg-crochic-blush/20 text-crochic-dark text-xs gap-1.5 h-9"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 bg-crochic-dark text-crochic-cream px-4 py-2 text-xs uppercase tracking-[0.14em] hover:bg-crochic-rose transition-colors h-9"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shop New</span>
          </Link>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="py-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {[
            { id: "all", label: `All (${orders.length})` },
            {
              id: "active",
              label: `Active (${orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length})`,
            },
            {
              id: "delivered",
              label: `Delivered (${orders.filter((o) => o.status === "delivered").length})`,
            },
            {
              id: "cancelled",
              label: `Cancelled (${orders.filter((o) => o.status === "cancelled").length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors font-medium ${
                statusFilter === tab.id
                  ? "bg-crochic-dark text-crochic-cream shadow-sm"
                  : "bg-white text-crochic-muted hover:text-crochic-dark border border-crochic-blush/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-crochic-muted" />
          <Input
            placeholder="Search order or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 h-9 text-xs bg-white border-crochic-blush focus-visible:ring-crochic-rose"
          />
        </div>
      </div>

      {/* Orders Content */}
      {ordersLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-crochic-rose border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-xs text-crochic-muted uppercase tracking-widest">
            Retrieving your order history...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white/80 rounded-2xl border border-crochic-blush/80 p-8 sm:p-14 text-center max-w-lg mx-auto my-8 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-crochic-blush/50 flex items-center justify-center text-crochic-rose mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl text-crochic-dark">
            {orders.length === 0 ? "No orders placed yet" : "No orders found"}
          </h2>
          <p className="text-xs sm:text-sm text-crochic-muted mt-2 max-w-sm mx-auto">
            {orders.length === 0
              ? "Every stitch has a story. Explore our handcrafted crochet collection to find your next favorite piece."
              : "Try adjusting your filter or search query to find the order you are looking for."}
          </p>
          <div className="mt-6">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-crochic-dark text-crochic-cream px-6 py-3 text-xs uppercase tracking-[0.16em] hover:bg-crochic-rose transition-colors"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const statusMeta =
              STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG.pending;
            const isExpanded = Boolean(expandedOrders[order.id]);
            const formattedDate = new Date(order.createdAt).toLocaleDateString(
              undefined,
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              },
            );

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-crochic-blush/70 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* Order Summary Header Bar */}
                <div className="p-4 sm:p-6 bg-crochic-cream/30 border-b border-crochic-blush/50 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-crochic-muted">
                        Order Number
                      </span>
                      <p className="font-display text-lg font-medium text-crochic-dark tracking-wide">
                        {order.orderNumber}
                      </p>
                    </div>
                    <div className="h-6 w-px bg-crochic-blush hidden sm:block" />
                    <div className="flex items-center gap-1.5 text-xs text-crochic-muted">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}
                    >
                      {order.status === "delivered" && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {order.status === "shipped" && (
                        <Truck className="w-3.5 h-3.5" />
                      )}
                      {order.status === "preparing" && (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {order.status === "pending" && (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {order.status === "cancelled" && (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{statusMeta.label}</span>
                    </span>

                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="p-1.5 text-crochic-muted hover:text-crochic-dark rounded-md hover:bg-crochic-blush/30 transition-colors"
                      aria-label={isExpanded ? "Collapse details" : "Expand details"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress Stepper (Mobile & Desktop) */}
                {order.status !== "cancelled" && (
                  <div className="px-4 py-5 sm:px-6 bg-white border-b border-crochic-blush/40">
                    <div className="max-w-2xl mx-auto">
                      <div className="flex items-center justify-between relative">
                        {/* Connecting track line */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-crochic-cream z-0" />
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-crochic-rose transition-all duration-500 z-0"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                ((statusMeta.step - 1) /
                                  (TRACKING_STEPS.length - 1)) *
                                  100,
                              ),
                            )}%`,
                          }}
                        />

                        {/* Step circles */}
                        {TRACKING_STEPS.map((s) => {
                          const isCompleted = statusMeta.step >= s.step;
                          const isCurrent = statusMeta.step === s.step;
                          return (
                            <div
                              key={s.step}
                              className="relative z-10 flex flex-col items-center"
                            >
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                                  isCompleted
                                    ? "bg-crochic-rose text-white shadow-sm"
                                    : "bg-white border-2 border-crochic-blush text-crochic-muted"
                                } ${isCurrent ? "ring-4 ring-crochic-blush/60" : ""}`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  s.step
                                )}
                              </div>
                              <span
                                className={`text-[10px] sm:text-xs mt-1.5 font-medium ${
                                  isCompleted
                                    ? "text-crochic-dark font-semibold"
                                    : "text-crochic-muted"
                                }`}
                              >
                                {s.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Preview */}
                <div className="p-4 sm:p-6 divide-y divide-crochic-blush/30">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-12 h-12 rounded-lg object-cover bg-crochic-cream flex-shrink-0 border border-crochic-blush/50"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-crochic-blush/40 flex items-center justify-center flex-shrink-0 text-crochic-rose">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-crochic-dark truncate">
                              {item.productName}
                            </p>
                            <p className="text-xs text-crochic-muted">
                              Qty: {item.quantity} ×{" "}
                              {formatPrice(Number(item.unitPrice), currency)}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-crochic-dark flex-shrink-0">
                          {formatPrice(Number(item.lineTotal), currency)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Financials & Action bar */}
                  <div className="pt-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-crochic-muted space-y-0.5">
                      <p>
                        Subtotal:{" "}
                        <span className="text-crochic-dark font-medium">
                          {formatPrice(Number(order.subtotal), currency)}
                        </span>
                        {Number(order.deliveryFee) > 0 ? (
                          <>
                            {" "}
                            · Delivery:{" "}
                            <span className="text-crochic-dark font-medium">
                              {formatPrice(Number(order.deliveryFee), currency)}
                            </span>
                          </>
                        ) : (
                          <> · Delivery: Free / Included</>
                        )}
                      </p>
                      <p className="text-sm font-semibold text-crochic-dark">
                        Total: {formatPrice(Number(order.total), currency)}{" "}
                        <span className="text-xs font-normal text-crochic-muted">
                          (Cash on delivery)
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={whatsappLink(
                          get("whatsapp_number"),
                          `Hello CroChic! I would like an update on my order ${order.orderNumber}.`,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-crochic-blush rounded-md hover:bg-crochic-blush/20 text-crochic-dark transition-colors font-medium"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ask on WhatsApp</span>
                      </a>
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="text-xs text-crochic-rose underline underline-offset-4 hover:text-crochic-dark transition-colors py-1 px-2"
                      >
                        {isExpanded ? "Hide tracking details" : "View tracking details"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Tracking Timeline & Customer Address Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-crochic-blush/60 bg-crochic-cream/20 px-4 py-5 sm:px-6"
                    >
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Status History Timeline */}
                        <div>
                          <h4 className="text-xs uppercase tracking-wider text-crochic-dark font-semibold mb-3 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-crochic-rose" />
                            <span>Live Status History</span>
                          </h4>
                          {order.statusHistory.length === 0 ? (
                            <p className="text-xs text-crochic-muted italic">
                              No status notes yet.
                            </p>
                          ) : (
                            <ol className="relative border-l border-crochic-blush ml-2 space-y-3">
                              {order.statusHistory.map((h) => (
                                <li key={h.id} className="mb-2 ml-4">
                                  <div className="absolute w-2.5 h-2.5 bg-crochic-rose rounded-full -left-1.5 border border-white" />
                                  <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-xs font-semibold text-crochic-dark capitalize">
                                      {h.status}
                                    </span>
                                    <span className="text-[10px] text-crochic-muted">
                                      {new Date(h.createdAt).toLocaleTimeString(
                                        [],
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          month: "short",
                                          day: "numeric",
                                        },
                                      )}
                                    </span>
                                  </div>
                                  {h.note && (
                                    <p className="text-xs text-crochic-muted mt-0.5">
                                      {h.note}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>

                        {/* Delivery Destination */}
                        {order.customer && (
                          <div className="bg-white p-4 rounded-lg border border-crochic-blush/60 text-xs space-y-1.5">
                            <h4 className="uppercase tracking-wider text-crochic-dark font-semibold mb-2 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-crochic-rose" />
                              <span>Delivery Destination</span>
                            </h4>
                            <p className="font-medium text-crochic-dark">
                              {order.customer.name}
                            </p>
                            <p className="text-crochic-muted">
                              {order.customer.address}
                            </p>
                            <p className="text-crochic-muted">
                              {order.customer.city}, {order.customer.country}
                            </p>
                            <p className="text-crochic-muted">
                              Phone: {order.customer.phone || "—"}
                            </p>
                            {order.notes && (
                              <p className="pt-2 text-crochic-dark border-t border-crochic-blush/40 italic">
                                Note: &ldquo;{order.notes}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

