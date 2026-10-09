import { trpc } from "@/providers/trpc";

export function useSettings() {
  const { data } = trpc.shop.settings.useQuery(undefined, {
    staleTime: 60_000,
  });
  return {
    settings: data ?? {},
    get: (key: string, fallback = "") => data?.[key] ?? fallback,
  };
}

export function formatPrice(value: number | string, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value));
}

export function whatsappLink(number: string, message?: string) {
  const clean = number.replace(/[^0-9]/g, "");
  const base = `https://wa.me/${clean}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
