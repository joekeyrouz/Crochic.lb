import { getDb } from "../api/queries/connection";
import {
  categories,
  products,
  productImages,
  siteSettings,
  reviews,
} from "./schema";

async function seed() {
  const db = getDb();

  const existing = await db.select().from(categories).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded — skipping.");
    return;
  }

  const catRows = await db
    .insert(categories)
    .values([
      {
        name: "Lip Balm Charms",
        slug: "lip-balm-charms",
        description:
          "Tiny crochet holders designed to carry your lip balm beautifully — clipped to your keys, your bag, your life.",
        image: "/images/products/lipbalm-rose.jpg",
        sortOrder: 1,
      },
      {
        name: "Little Bags",
        slug: "little-bags",
        description:
          "Small handmade crochet bags and pouches, stitched slowly and made to be loved daily.",
        image: "/images/products/sunflower-tote.jpg",
        sortOrder: 2,
      },
      {
        name: "Keychains & Charms",
        slug: "keychains-charms",
        description:
          "Cute crochet companions for your keys, bags and everyday little moments.",
        image: "/images/products/charm-set.jpg",
        sortOrder: 3,
      },
    ])
    .$returningId();

  const [lipBalm, bags, charms] = catRows.map((r) => r.id);

  const P = async (
    rows: (typeof products.$inferInsert)[],
    images: Record<string, string[]>,
  ) => {
    for (const row of rows) {
      const [{ id }] = await db.insert(products).values(row).$returningId();
      const imgs = images[row.slug] ?? [];
      for (let i = 0; i < imgs.length; i++) {
        await db.insert(productImages).values({
          productId: id,
          url: imgs[i],
          alt: row.name,
          sortOrder: i,
          isPrimary: i === 0,
        });
      }
    }
  };

  await P(
    [
      {
        name: "Rosé Lip Balm Holder",
        slug: "rose-lip-balm-holder",
        sku: "CC-LBH-001",
        categoryId: lipBalm,
        shortDescription: "A blush-pink crochet holder with a golden keyring.",
        description:
          "Hand-crocheted in a soft dusty-rose yarn, this little holder keeps your lip balm close and beautiful. Finished with a gold-tone keyring and a tiny matching charm — clip it to your keys, tote or gym bag.",
        price: "18.00",
        stock: 14,
        materials: "100% cotton yarn, gold-tone alloy keyring",
        dimensions: "11 cm × 3 cm",
        careInstructions: "Spot clean with cool water. Air dry flat.",
        featured: true,
        isNew: true,
        seoTitle: "Rosé Lip Balm Holder — Handmade Crochet | CroChic",
        seoDescription:
          "Handmade blush-pink crochet lip balm holder with golden keyring. Made slowly, made by hand.",
      },
      {
        name: "Sage & Rose Duo Holder",
        slug: "sage-rose-duo-holder",
        sku: "CC-LBH-002",
        categoryId: lipBalm,
        shortDescription: "Two-tone crochet holder in sage green and rose.",
        description:
          "A delicate two-tone holder pairing muted sage with warm rose. Every stitch is worked by hand, so no two pieces are exactly alike — yours will be quietly one of a kind.",
        price: "20.00",
        salePrice: "16.00",
        stock: 9,
        materials: "Cotton yarn, gold-tone alloy hardware",
        dimensions: "11 cm × 3 cm",
        careInstructions: "Spot clean only. Keep away from direct heat.",
        featured: true,
        seoTitle: "Sage & Rose Duo Lip Balm Holder | CroChic",
        seoDescription:
          "Two-tone handmade crochet lip balm holder in sage and rose.",
      },
      {
        name: "Little Bow Holder",
        slug: "little-bow-holder",
        sku: "CC-LBH-003",
        categoryId: lipBalm,
        shortDescription: "Blush holder finished with a tiny crochet bow.",
        description:
          "Our sweetest holder yet — a blush-pink case crowned with a hand-tied crochet bow. Small enough for any bag, charming enough to show off.",
        price: "22.00",
        stock: 7,
        materials: "Cotton yarn, gold-tone keyring",
        dimensions: "11 cm × 3.5 cm",
        careInstructions: "Hand wash cold, reshape while damp.",
        featured: true,
        isNew: true,
        seoTitle: "Little Bow Crochet Lip Balm Holder | CroChic",
        seoDescription: "Handmade crochet lip balm holder with a tiny bow.",
      },
      {
        name: "Mocha Everyday Holder",
        slug: "mocha-everyday-holder",
        sku: "CC-LBH-004",
        categoryId: lipBalm,
        shortDescription: "Warm cocoa-toned holder for every day.",
        description:
          "A warm mocha shade that goes with everything. Tightly stitched for durability and finished with our signature gold-tone ring.",
        price: "18.00",
        stock: 20,
        materials: "Cotton yarn, gold-tone alloy keyring",
        dimensions: "11 cm × 3 cm",
        careInstructions: "Spot clean with cool water.",
      },
    ],
    {
      "rose-lip-balm-holder": ["/images/products/lipbalm-rose.jpg"],
      "sage-rose-duo-holder": ["/images/products/lipbalm-duo.jpg"],
      "little-bow-holder": ["/images/products/lipbalm-bow.jpg"],
      "mocha-everyday-holder": ["/images/products/lipbalm-mocha.jpg"],
    },
  );

  await P(
    [
      {
        name: "Sunflower Mini Tote",
        slug: "sunflower-mini-tote",
        sku: "CC-BAG-001",
        categoryId: bags,
        shortDescription:
          "Hand-crocheted mini tote with granny-square sunflowers.",
        description:
          "A little piece of sunshine. This mini tote is built from hand-worked granny squares in sunflower gold and leaf green, lined and finished with soft handles. Carries your phone, cards and a little joy.",
        price: "58.00",
        stock: 4,
        materials: "Cotton yarn, cotton lining",
        dimensions: "22 cm × 18 cm × 6 cm",
        careInstructions: "Hand wash cold. Dry flat in shade.",
        featured: true,
        isNew: true,
        seoTitle: "Sunflower Mini Tote — Handmade Crochet Bag | CroChic",
        seoDescription:
          "Hand-crocheted mini tote with sunflower granny squares.",
      },
      {
        name: "Courtside Pouch",
        slug: "courtside-pouch",
        sku: "CC-BAG-002",
        categoryId: bags,
        shortDescription: "A petite drawstring pouch, made for golden hours.",
        description:
          "Inspired by slow afternoons and golden-hour light, the Courtside Pouch holds the essentials — lip balm, keys, cards — in one soft, hand-stitched place.",
        price: "34.00",
        salePrice: "28.00",
        stock: 6,
        materials: "Cotton yarn, wooden beads",
        dimensions: "16 cm × 12 cm",
        careInstructions: "Spot clean only.",
        featured: true,
      },
    ],
    {
      "sunflower-mini-tote": ["/images/products/sunflower-tote.jpg"],
      "courtside-pouch": [
        "/images/lifestyle/court-bag.jpg",
        "/images/lifestyle/banner-net.jpg",
      ],
    },
  );

  await P(
    [
      {
        name: "Falling Leaf Keychain",
        slug: "falling-leaf-keychain",
        sku: "CC-KEY-001",
        categoryId: charms,
        shortDescription: "A crocheted leaf charm in warm autumn tones.",
        description:
          "A little leaf that never falls far. Crocheted in warm brown and blush, this charm adds a soft handmade touch to keys, zips and bags.",
        price: "12.00",
        stock: 25,
        materials: "Cotton yarn, gold-tone alloy ring",
        dimensions: "7 cm × 4 cm",
        careInstructions: "Spot clean.",
        isNew: true,
      },
      {
        name: "The Charm Set",
        slug: "the-charm-set",
        sku: "CC-KEY-002",
        categoryId: charms,
        shortDescription: "A curated trio of mini crochet charms.",
        description:
          "Three tiny hand-crocheted charms — a bow, a leaf and a heart — in our signature palette. Keep one, gift two, or clip them all to your favourite bag.",
        price: "26.00",
        stock: 10,
        materials: "Cotton yarn, gold-tone hardware",
        dimensions: "approx. 6 cm each",
        careInstructions: "Spot clean.",
        featured: true,
      },
      {
        name: "Golden Hour Charms",
        slug: "golden-hour-charms",
        sku: "CC-KEY-003",
        categoryId: charms,
        shortDescription: "Photographed at golden hour, made for every hour.",
        description:
          "A small collection of hand-stitched charms photographed the way we love them best — outdoors, in warm evening light, on their way somewhere lovely.",
        price: "15.00",
        stock: 18,
        materials: "Cotton yarn, gold-tone alloy ring",
        dimensions: "varies",
        careInstructions: "Spot clean.",
      },
    ],
    {
      "falling-leaf-keychain": ["/images/products/keychain-leaf.jpg"],
      "the-charm-set": [
        "/images/products/charm-set.jpg",
        "/images/products/collection-flat.jpg",
      ],
      "golden-hour-charms": [
        "/images/lifestyle/keyrings-hand.jpg",
        "/images/lifestyle/racket-charm.jpg",
      ],
    },
  );

  await db.insert(siteSettings).values([
    { key: "brand_name", value: "CroChic" },
    { key: "tagline", value: "handmade with elegance" },
    {
      key: "announcement",
      value: "Handmade with love • New pieces coming soon",
    },
    { key: "currency", value: "USD" },
    { key: "whatsapp_number", value: "+96181081191" },
    { key: "instagram_url", value: "https://www.instagram.com/c.cro.chic/" },
    { key: "store_email", value: "crochic2@gmail.com" },
    { key: "delivery_enabled", value: "false" },
    {
      key: "delivery_message",
      value: "Online delivery is coming soon. Stay tuned.",
    },
    { key: "delivery_fee", value: "0" },
  ]);

  await db.insert(reviews).values([
    {
      customerName: "Salma R.",
      review:
        "The little bow holder is even prettier in person. You can tell every stitch was made with care — I get asked about it constantly.",
      rating: 5,
    },
    {
      customerName: "Yasmin K.",
      review:
        "Ordered the charm trio as gifts and ended up keeping one for myself. The packaging alone felt like a present.",
      rating: 5,
    },
    {
      customerName: "Nour A.",
      review:
        "My sunflower tote is my favourite thing I own. Soft, sturdy, and completely unique. Worth every stitch.",
      rating: 5,
    },
  ]);

  console.log("Seed complete: 3 categories, 8 products, settings, reviews.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
