import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    let query = ctx.db.query("products")
      .filter((q) => q.and(
        q.eq(q.field("isActive"), true),
        q.or(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("userId"), undefined)
        )
      ));
    
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    return await query.collect();
  },
});

export const categories = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const products = await ctx.db.query("products")
      .filter((q) => q.and(
        q.eq(q.field("isActive"), true),
        q.or(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("userId"), undefined)
        )
      ))
      .collect();
    
    const categorySet = new Set(products.map(p => p.category));
    return Array.from(categorySet);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    price: v.number(),
    hpp: v.optional(v.number()),
    stock: v.number(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("products", {
      ...args,
      userId,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    productId: v.id("products"),
    name: v.string(),
    price: v.number(),
    hpp: v.optional(v.number()),
    stock: v.number(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.userId && product.userId !== userId) {
      throw new Error("Unauthorized to edit this product");
    }

    await ctx.db.patch(args.productId, {
      name: args.name,
      price: args.price,
      hpp: args.hpp,
      stock: args.stock,
      category: args.category,
    });
  },
});

export const remove = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.userId && product.userId !== userId) {
      throw new Error("Unauthorized to delete this product");
    }

    await ctx.db.patch(args.productId, {
      isActive: false,
    });
  },
});

export const updateStock = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.userId && product.userId !== userId) {
      throw new Error("Unauthorized to update this product");
    }

    const newStock = product.stock - args.quantity;
    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    await ctx.db.patch(args.productId, {
      stock: newStock,
    });
  },
});
