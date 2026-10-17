import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSettings } from "@/lib/shop";

const FAQS = [
  {
    q: "Are all pieces really handmade?",
    a: "Yes — every single CroChic piece is crocheted by hand, stitch by stitch. Because of this, tiny variations are part of the charm: your piece is genuinely one of a kind.",
  },
  {
    q: "Do you offer delivery?",
    a: "Yes, delivery is available! Contact us on WhatsApp or Instagram to confirm delivery options and fees for your location.",
  },
  {
    q: "Can I order a custom piece?",
    a: "We love custom orders! Message us on WhatsApp or Instagram with your idea — colours, charms, sizes — and we'll make it together.",
  },
  {
    q: "How do I care for my crochet piece?",
    a: "Spot clean gently with cool water and let it air dry flat. Avoid machine washing and direct heat to keep the stitches happy.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We currently accept cash on delivery. Online payment is on its way.",
  },
];

export default function FAQ() {
  const { get } = useSettings();

  return (
    <div className="container-crochic py-20 lg:py-28 max-w-2xl mx-auto">
      <p className="eyebrow mb-4 text-center">FAQ</p>
      <h1 className="font-display text-5xl text-center mb-4">Little answers</h1>
      <p className="text-center text-crochic-muted mb-12 italic">
        {get(
          "delivery_message",
          "Delivery is available! Contact us to confirm delivery options and fees for your location.",
        )}
      </p>

      <Accordion type="single" collapsible className="space-y-3">
        {FAQS.map((f, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="bg-crochic-ivory border border-crochic-blush px-6"
          >
            <AccordionTrigger className="text-left font-display text-xl hover:text-crochic-rose">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-crochic-muted leading-relaxed">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
