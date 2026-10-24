import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowLeft, CheckCircle2, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { formatPrice } from "@/lib/shop";
import { StatusBadge } from "./Dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [alert, setAlert] = useState<{
    variant: "success" | "destructive";
    title: string;
    message: string;
  } | null>(null);

  const { data } = trpc.admin.order.useQuery({ id: Number(id) });
  const update = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: (_, variables) => {
      utils.admin.order.invalidate();
      utils.admin.orders.invalidate();
      setAlert({
        variant: "success",
        title: "Order Status Updated",
        message: `Order status has been updated to "${variables.status}".`,
      });
    },
    onError: (e) => {
      setAlert({
        variant: "destructive",
        title: "Update Failed",
        message: e.message,
      });
    },
  });

  if (!data) return null;
  const { order, history } = data;

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-crochic-muted hover:text-crochic-rose mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-4 mb-8">
        <h1 className="font-display text-4xl">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>

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

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-crochic-ivory border border-crochic-blush p-6">
          <h2 className="eyebrow mb-4">Customer</h2>
          <p className="font-medium">{order.customer.name}</p>
          <p className="text-sm text-crochic-muted">{order.customer.email}</p>
          <p className="text-sm text-crochic-muted">{order.customer.phone}</p>
          <p className="text-sm text-crochic-muted mt-2">
            {order.customer.address}, {order.customer.city},{" "}
            {order.customer.country}
          </p>
          {order.notes && (
            <p className="text-sm italic mt-3">“{order.notes}”</p>
          )}
        </div>
        <div className="bg-crochic-ivory border border-crochic-blush p-6">
          <h2 className="eyebrow mb-4">Update status</h2>
          <div className="flex gap-3">
            <select
              value={order.status}
              onChange={(e) =>
                update.mutate({
                  id: order.id,
                  status: e.target.value as (typeof STATUSES)[number],
                })
              }
              className="flex-1 bg-crochic-cream border border-crochic-blush px-4 py-3 text-sm focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-crochic-muted mt-3">
            Payment: cash on delivery
          </p>
        </div>
      </div>

      <div className="bg-crochic-ivory border border-crochic-blush p-6 mb-8">
        <h2 className="eyebrow mb-4">Items</h2>
        <ul className="divide-y divide-crochic-blush text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="py-3 flex justify-between">
              <span>
                {i.productName} × {i.quantity}
              </span>
              <span className="font-medium">{formatPrice(i.lineTotal)}</span>
            </li>
          ))}
          <li className="py-3 flex justify-between text-crochic-muted">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </li>
          <li className="py-3 flex justify-between font-medium text-base">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </li>
        </ul>
      </div>

      <div className="bg-crochic-ivory border border-crochic-blush p-6">
        <h2 className="eyebrow mb-4">History</h2>
        <ul className="space-y-3 text-sm">
          {history.map((h) => (
            <li key={h.id} className="flex items-center gap-3">
              <StatusBadge status={h.status} />
              <span className="text-crochic-muted text-xs">
                {new Date(h.createdAt).toLocaleString()}
              </span>
              {h.note && <span className="text-crochic-muted">{h.note}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
