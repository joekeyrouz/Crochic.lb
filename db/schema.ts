import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  varchar,
  text,
  int,
  decimal,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export const adminLoginAttempts = mysqlTable("admin_login_attempts", {
  email: varchar("email", { length: 320 }).primaryKey(),
  attempts: int("attempts").default(0).notNull(),
  windowStartedAt: timestamp("windowStartedAt").notNull(),
  lockedUntil: timestamp("lockedUntil"),
});

export const emailLoginCodes = mysqlTable(
  "email_login_codes",
  {
    email: varchar("email", { length: 320 }).primaryKey(),
    codeHash: varchar("codeHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    attempts: int("attempts").default(0).notNull(),
    sends: int("sends").default(1).notNull(),
    windowStartedAt: timestamp("windowStartedAt").notNull(),
    sentAt: timestamp("sentAt").notNull(),
  },
  (t) => [index("email_login_codes_window_idx").on(t.windowStartedAt)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ------------------------------- CroChic ------------------------------- */

export const categories = mysqlTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    description: text("description"),
    image: varchar("image", { length: 500 }),
    active: boolean("active").default(true).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("categories_slug_unique").on(t.slug)],
);

export const products = mysqlTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    sku: varchar("sku", { length: 60 }).notNull(),
    categoryId: bigint("categoryId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    description: text("description"),
    shortDescription: varchar("shortDescription", { length: 400 }),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    salePrice: decimal("salePrice", { precision: 10, scale: 2 }),
    stock: int("stock").default(0).notNull(),
    materials: varchar("materials", { length: 400 }),
    dimensions: varchar("dimensions", { length: 200 }),
    careInstructions: text("careInstructions"),
    featured: boolean("featured").default(false).notNull(),
    isNew: boolean("isNew").default(false).notNull(),
    active: boolean("active").default(true).notNull(),
    seoTitle: varchar("seoTitle", { length: 200 }),
    seoDescription: varchar("seoDescription", { length: 400 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("products_slug_unique").on(t.slug),
    index("products_category_idx").on(t.categoryId),
    index("products_active_idx").on(t.active),
  ],
);

export const productImages = mysqlTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: bigint("productId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 500 }).notNull(),
    alt: varchar("alt", { length: 200 }),
    sortOrder: int("sortOrder").default(0).notNull(),
    isPrimary: boolean("isPrimary").default(false).notNull(),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const customers = mysqlTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 60 }),
    address: varchar("address", { length: 300 }),
    city: varchar("city", { length: 120 }),
    country: varchar("country", { length: 120 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("customers_email_idx").on(t.email)],
);

export const orders = mysqlTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: varchar("orderNumber", { length: 40 }).notNull(),
    customerId: bigint("customerId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => customers.id),
    status: mysqlEnum("status", [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "shipped",
      "delivered",
      "cancelled",
    ])
      .default("pending")
      .notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: varchar("paymentMethod", { length: 40 })
      .default("cod")
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("orders_number_unique").on(t.orderNumber),
    index("orders_customer_idx").on(t.customerId),
    index("orders_status_idx").on(t.status),
  ],
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: bigint("orderId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: bigint("productId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => products.id),
    productName: varchar("productName", { length: 200 }).notNull(),
    unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
    quantity: int("quantity").notNull(),
    lineTotal: decimal("lineTotal", { precision: 10, scale: 2 }).notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const orderStatusHistory = mysqlTable(
  "order_status_history",
  {
    id: serial("id").primaryKey(),
    orderId: bigint("orderId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 40 }).notNull(),
    note: varchar("note", { length: 300 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("order_status_history_order_idx").on(t.orderId)],
);

export const siteSettings = mysqlTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
});

export const newsletterSubscribers = mysqlTable(
  "newsletter_subscribers",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("newsletter_email_unique").on(t.email)],
);

export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  customerName: varchar("customerName", { length: 120 }).notNull(),
  review: text("review").notNull(),
  rating: int("rating").default(5).notNull(),
  approved: boolean("approved").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Review = typeof reviews.$inferSelect;
