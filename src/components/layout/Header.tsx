import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import {
  Heart,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/lib/shop";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/shop/lip-balm-charms", label: "Collections" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export function AnnouncementBar() {
  const { get } = useSettings();
  const message = get("announcement");
  if (!message) return null;
  return (
    <div className="bg-crochic-dark text-crochic-cream text-center text-[11px] tracking-[0.18em] uppercase py-2 px-4">
      {message}
    </div>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count, openCart } = useCart();
  const { get } = useSettings();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-500 border-b",
          scrolled
            ? "bg-crochic-ivory/95 backdrop-blur border-crochic-blush shadow-[0_1px_24px_rgba(51,38,33,0.06)]"
            : "bg-transparent border-transparent",
        )}
      >
        <div className="container-crochic flex items-center justify-between h-16 lg:h-20">
          {/* mobile menu button */}
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* desktop nav left */}
          <nav className="hidden lg:flex items-center gap-8 text-[13px] tracking-[0.14em] uppercase">
            {NAV.slice(0, 3).map((n) => (
              <NavLink key={n.label} to={n.to} className="link-underline">
                {n.label}
              </NavLink>
            ))}
          </nav>

          <Link
            to="/"
            className="font-display text-3xl lg:text-4xl font-medium tracking-tight text-crochic-dark"
          >
            Cro<span className="italic text-crochic-rose">Chic</span>
          </Link>

          <div className="flex items-center gap-1 lg:gap-2">
            <nav className="hidden lg:flex items-center gap-8 mr-6 text-[13px] tracking-[0.14em] uppercase">
              {NAV.slice(3).map((n) => (
                <NavLink key={n.label} to={n.to} className="link-underline">
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <button
              className="p-2 hover:text-crochic-rose transition-colors"
              onClick={() => navigate("/search")}
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="hidden lg:flex items-center gap-2 p-1.5 hover:text-crochic-rose transition-colors rounded-full"
                    aria-label="Account menu"
                  >
                    <span className="w-7 h-7 rounded-full bg-crochic-blush text-crochic-dark flex items-center justify-center font-semibold text-xs uppercase shadow-sm">
                      {user.name?.[0] || user.email?.[0] || "U"}
                    </span>
                    <span className="max-w-[100px] truncate text-xs font-medium hidden xl:inline text-crochic-dark">
                      {user.name || user.email?.split("@")[0]}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white shadow-xl border-crochic-blush p-2"
                >
                  <DropdownMenuLabel className="font-normal px-2 py-1.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-crochic-dark">
                        {user.name || "Customer"}
                      </p>
                      <p className="text-xs leading-none text-crochic-muted truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1 bg-crochic-blush/60" />
                  <DropdownMenuItem asChild>
                    <Link
                      to="/my-orders"
                      className="cursor-pointer flex items-center gap-2 text-crochic-dark text-xs py-2"
                    >
                      <Package className="w-4 h-4 text-crochic-rose" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className="cursor-pointer flex items-center gap-2 text-crochic-dark text-xs py-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-crochic-rose" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2 text-xs py-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="hidden lg:block p-2 hover:text-crochic-rose transition-colors"
                aria-label="Account"
              >
                <User className="w-[18px] h-[18px]" />
              </Link>
            )}
            <button
              className="relative p-2 hover:text-crochic-rose transition-colors"
              onClick={openCart}
              aria-label="Open cart"
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-crochic-rose text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-crochic-dark/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-crochic-ivory z-50 p-6 flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "tween",
                duration: 0.32,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="flex items-center justify-between mb-10">
                <span className="font-display text-2xl">
                  Cro<span className="italic text-crochic-rose">Chic</span>
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-6 text-lg font-display">
                {[
                  { to: "/", label: "Home" },
                  ...NAV,
                  { to: "/search", label: "Search" },
                ].map((n) => (
                  <NavLink
                    key={n.label}
                    to={n.to}
                    onClick={() => setMobileOpen(false)}
                    className="hover:text-crochic-rose transition-colors"
                  >
                    {n.label}
                  </NavLink>
                ))}

                {isAuthenticated && user ? (
                  <div className="pt-4 mt-2 border-t border-crochic-blush flex flex-col gap-3 font-sans text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-crochic-blush text-crochic-dark flex items-center justify-center font-bold text-xs uppercase">
                        {user.name?.[0] || user.email?.[0] || "U"}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-crochic-dark truncate">
                          {user.name || "Customer"}
                        </p>
                        <p className="text-xs text-crochic-muted truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/my-orders"
                      onClick={() => setMobileOpen(false)}
                      className="text-crochic-dark hover:text-crochic-rose py-1 flex items-center gap-2 text-xs font-medium"
                    >
                      <Package className="w-4 h-4 text-crochic-rose" /> My Orders
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="text-crochic-rose hover:underline py-1 flex items-center gap-2 text-xs font-medium"
                      >
                        <ShieldCheck className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                      }}
                      className="text-left text-destructive hover:underline py-1 flex items-center gap-2 text-xs font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                ) : (
                  <NavLink
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="hover:text-crochic-rose transition-colors"
                  >
                    Sign in
                  </NavLink>
                )}
              </nav>
              <div className="mt-auto text-xs text-crochic-muted flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-crochic-rose" />
                {get("tagline", "handmade with elegance")}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
