import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, cartItems, carts, medicines, users, prescriptions } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const status = searchParams.get("status");

    const isAdmin = user.role === "admin" || user.role === "pharmacist";
    const conditions = isAdmin ? [] : [eq(orders.userId, user.userId)];
    if (status) conditions.push(eq(orders.status, status as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
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
          orderDate: orders.orderDate,
          updatedAt: orders.updatedAt,
          customerName: users.name,
          customerEmail: users.email,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(whereClause)
        .orderBy(desc(orders.orderDate))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(whereClause),
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
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const {
      paymentMethod,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryPincode,
      prescriptionId,
      notes,
      items,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    let totalAmount = 0;
    let discountAmount = 0;
    let requiresPrescription = false;
    const orderItemsData = [];

    for (const item of items) {
      const [medicine] = await db.select().from(medicines).where(eq(medicines.id, item.medicineId));
      if (!medicine) continue;

      const discount = parseFloat(medicine.discountPercent || "0");
      const price = parseFloat(medicine.price);
      const discountedPrice = price * (1 - discount / 100);
      const total = discountedPrice * item.quantity;
      const discountOnItem = (price - discountedPrice) * item.quantity;

      totalAmount += total;
      discountAmount += discountOnItem;

      if (medicine.prescriptionRequired) {
        requiresPrescription = true;
      }

      orderItemsData.push({
        medicineId: item.medicineId,
        quantity: item.quantity,
        unitPrice: medicine.price,
        discountPercent: medicine.discountPercent || "0",
        totalPrice: total.toFixed(2),
      });
    }

    const taxAmount = totalAmount * 0.05;
    const deliveryCharge = totalAmount > 500 ? 0 : 40;
    const finalAmount = totalAmount + taxAmount + deliveryCharge;

    if (requiresPrescription) {
      if (!prescriptionId) {
        return NextResponse.json({ error: "Prescription required for one or more items." }, { status: 400 });
      }
      const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, prescriptionId));
      if (!prescription || prescription.userId !== user.userId) {
        return NextResponse.json({ error: "Invalid prescription." }, { status: 400 });
      }
      if (prescription.status !== "approved") {
        return NextResponse.json({ error: "Your prescription must be approved to place this order." }, { status: 400 });
      }
    }

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const [order] = await db
      .insert(orders)
      .values({
        userId: user.userId,
        status: "confirmed",
        totalAmount: finalAmount.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        deliveryCharge: deliveryCharge.toFixed(2),
        paymentMethod: paymentMethod || "cash_on_delivery",
        paymentStatus: paymentMethod === "cash_on_delivery" ? "pending" : "paid",
        deliveryAddress,
        deliveryCity,
        deliveryState,
        deliveryPincode,
        prescriptionId,
        notes,
        estimatedDelivery: estimatedDelivery.toISOString().split("T")[0],
      })
      .returning();

    // Insert order items
    for (const item of orderItemsData) {
      await db.insert(orderItems).values({ orderId: order.id, ...item });
    }

    // Update stock
    for (const item of items) {
      const [medicine] = await db.select().from(medicines).where(eq(medicines.id, item.medicineId));
      if (medicine) {
        await db
          .update(medicines)
          .set({ stock: Math.max(0, medicine.stock - item.quantity) })
          .where(eq(medicines.id, item.medicineId));
      }
    }

    // Clear cart
    const [cart] = await db.select().from(carts).where(eq(carts.userId, user.userId)).limit(1);
    if (cart) {
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
