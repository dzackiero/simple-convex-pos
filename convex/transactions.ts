import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    customerName: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    let query = ctx.db.query("sales");

    // Apply filters
    if (args.startDate || args.endDate || args.paymentMethod || args.customerName) {
      query = query.filter((q) => {
        let conditions = [];

        if (args.startDate) {
          conditions.push(q.gte(q.field("_creationTime"), args.startDate));
        }
        if (args.endDate) {
          conditions.push(q.lte(q.field("_creationTime"), args.endDate));
        }
        if (args.paymentMethod) {
          conditions.push(q.eq(q.field("paymentMethod"), args.paymentMethod));
        }
        if (args.customerName) {
          conditions.push(q.eq(q.field("customerName"), args.customerName));
        }

        return conditions.length > 1 ? q.and(...conditions) : conditions[0];
      });
    }

    const sales = await query
      .order("desc")
      .take((args.limit || 20) + (args.offset || 0));

    // Skip offset items
    const paginatedSales = sales.slice(args.offset || 0);

    const salesWithDetails = await Promise.all(
      paginatedSales.map(async (sale) => {
        const items = await ctx.db
          .query("saleItems")
          .withIndex("by_sale", (q) => q.eq("saleId", sale._id))
          .collect();
        
        const cashier = await ctx.db.get(sale.cashierId);
        
        return {
          ...sale,
          items,
          cashierName: cashier?.name || cashier?.email || "Unknown",
        };
      })
    );

    return salesWithDetails;
  },
});

export const stats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    let query = ctx.db.query("sales");

    if (args.startDate || args.endDate) {
      query = query.filter((q) => {
        let conditions = [];
        if (args.startDate) {
          conditions.push(q.gte(q.field("_creationTime"), args.startDate));
        }
        if (args.endDate) {
          conditions.push(q.lte(q.field("_creationTime"), args.endDate));
        }
        return conditions.length > 1 ? q.and(...conditions) : conditions[0];
      });
    }

    const sales = await query.collect();

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalHpp = sales.reduce((sum, sale) => sum + (sale.totalHpp || 0), 0);
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const totalTransactions = sales.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Payment method breakdown
    const paymentMethods = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      totalHpp,
      totalProfit,
      totalTransactions,
      averageTransaction,
      paymentMethods,
    };
  },
});
