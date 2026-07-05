import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseOrders, medicines } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;
  if (user.role !== "admin" && user.role !== "pharmacist") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const { status, notes, expectedDelivery } = body;

    const existing = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    const currentPo = existing[0];

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (expectedDelivery !== undefined) updateData.expectedDelivery = expectedDelivery;
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(purchaseOrders)
      .set(updateData)
      .where(eq(purchaseOrders.id, id))
      .returning();

    // If status changes to completed/received, we could auto-update stock
    if (status === "received" && currentPo.status !== "received") {
      if (currentPo.medicineId) {
        const med = await db.select().from(medicines).where(eq(medicines.id, currentPo.medicineId));
        if (med.length > 0) {
          await db.update(medicines)
            .set({ stock: med[0].stock + currentPo.quantity })
            .where(eq(medicines.id, currentPo.medicineId));
        }
      }
    }

    return NextResponse.json({ message: "Purchase order updated", purchaseOrder: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
    return NextResponse.json({ message: "Purchase order deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
