import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { formatPrice } from "@/lib/shop";
import { StatusBadge } from "./Dashboard";

const STATUSES = ["all", "pending", "confirmed", "preparing", "ready", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { data: orders } = trpc.admin.orders.useQuery({
    search: search || undefined,
    status,
  });

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">Orders</h1>
      <div className="flex flex-wrap gap-4 mb-8">
        <input
          type="search"
          placeholder="Search order #, name, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-crochic-ivory border border-crochic-blush px-4 py-3 text-sm focus:outline-none focus:border-crochic-rose"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-crochic-ivory border border-crochic-blush px-4 py-3 text-sm focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>
          ))}
        </select>
      </div>

      <div className="bg-crochic-ivory border border-crochic-blush overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-crochic-muted border-b border-crochic-blush">
              <th className="px-5 py-4">Order</th>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Items</th>
              <th className="px-5 py-4">Total</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-crochic-blush">
            {orders?.map((o) => (
              <tr key={o.id} className="hover:bg-crochic-blush/10">
                <td className="px-5 py-3">
                  <Link to={`/admin/orders/${o.id}`} className="font-medium hover:text-crochic-rose">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <p>{o.customer?.name}</p>
                  <p className="text-xs text-crochic-muted">{o.customer?.email}</p>
                </td>
                <td className="px-5 py-3">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                <td className="px-5 py-3 font-medium">{formatPrice(o.total)}</td>
                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-3 text-crochic-muted">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders?.length === 0 && (
          <p className="p-8 text-center text-sm text-crochic-muted italic">
            No orders yet — they haven't found their way in.
          </p>
        )}
      </div>
    </div>
  );
}
