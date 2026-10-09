import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useSettings, whatsappLink } from "@/lib/shop";

export function WhatsAppButton() {
  const { get } = useSettings();
  const number = get("whatsapp_number");
  if (!number) return null;
  return (
    <motion.a
      href={whatsappLink(number, "Hi CroChic! I have a question about a piece.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-6 right-6 z-40 flex items-center gap-2"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 18 }}
    >
      <span className="hidden sm:block max-w-0 overflow-hidden group-hover:max-w-[160px] transition-all duration-500 whitespace-nowrap text-xs bg-crochic-dark text-crochic-cream rounded-full px-0 group-hover:px-4 py-2">
        Chat with us
      </span>
      <span className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-105 transition-transform">
        <MessageCircle className="w-6 h-6" />
      </span>
    </motion.a>
  );
}
