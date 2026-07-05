import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, medicines, categories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const data = await db
      .select({
        id: subscriptions.id,
        quantity: subscriptions.quantity,
        frequency: subscriptions.frequency,
        status: subscriptions.status,
        nextDeliveryDate: subscriptions.nextDeliveryDate,
        createdAt: subscriptions.createdAt,
        medicine: {
          id: medicines.id,
          name: medicines.name,
          brand: medicines.brand,
          price: medicines.price,
          discountPercent: medicines.discountPercent,
          imageUrl: medicines.imageUrl,
          stock: medicines.stock,
          prescriptionRequired: medicines.prescriptionRequired,
          categoryName: categories.name,
        }
      })
      .from(subscriptions)
      .leftJoin(medicines, eq(subscriptions.medicineId, medicines.id))
      .leftJoin(categories, eq(medicines.categoryId, categories.id))
      .where(eq(subscriptions.userId, user.userId))
      .orderBy(desc(subscriptions.createdAt));

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

  try {
    const body = await req.json();
    const { medicineId, quantity, frequency, address, paymentMethod } = body;

    if (!medicineId || !quantity || !frequency || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Calculate next delivery date based on frequency
    const today = new Date();
    let nextDelivery = new Date(today);
    switch (frequency) {
      case "weekly":
        nextDelivery.setDate(today.getDate() + 7);
        break;
      case "monthly":
        nextDelivery.setMonth(today.getMonth() + 1);
        break;
      case "bimonthly":
        nextDelivery.setMonth(today.getMonth() + 2);
        break;
      case "quarterly":
        nextDelivery.setMonth(today.getMonth() + 3);
        break;
      default:
        nextDelivery.setMonth(today.getMonth() + 1);
    }

    const nextDeliveryStr = nextDelivery.toISOString().split("T")[0];

    const [subscription] = await db.insert(subscriptions).values({
      userId: user.userId,
      medicineId,
      quantity,
      frequency,
      address,
      paymentMethod: paymentMethod || "cash_on_delivery",
      status: "active",
      nextDeliveryDate: nextDeliveryStr,
    }).returning();

    return NextResponse.json({ message: "Subscription created", subscription }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
