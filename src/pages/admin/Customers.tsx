import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { formatPrice } from "@/lib/shop";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const { data: customers } = trpc.admin.customers.useQuery({ search: search || undefined });

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">Customers</h1>
      <input
        type="search"
        placeholder="Search name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm bg-crochic-ivory border border-crochic-blush px-4 py-3 text-sm mb-8 focus:outline-none focus:border-crochic-rose"
      />
      <div className="bg-crochic-ivory border border-crochic-blush overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-crochic-muted border-b border-crochic-blush">
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Phone</th>
              <th className="px-5 py-4">Orders</th>
              <th className="px-5 py-4">Total spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-crochic-blush">
            {customers?.map((c) => (
              <tr key={c.id} className="hover:bg-crochic-blush/10">
                <td className="px-5 py-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-crochic-muted">{c.email}</p>
                </td>
                <td className="px-5 py-3 text-crochic-muted">{c.phone}</td>
                <td className="px-5 py-3">{c.orderCount}</td>
                <td className="px-5 py-3 font-medium">{formatPrice(c.totalSpent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers?.length === 0 && (
          <p className="p-8 text-center text-sm text-crochic-muted italic">No customers yet.</p>
        )}
      </div>
    </div>
  );
}
