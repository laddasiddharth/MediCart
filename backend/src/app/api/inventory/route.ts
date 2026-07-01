import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { medicines, inventoryLogs, categories } from "@/db/schema";
import { eq, and, lte, gte, lt, sql, SQL } from "drizzle-orm";
import { requireRole } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const authResult = requireRole(req, ["admin", "pharmacist"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const todayStr = new Date().toISOString().split("T")[0];
    const in90Str = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    let whereCondition: SQL | undefined = eq(medicines.isActive, true);

    if (filter === "low_stock") {
      whereCondition = and(
        eq(medicines.isActive, true),
        sql`${medicines.stock} <= ${medicines.minStockLevel}`
      );
    } else if (filter === "expiring") {
      whereCondition = and(
        eq(medicines.isActive, true),
        gte(medicines.expiryDate, todayStr),
        lte(medicines.expiryDate, in90Str)
      );
    } else if (filter === "expired") {
      whereCondition = and(
        eq(medicines.isActive, true),
        lt(medicines.expiryDate, todayStr)
      );
    }

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: medicines.id,
          name: medicines.name,
          brand: medicines.brand,
          sku: medicines.sku,
          batchNumber: medicines.batchNumber,
          categoryId: medicines.categoryId,
          categoryName: categories.name,
          stock: medicines.stock,
          minStockLevel: medicines.minStockLevel,
          expiryDate: medicines.expiryDate,
          manufacturingDate: medicines.manufacturingDate,
          price: medicines.price,
          purchasePrice: medicines.purchasePrice,
          prescriptionRequired: medicines.prescriptionRequired,
          isActive: medicines.isActive,
          updatedAt: medicines.updatedAt,
        })
        .from(medicines)
        .leftJoin(categories, eq(medicines.categoryId, categories.id))
        .where(whereCondition)
        .orderBy(medicines.name)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(medicines).where(whereCondition),
    ]);

    return NextResponse.json({
      data,
      total: Number(totalResult[0]?.count || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = requireRole(req, ["admin", "pharmacist"]);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const { medicineId, quantityAdded, quantityRemoved, reason } = body;

    const [medicine] = await db.select().from(medicines).where(eq(medicines.id, medicineId));
    if (!medicine) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    const newStock = medicine.stock + (quantityAdded || 0) - (quantityRemoved || 0);
    await db
      .update(medicines)
      .set({ stock: Math.max(0, newStock), updatedAt: new Date() })
      .where(eq(medicines.id, medicineId));

    const [log] = await db
      .insert(inventoryLogs)
      .values({
        medicineId,
        quantityAdded: quantityAdded || 0,
        quantityRemoved: quantityRemoved || 0,
        reason,
        performedBy: user.userId,
      })
      .returning();

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
