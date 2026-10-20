import { z } from "zod";
import { asc, desc, eq, sql, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  categories,
  customers,
  orderItems,
  orderStatusHistory,
  orders,
  productImages,
  products,
  siteSettings,
} from "@db/schema";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const productInput = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  categoryId: z.number(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().positive(),
  salePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  careInstructions: z.string().optional(),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  active: z.boolean().default(true),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  images: z.array(z.string()).default([]),
});

export const adminRouter = createRouter({
  /* ------------------------------ dashboard ------------------------------ */
  stats: adminQuery.query(async () => {
    const db = getDb();
    const [sales] = await db
      .select({
        total: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} <> 'cancelled' THEN ${orders.total} ELSE 0 END), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders);
    const [productCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products);
    const [customerCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(customers);
    const lowStock = await db.query.products.findMany({
      where: sql`${products.stock} <= 5`,
      orderBy: asc(products.stock),
      limit: 8,
      with: { images: true },
    });
    const recentOrders = await db.query.orders.findMany({
      orderBy: desc(orders.createdAt),
      limit: 8,
      with: { customer: true, items: true },
    });
    const topProducts = await db
      .select({
        name: orderItems.productName,
        qty: sql<number>`SUM(${orderItems.quantity})`,
        revenue: sql<string>`SUM(${orderItems.lineTotal})`,
      })
      .from(orderItems)
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(5);
    return {
      totalSales: sales.total,
      orderCount: sales.count,
      productCount: productCount.count,
      customerCount: customerCount.count,
      lowStock,
      recentOrders,
      topProducts,
    };
  }),

  /* ------------------------------ categories ----------------------------- */
  categories: adminQuery.query(async () =>
    getDb().query.categories.findMany({ orderBy: asc(categories.sortOrder) }),
  ),

  saveCategory: adminQuery
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string().min(2),
        description: z.string().optional(),
        image: z.string().optional(),
        active: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const slug = slugify(input.name);
      if (input.id) {
        await db
          .update(categories)
          .set({ ...input, slug, updatedAt: new Date() })
          .where(eq(categories.id, input.id));
        return { success: true, id: input.id };
      }
      const [row] = await db
        .insert(categories)
        .values({ ...input, slug })
        .$returningId();
      return { success: true, id: row.id };
    }),

  deleteCategory: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(categories).where(eq(categories.id, input.id));
      return { success: true };
    }),

  /* ------------------------------- products ------------------------------ */
  products: adminQuery
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const where = input.search
        ? or(
            like(products.name, `%${input.search}%`),
            like(products.sku, `%${input.search}%`),
          )
        : undefined;
      return db.query.products.findMany({
        where,
        orderBy: desc(products.createdAt),
        with: {
          images: { orderBy: asc(productImages.sortOrder) },
          category: true,
        },
      });
    }),

  product: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const p = await getDb().query.products.findFirst({
        where: eq(products.id, input.id),
        with: { images: { orderBy: asc(productImages.sortOrder) } },
      });
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      return p;
    }),

  saveProduct: adminQuery.input(productInput).mutation(async ({ input }) => {
    const db = getDb();
    const { images, ...data } = input;
    const slug = slugify(data.name);
    const values = {
      ...data,
      slug,
      price: data.price.toFixed(2),
      salePrice: data.salePrice != null ? data.salePrice.toFixed(2) : null,
      updatedAt: new Date(),
    };
    // NOTE: id omitted for insert — handled below
    const anyValues = values as typeof values & { id?: number };
    delete anyValues.id;
    const [row] = await db.insert(products).values(anyValues).$returningId();
    for (let i = 0; i < images.length; i++) {
      await db.insert(productImages).values({
        productId: row.id,
        url: images[i],
        sortOrder: i,
        isPrimary: i === 0,
      });
    }
    return { success: true, id: row.id };
  }),

  updateProduct: adminQuery
    .input(productInput.extend({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, images, ...data } = input;
      await db
        .update(products)
        .set({
          ...data,
          slug: slugify(data.name),
          price: data.price.toFixed(2),
          salePrice: data.salePrice != null ? data.salePrice.toFixed(2) : null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id));
      if (images.length > 0) {
        await db.delete(productImages).where(eq(productImages.productId, id));
        for (let i = 0; i < images.length; i++) {
          await db.insert(productImages).values({
            productId: id,
            url: images[i],
            sortOrder: i,
            isPrimary: i === 0,
          });
        }
      }
      return { success: true, id };
    }),

  deleteProduct: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),

  /* -------------------------------- orders ------------------------------- */
  orders: adminQuery
    .input(
      z.object({
        search: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const all = await db.query.orders.findMany({
        orderBy: desc(orders.createdAt),
        with: { customer: true, items: true },
      });
      return all.filter((o) => {
        if (input.status && input.status !== "all" && o.status !== input.status)
          return false;
        if (input.search) {
          const q = input.search.toLowerCase();
          return (
            o.orderNumber.toLowerCase().includes(q) ||
            o.customer?.name.toLowerCase().includes(q) ||
            o.customer?.email.toLowerCase().includes(q)
          );
        }
        return true;
      });
    }),

  order: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const order = await getDb().query.orders.findFirst({
        where: eq(orders.id, input.id),
        with: { customer: true, items: true },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      const history = await getDb().query.orderStatusHistory.findMany({
        where: eq(orderStatusHistory.orderId, order.id),
        orderBy: desc(orderStatusHistory.createdAt),
      });
      return { order, history };
    }),

  updateOrderStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          "pending",
          "confirmed",
          "preparing",
          "ready",
          "shipped",
          "delivered",
          "cancelled",
        ]),
        note: z.string().optional(),
        deliveryFee: z.number().min(0).max(100000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const existingOrder = await db.query.orders.findFirst({
        where: eq(orders.id, input.id),
      });

      if (!existingOrder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found.",
        });
      }

      const updates: {
        status: typeof input.status;
        updatedAt: Date;
        deliveryFee?: string;
        total?: string;
      } = {
        status: input.status,
        updatedAt: new Date(),
      };

      if (input.deliveryFee !== undefined) {
        updates.deliveryFee = input.deliveryFee.toFixed(2);
        updates.total = (
          Number(existingOrder.subtotal) + input.deliveryFee
        ).toFixed(2);
      }

      await db.update(orders).set(updates).where(eq(orders.id, input.id));

      await db.insert(orderStatusHistory).values({
        orderId: input.id,
        status: input.status,
        note:
          input.note ??
          (input.deliveryFee !== undefined
            ? `Delivery fee confirmed: ${input.deliveryFee.toFixed(2)}`
            : undefined),
      });

      return { success: true };
    }),

  /* ------------------------------ customers ------------------------------ */
  customers: adminQuery
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const all = await db.query.customers.findMany({
        orderBy: desc(customers.createdAt),
        with: { orders: true },
      });
      const q = input.search?.toLowerCase();
      return all
        .filter(
          (c) =>
            !q ||
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q),
        )
        .map((c) => ({
          ...c,
          orderCount: c.orders.length,
          totalSpent: c.orders
            .filter((o) => o.status !== "cancelled")
            .reduce((s, o) => s + Number(o.total), 0),
          lastOrder: c.orders[0]?.createdAt ?? null,
        }));
    }),

  updateCustomer: adminQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().trim().min(1).max(160),
        email: z.string().trim().email().max(320),
        phone: z.string().trim().max(60).nullable(),
        address: z.string().trim().max(300).nullable(),
        city: z.string().trim().max(120).nullable(),
        country: z.string().trim().max(120).nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const customer = await getDb().query.customers.findFirst({
        where: eq(customers.id, id),
        columns: { id: true },
      });
      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found.",
        });
      }

      await getDb()
        .update(customers)
        .set({
          ...data,
          email: data.email.toLowerCase(),
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          country: data.country || null,
        })
        .where(eq(customers.id, id));
      return { success: true };
    }),

  deleteCustomer: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const customer = await getDb().query.customers.findFirst({
        where: eq(customers.id, input.id),
        with: { orders: true },
      });
      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found.",
        });
      }
      if (customer.orders.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "This customer has order history and cannot be deleted. Edit their details instead.",
        });
      }

      await getDb().delete(customers).where(eq(customers.id, input.id));
      return { success: true };
    }),

  /* ------------------------------- settings ------------------------------ */
  settings: adminQuery.query(async () => {
    const rows = await getDb().select().from(siteSettings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
  }),

  saveSettings: adminQuery
    .input(z.record(z.string(), z.string()))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const [key, value] of Object.entries(input)) {
        await db
          .insert(siteSettings)
          .values({ key, value })
          .onDuplicateKeyUpdate({ set: { value } });
      }
      return { success: true };
    }),
});
