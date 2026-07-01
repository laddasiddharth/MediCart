import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, medicines, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id } = await params;
    const [order] = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        discountAmount: orders.discountAmount,
        taxAmount: orders.taxAmount,
        deliveryCharge: orders.deliveryCharge,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        deliveryAddress: orders.deliveryAddress,
        deliveryCity: orders.deliveryCity,
        deliveryState: orders.deliveryState,
        deliveryPincode: orders.deliveryPincode,
        estimatedDelivery: orders.estimatedDelivery,
        notes: orders.notes,
        orderDate: orders.orderDate,
        updatedAt: orders.updatedAt,
        prescriptionId: orders.prescriptionId,
        customerName: users.name,
        customerEmail: users.email,
        customerPhone: users.phone,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, parseInt(id)));

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow admins/pharmacists or the order owner
    if (user.role === "customer" && order.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const items = await db
      .select({
        id: orderItems.id,
        medicineId: orderItems.medicineId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        discountPercent: orderItems.discountPercent,
        totalPrice: orderItems.totalPrice,
        medicineName: medicines.name,
        medicineImage: medicines.imageUrl,
        medicineBrand: medicines.brand,
        medicineGenericName: medicines.genericName,
      })
      .from(orderItems)
      .leftJoin(medicines, eq(orderItems.medicineId, medicines.id))
      .where(eq(orderItems.orderId, parseInt(id)));

    return NextResponse.json({ ...order, items });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id } = await params;
    const body = await req.json();

    // Customers can only cancel their own orders
    if (user.role === "customer") {
      const [order] = await db.select().from(orders).where(eq(orders.id, parseInt(id)));
      if (!order || order.userId !== user.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (body.status !== "cancelled") {
        return NextResponse.json({ error: "Customers can only cancel orders" }, { status: 403 });
      }
    }

    const [updated] = await db
      .update(orders)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(orders.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
