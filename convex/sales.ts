import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
    paymentMethod: v.string(),
    customerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Calculate total and validate stock
    let total = 0;
    let totalHpp = 0;
    const saleItems = [];

    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const subtotal = product.price * item.quantity;
      const hppTotal = (product.hpp || 0) * item.quantity;
      total += subtotal;
      totalHpp += hppTotal;

      saleItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        hpp: product.hpp,
        subtotal,
        hppTotal,
      });

      // Update stock
      await ctx.db.patch(item.productId, {
        stock: product.stock - item.quantity,
      });
    }

    // Create sale
    const profit = total - totalHpp;
    const saleId = await ctx.db.insert("sales", {
      total,
      totalHpp,
      profit,
      paymentMethod: args.paymentMethod,
      cashierId: userId,
      customerName: args.customerName,
    });

    // Create sale items
    for (const saleItem of saleItems) {
      await ctx.db.insert("saleItems", {
        saleId,
        ...saleItem,
      });
    }

    return saleId;
  },
});

export const todayStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const todaySales = await ctx.db
      .query("sales")
      .filter((q) => 
        q.and(
          q.gte(q.field("_creationTime"), todayStart),
          q.lt(q.field("_creationTime"), todayEnd)
        )
      )
      .collect();

    const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalHpp = todaySales.reduce((sum, sale) => sum + (sale.totalHpp || 0), 0);
    const totalProfit = todaySales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const totalTransactions = todaySales.length;

    return {
      totalRevenue,
      totalHpp,
      totalProfit,
      totalTransactions,
      averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
    };
  },
});

export const recentSales = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const sales = await ctx.db
      .query("sales")
      .order("desc")
      .take(args.limit || 10);

    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
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

    return salesWithItems;
  },
});

export const monthlyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const monthlySales = await ctx.db
      .query("sales")
      .filter((q) => 
        q.and(
          q.gte(q.field("_creationTime"), currentMonth.getTime()),
          q.lt(q.field("_creationTime"), nextMonth.getTime())
        )
      )
      .collect();

    const totalRevenue = monthlySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalHpp = monthlySales.reduce((sum, sale) => sum + (sale.totalHpp || 0), 0);
    const totalProfit = monthlySales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const totalTransactions = monthlySales.length;

    // Group by day for chart data
    const dailyStats: Record<string, { revenue: number; transactions: number; profit: number }> = {};
    
    monthlySales.forEach(sale => {
      const date = new Date(sale._creationTime).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { revenue: 0, transactions: 0, profit: 0 };
      }
      dailyStats[date].revenue += sale.total;
      dailyStats[date].transactions += 1;
      dailyStats[date].profit += (sale.profit || 0);
    });

    return {
      totalRevenue,
      totalHpp,
      totalProfit,
      totalTransactions,
      dailyStats,
    };
  },
});
