import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  FolderOpen,
  ShoppingBag,
  Users,
  Settings as SettingsIcon,
  Store,
  X,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { trpc } from "@/providers/trpc";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Collections", icon: FolderOpen },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
];

export function AdminLayout() {
  const { user, isLoading, logout } = useAuth({
    redirectPath: "/admin/login",
  });
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data: hasAdminSession, isLoading: isAdminSessionLoading } =
    trpc.auth.adminSessionStatus.useQuery();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  if (isLoading || isAdminSessionLoading) {
    return (
      <div className="min-h-screen bg-crochic-cream flex items-center justify-center">
        <p className="font-display text-2xl italic text-crochic-muted animate-pulse">
          CroChic studio…
        </p>
      </div>
    );
  }

  if (!user || user.role !== "admin" || !hasAdminSession) {
    return (
      <div className="min-h-screen bg-crochic-cream flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-4xl mb-4">Admin access</h1>
          <p className="text-crochic-muted text-sm mb-8">
            Sign in with an admin account to manage the CroChic boutique.
          </p>
          <Link
            to="/admin/login"
            className="inline-block bg-crochic-dark text-crochic-cream px-8 py-3.5 text-xs uppercase tracking-[0.2em] hover:bg-crochic-rose transition-colors"
          >
            Admin sign in
          </Link>
          {user && (
            <button
              onClick={logout}
              className="ml-2 inline-block border border-crochic-dark px-8 py-3.5 text-xs uppercase tracking-[0.2em] hover:bg-crochic-dark hover:text-crochic-cream transition-colors"
            >
              Sign out and switch account
            </button>
          )}
          <Link
            to="/"
            className="block mt-4 text-xs text-crochic-muted hover:text-crochic-rose"
          >
            ← Back to the boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-crochic-cream lg:flex">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close admin menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col bg-crochic-dark text-crochic-cream/80 transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-60 lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <Link to="/" className="font-display text-2xl text-crochic-cream">
                Cro<span className="italic text-crochic-blush">Chic</span>
              </Link>
              <p className="text-[10px] uppercase tracking-[0.2em] text-crochic-cream/40 mt-1">
                Studio admin
              </p>
            </div>
            <button
              type="button"
              className="rounded p-2 hover:bg-white/10 lg:hidden"
              aria-label="Close admin menu"
              onClick={() => setMobileNavOpen(false)}
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setMobileNavOpen(false)}
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
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 rounded-sm"
          >
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
      <main className="min-w-0 px-4 py-5 sm:px-6 lg:flex-1 lg:p-8 xl:p-12">
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-crochic-blush bg-white px-3 text-sm"
            aria-label="Open admin menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-4" />
            Menu
          </button>
          <span className="font-display text-lg text-crochic-dark">Studio</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
