import { Link, NavLink, Outlet } from "react-router";
import {
  LayoutDashboard,
  LogOut,
  Package,
  FolderOpen,
  ShoppingBag,
  Users,
  Settings as SettingsIcon,
  Store,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Collections", icon: FolderOpen },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export function AdminLayout() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-crochic-cream flex items-center justify-center">
        <p className="font-display text-2xl italic text-crochic-muted animate-pulse">
          CroChic studio…
        </p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-crochic-cream flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-4xl mb-4">Admin access</h1>
          <p className="text-crochic-muted text-sm mb-8">
            Sign in with an admin account to manage the CroChic boutique.
          </p>
          <Link
            to="/login"
            className="inline-block bg-crochic-dark text-crochic-cream px-8 py-3.5 text-xs uppercase tracking-[0.2em] hover:bg-crochic-rose transition-colors"
          >
            Sign in
          </Link>
          <Link to="/" className="block mt-4 text-xs text-crochic-muted hover:text-crochic-rose">
            ← Back to the boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crochic-cream flex">
      <aside className="w-60 bg-crochic-dark text-crochic-cream/80 flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="font-display text-2xl text-crochic-cream">
            Cro<span className="italic text-crochic-blush">Chic</span>
          </Link>
          <p className="text-[10px] uppercase tracking-[0.2em] text-crochic-cream/40 mt-1">
            Studio admin
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 text-sm rounded-sm transition-colors",
                  isActive
                    ? "bg-crochic-rose/90 text-white"
                    : "hover:bg-white/10",
                )
              }
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 rounded-sm">
            <Store className="w-4 h-4" /> View boutique
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 rounded-sm text-left"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 lg:p-12 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
