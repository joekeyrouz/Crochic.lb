import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { formatPrice } from "@/lib/shop";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-teal-100 text-teal-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 ${STATUS_COLORS[status] ?? "bg-gray-100"}`}>
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = trpc.admin.stats.useQuery();

  if (isLoading || !data) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 bg-crochic-blush/30" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total sales", value: formatPrice(data.totalSales) },
    { label: "Orders", value: data.orderCount },
    { label: "Products", value: data.productCount },
    { label: "Customers", value: data.customerCount },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">Good day, maker.</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {cards.map((c) => (
          <div key={c.label} className="bg-crochic-ivory border border-crochic-blush p-6">
            <p className="text-[11px] uppercase tracking-[0.16em] text-crochic-muted">{c.label}</p>
            <p className="font-display text-3xl mt-2">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="bg-crochic-ivory border border-crochic-blush p-6">
          <h2 className="font-display text-2xl mb-5">Recent orders</h2>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-crochic-muted italic">No orders yet — they're coming.</p>
          ) : (
            <ul className="divide-y divide-crochic-blush">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <Link to={`/admin/orders/${o.id}`} className="font-medium hover:text-crochic-rose">
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-crochic-muted">{o.customer?.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <span className="font-medium">{formatPrice(o.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-crochic-ivory border border-crochic-blush p-6">
          <h2 className="font-display text-2xl mb-5">Low stock</h2>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-crochic-muted italic">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-crochic-blush">
              {data.lowStock.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between text-sm">
                  <Link to={`/admin/products/${p.id}`} className="font-medium hover:text-crochic-rose">
                    {p.name}
                  </Link>
                  <span className={p.stock === 0 ? "text-red-600 font-medium" : "text-amber-600"}>
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
