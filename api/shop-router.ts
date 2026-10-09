import { z } from "zod";
import { and, asc, desc, eq, like, or, sql, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  categories,
  customers,
  newsletterSubscribers,
  orderItems,
  orderStatusHistory,
  orders,
  productImages,
  products,
  reviews,
  siteSettings,
} from "@db/schema";

const withImages = {
  images: { orderBy: asc(productImages.sortOrder) },
  category: true,
} as const;

async function getSettingsMap() {
  const rows = await getDb().select().from(siteSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
}

export const shopRouter = createRouter({
  settings: publicQuery.query(async () => getSettingsMap()),

  categories: publicQuery.query(async () => {
    return getDb().query.categories.findMany({
      where: eq(categories.active, true),
      orderBy: asc(categories.sortOrder),
    });
  }),

  products: publicQuery
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        onSale: z.boolean().optional(),
        isNew: z.boolean().optional(),
        inStock: z.boolean().optional(),
        featured: z.boolean().optional(),
        sort: z
          .enum(["newest", "price-asc", "price-desc", "name"])
          .default("newest"),
      }),
    )
    .query(async ({ input }) => {
      const conds = [eq(products.active, true)];
      if (input.category) {
        const cat = await getDb().query.categories.findFirst({
          where: eq(categories.slug, input.category),
        });
        if (!cat) return [];
        conds.push(eq(products.categoryId, cat.id));
      }
      if (input.search) {
        const q = `%${input.search}%`;
        conds.push(
          or(
            like(products.name, q),
            like(products.description, q),
            like(products.sku, q),
          )!,
        );
      }
      if (input.minPrice != null)
        conds.push(gte(products.price, String(input.minPrice)));
      if (input.maxPrice != null)
        conds.push(lte(products.price, String(input.maxPrice)));
      if (input.onSale) conds.push(sql`${products.salePrice} IS NOT NULL`);
      if (input.isNew) conds.push(eq(products.isNew, true));
      if (input.inStock) conds.push(gte(products.stock, 1));
      if (input.featured) conds.push(eq(products.featured, true));

      const orderBy =
        input.sort === "price-asc"
          ? asc(products.price)
          : input.sort === "price-desc"
            ? desc(products.price)
            : input.sort === "name"
              ? asc(products.name)
              : desc(products.createdAt);

      return getDb().query.products.findMany({
        where: and(...conds),
        orderBy,
        with: withImages,
      });
    }),

  productBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const product = await getDb().query.products.findFirst({
        where: and(eq(products.slug, input.slug), eq(products.active, true)),
        with: withImages,
      });
      if (!product)
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      const related = await getDb().query.products.findMany({
        where: and(
          eq(products.categoryId, product.categoryId),
          eq(products.active, true),
          sql`${products.id} <> ${product.id}`,
        ),
        limit: 4,
        with: withImages,
      });
      return { product, related };
    }),

  reviews: publicQuery.query(async () => {
    return getDb().query.reviews.findMany({
      where: eq(reviews.approved, true),
      orderBy: desc(reviews.createdAt),
    });
  }),

  subscribe: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      await getDb()
        .insert(newsletterSubscribers)
        .values({ email: input.email })
        .onDuplicateKeyUpdate({ set: { email: input.email } });
      return { success: true };
    }),

  checkout: publicQuery
    .input(
      z.object({
        customer: z.object({
          name: z.string().min(2),
          email: z.string().email(),
          phone: z.string().min(5),
          address: z.string().min(3),
          city: z.string().min(2),
          country: z.string().min(2),
          notes: z.string().optional(),
        }),
        items: z
          .array(z.object({ productId: z.number(), quantity: z.number().min(1) }))
          .min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const settings = await getSettingsMap();
      const deliveryEnabled = settings.delivery_enabled === "true";
      const deliveryFee = deliveryEnabled
        ? Number(settings.delivery_fee ?? 0)
        : 0;

      // Server-side trusted pricing & stock validation
      const ids = input.items.map((i) => i.productId);
      const dbProducts = await db.query.products.findMany({
        where: and(
          eq(products.active, true),
          sql`${products.id} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`,
        ),
      });
      if (dbProducts.length !== ids.length)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some items are no longer available.",
        });

      const lines = input.items.map((item) => {
        const p = dbProducts.find((d) => d.id === item.productId)!;
        if (p.stock < item.quantity)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `"${p.name}" has only ${p.stock} left in stock.`,
          });
        const unit = Number(p.salePrice ?? p.price);
        return { product: p, quantity: item.quantity, unit, total: unit * item.quantity };
      });

      const subtotal = lines.reduce((s, l) => s + l.total, 0);
      const total = subtotal + deliveryFee;
      const orderNumber = `CC-${Date.now().toString(36).toUpperCase()}`;

      const result = await db.transaction(async (tx) => {
        let customer = await tx.query.customers.findFirst({
          where: eq(customers.email, input.customer.email),
        });
        if (!customer) {
          const [row] = await tx
            .insert(customers)
            .values({
              name: input.customer.name,
              email: input.customer.email,
              phone: input.customer.phone,
              address: input.customer.address,
              city: input.customer.city,
              country: input.customer.country,
            })
            .$returningId();
          customer = await tx.query.customers.findFirst({
            where: eq(customers.id, row.id),
          });
        }

        const [{ id: orderId }] = await tx
          .insert(orders)
          .values({
            orderNumber,
            customerId: customer!.id,
            subtotal: subtotal.toFixed(2),
            deliveryFee: deliveryFee.toFixed(2),
            total: total.toFixed(2),
            paymentMethod: "cod",
            notes: input.customer.notes,
          })
          .$returningId();

        for (const line of lines) {
          await tx.insert(orderItems).values({
            orderId,
            productId: line.product.id,
            productName: line.product.name,
            unitPrice: line.unit.toFixed(2),
            quantity: line.quantity,
            lineTotal: line.total.toFixed(2),
          });
          await tx
            .update(products)
            .set({ stock: line.product.stock - line.quantity })
            .where(eq(products.id, line.product.id));
        }

        await tx.insert(orderStatusHistory).values({
          orderId,
          status: "pending",
          note: "Order placed — cash on delivery",
        });

        return { orderId, orderNumber };
      });

      return {
        success: true as const,
        orderNumber: result.orderNumber,
        orderId: result.orderId,
        total,
        deliveryEnabled,
        deliveryMessage: settings.delivery_message,
      };
    }),
});
