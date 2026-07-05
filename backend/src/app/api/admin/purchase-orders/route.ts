import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseOrders, suppliers, medicines, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;
  if (user.role !== "admin" && user.role !== "pharmacist") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await db
      .select({
        id: purchaseOrders.id,
        quantity: purchaseOrders.quantity,
        unitCost: purchaseOrders.unitCost,
        totalCost: purchaseOrders.totalCost,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        expectedDelivery: purchaseOrders.expectedDelivery,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          contactEmail: suppliers.email,
        },
        medicine: {
          id: medicines.id,
          name: medicines.name,
          sku: medicines.sku,
          stock: medicines.stock,
        },
        createdBy: {
          id: users.id,
          name: users.name,
        }
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .leftJoin(medicines, eq(purchaseOrders.medicineId, medicines.id))
      .leftJoin(users, eq(purchaseOrders.createdBy, users.id))
      .orderBy(desc(purchaseOrders.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;
  if (user.role !== "admin" && user.role !== "pharmacist") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { supplierId, medicineId, quantity, unitCost, notes, expectedDelivery } = body;

    if (!supplierId || !medicineId || !quantity || !unitCost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const totalCost = (parseFloat(unitCost) * parseInt(quantity)).toString();

    const [po] = await db.insert(purchaseOrders).values({
      supplierId: parseInt(supplierId),
      medicineId: parseInt(medicineId),
      quantity: parseInt(quantity),
      unitCost: parseFloat(unitCost).toString(),
      totalCost,
      status: "draft",
      notes,
      expectedDelivery: expectedDelivery || null,
      createdBy: user.userId,
    }).returning();

    return NextResponse.json({ message: "Purchase order created", purchaseOrder: po }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
