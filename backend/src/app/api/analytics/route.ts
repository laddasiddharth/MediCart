import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, medicines, users, prescriptions, inventoryLogs } from "@/db/schema";
import { eq, gte, lte, and, sql, desc, count, sum, lt } from "drizzle-orm";
import { requireRole } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const authResult = requireRole(req, ["admin", "pharmacist"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const todayStr = startOfDay.toISOString().split("T")[0];
    const monthStr = startOfMonth.toISOString().split("T")[0];
    const yearStr = startOfYear.toISOString().split("T")[0];
    const in30Str = in30Days.toISOString().split("T")[0];
    const in60Str = in60Days.toISOString().split("T")[0];
    const in90Str = in90Days.toISOString().split("T")[0];
    const todayDateStr = now.toISOString().split("T")[0];

    const [
      totalRevenue,
      todayOrders,
      monthRevenue,
      pendingPrescriptions,
      totalUsers,
      lowStockMeds,
      expiredMeds,
      expiring30,
      expiring60,
      expiring90,
      totalInventoryValue,
      recentOrders,
      topMedicines,
      monthlySales,
      categoryRevenue,
    ] = await Promise.all([
      // Total revenue (all time)
      db
        .select({ total: sql<string>`COALESCE(sum(${orders.totalAmount}), 0)` })
        .from(orders)
        .where(eq(orders.paymentStatus, "paid")),

      // Today's orders
      db
        .select({ count: count() })
        .from(orders)
        .where(gte(orders.orderDate, startOfDay)),

      // This month revenue
      db
        .select({ total: sql<string>`COALESCE(sum(${orders.totalAmount}), 0)` })
        .from(orders)
        .where(and(gte(orders.orderDate, startOfMonth), eq(orders.paymentStatus, "paid"))),

      // Pending prescriptions
      db
        .select({ count: count() })
        .from(prescriptions)
        .where(eq(prescriptions.status, "pending")),

      // Total active users
      db.select({ count: count() }).from(users).where(eq(users.role, "customer")),

      // Low stock medicines
      db
        .select({ count: count() })
        .from(medicines)
        .where(and(eq(medicines.isActive, true), sql`${medicines.stock} <= ${medicines.minStockLevel}`)),

      // Expired medicines
      db
        .select({ count: count() })
        .from(medicines)
        .where(and(eq(medicines.isActive, true), lt(medicines.expiryDate, todayDateStr))),

      // Expiring within 30 days
      db
        .select({ count: count() })
        .from(medicines)
        .where(
          and(
            eq(medicines.isActive, true),
            gte(medicines.expiryDate, todayDateStr),
            lte(medicines.expiryDate, in30Str)
          )
        ),

      // Expiring within 60 days
      db
        .select({ count: count() })
        .from(medicines)
        .where(
          and(
            eq(medicines.isActive, true),
            gte(medicines.expiryDate, todayDateStr),
            lte(medicines.expiryDate, in60Str)
          )
        ),

      // Expiring within 90 days
      db
        .select({ count: count() })
        .from(medicines)
        .where(
          and(
            eq(medicines.isActive, true),
            gte(medicines.expiryDate, todayDateStr),
            lte(medicines.expiryDate, in90Str)
          )
        ),

      // Total inventory value
      db
        .select({
          total: sql<string>`COALESCE(sum(${medicines.price}::numeric * ${medicines.stock}), 0)`,
        })
        .from(medicines)
        .where(eq(medicines.isActive, true)),

      // Recent orders
      db
        .select({
          id: orders.id,
          status: orders.status,
          totalAmount: orders.totalAmount,
          paymentMethod: orders.paymentMethod,
          orderDate: orders.orderDate,
          customerName: users.name,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .orderBy(desc(orders.orderDate))
        .limit(10),

      // Top selling medicines (last 30 days)
      db
        .select({
          medicineId: orderItems.medicineId,
          medicineName: medicines.name,
          totalQuantity: sql<number>`sum(${orderItems.quantity})`,
          totalRevenue: sql<string>`sum(${orderItems.totalPrice})`,
        })
        .from(orderItems)
        .leftJoin(medicines, eq(orderItems.medicineId, medicines.id))
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .where(gte(orders.orderDate, startOfMonth))
        .groupBy(orderItems.medicineId, medicines.name)
        .orderBy(desc(sql`sum(${orderItems.quantity})`))
        .limit(5),

      // Monthly sales for last 6 months
      db.execute(sql`
        SELECT 
          TO_CHAR(order_date, 'Mon YYYY') as month,
          TO_CHAR(order_date, 'YYYY-MM') as month_key,
          COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE order_date >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(order_date, 'Mon YYYY'), TO_CHAR(order_date, 'YYYY-MM')
        ORDER BY month_key ASC
      `),

      // Category revenue
      db.execute(sql`
        SELECT 
          c.name as category,
          COALESCE(SUM(oi.total_price), 0) as revenue,
          COUNT(DISTINCT o.id) as orders
        FROM categories c
        LEFT JOIN medicines m ON m.category_id = c.id
        LEFT JOIN order_items oi ON oi.medicine_id = m.id
        LEFT JOIN orders o ON o.id = oi.order_id
        GROUP BY c.name
        ORDER BY revenue DESC
        LIMIT 8
      `),
    ]);

    return NextResponse.json({
      overview: {
        totalRevenue: parseFloat(totalRevenue[0]?.total || "0"),
        todayOrders: todayOrders[0]?.count || 0,
        monthRevenue: parseFloat(monthRevenue[0]?.total || "0"),
        pendingPrescriptions: pendingPrescriptions[0]?.count || 0,
        totalUsers: totalUsers[0]?.count || 0,
        lowStockCount: lowStockMeds[0]?.count || 0,
        inventoryValue: parseFloat(totalInventoryValue[0]?.total || "0"),
      },
      expiry: {
        expired: expiredMeds[0]?.count || 0,
        expiring30: expiring30[0]?.count || 0,
        expiring60: expiring60[0]?.count || 0,
        expiring90: expiring90[0]?.count || 0,
      },
      recentOrders,
      topMedicines,
      monthlySales: monthlySales.rows,
      categoryRevenue: categoryRevenue.rows,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
