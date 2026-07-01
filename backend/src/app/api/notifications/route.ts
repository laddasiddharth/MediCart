import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, medicines } from "@/db/schema";
import { eq, and, desc, sql, lt, lte, gte } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    // Generate system notifications for admin/pharmacist
    if (user.role === "admin" || user.role === "pharmacist") {
      const todayStr = new Date().toISOString().split("T")[0];
      const in30Str = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const [lowStock, expiring] = await Promise.all([
        db
          .select({ id: medicines.id, name: medicines.name, stock: medicines.stock })
          .from(medicines)
          .where(and(eq(medicines.isActive, true), sql`${medicines.stock} <= ${medicines.minStockLevel}`))
          .limit(5),
        db
          .select({ id: medicines.id, name: medicines.name, expiryDate: medicines.expiryDate })
          .from(medicines)
          .where(
            and(
              eq(medicines.isActive, true),
              gte(medicines.expiryDate, todayStr),
              lte(medicines.expiryDate, in30Str)
            )
          )
          .limit(5),
      ]);

      const systemNotifications = [
        ...lowStock.map((m) => ({
          id: `sys-low-${m.id}`,
          title: "Low Stock Alert",
          message: `${m.name} has only ${m.stock} units remaining`,
          type: "warning",
          isRead: false,
          createdAt: new Date().toISOString(),
          isSystem: true,
        })),
        ...expiring.map((m) => ({
          id: `sys-exp-${m.id}`,
          title: "Expiry Alert",
          message: `${m.name} expires on ${m.expiryDate}`,
          type: "danger",
          isRead: false,
          createdAt: new Date().toISOString(),
          isSystem: true,
        })),
      ];

      return NextResponse.json(systemNotifications);
    }

    const data = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const [notification] = await db.insert(notifications).values(body).returning();
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
