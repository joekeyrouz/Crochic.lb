import { Outlet } from "react-router";
import { CartProvider } from "@/context/CartContext";
import { AnnouncementBar, Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/ui/sonner";

export function StorefrontLayout() {
  return (
    <CartProvider>
      <AnnouncementBar />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
      <Toaster position="bottom-center" />
    </CartProvider>
  );
}
