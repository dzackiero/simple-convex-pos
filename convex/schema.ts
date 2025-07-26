import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  products: defineTable({
    name: v.string(),
    price: v.number(),
    hpp: v.optional(v.number()), // Harga Pokok Penjualan
    stock: v.number(),
    category: v.string(),
    isActive: v.boolean(),
    userId: v.optional(v.id("users")),
  })
    .index("by_category", ["category"])
    .index("by_user", ["userId"])
    .index("by_user_and_category", ["userId", "category"]),

  sales: defineTable({
    total: v.number(),
    totalHpp: v.optional(v.number()),
    profit: v.optional(v.number()),
    paymentMethod: v.string(), // "cash" | "card" | "transfer"
    cashierId: v.id("users"),
    customerName: v.optional(v.string()),
  }).index("by_cashier", ["cashierId"]),

  saleItems: defineTable({
    saleId: v.id("sales"),
    productId: v.id("products"),
    productName: v.string(),
    quantity: v.number(),
    price: v.number(),
    hpp: v.optional(v.number()),
    subtotal: v.number(),
    hppTotal: v.optional(v.number()),
  }).index("by_sale", ["saleId"]),

  userSettings: defineTable({
    userId: v.id("users"),
    businessName: v.string(),
    businessAddress: v.string(),
    businessPhone: v.string(),
    qrImageId: v.optional(v.id("_storage")),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
