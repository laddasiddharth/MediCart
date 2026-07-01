import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, medicines } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

async function getOrCreateCart(userId: number) {
  const [existing] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (existing) return existing;
  const [newCart] = await db.insert(carts).values({ userId }).returning();
  return newCart;
}

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const cart = await getOrCreateCart(user.userId);
    const items = await db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        medicineId: cartItems.medicineId,
        quantity: cartItems.quantity,
        prescriptionId: cartItems.prescriptionId,
        medicineName: medicines.name,
        medicinePrice: medicines.price,
        medicineDiscount: medicines.discountPercent,
        medicineImage: medicines.imageUrl,
        medicinePrescriptionRequired: medicines.prescriptionRequired,
        medicineStock: medicines.stock,
        medicineBrand: medicines.brand,
      })
      .from(cartItems)
      .leftJoin(medicines, eq(cartItems.medicineId, medicines.id))
      .where(eq(cartItems.cartId, cart.id));

    return NextResponse.json({ cartId: cart.id, items });
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
    const { medicineId, quantity = 1, prescriptionId } = await req.json();
    const cart = await getOrCreateCart(user.userId);

    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.medicineId, medicineId)))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return NextResponse.json(updated);
    }

    const [item] = await db
      .insert(cartItems)
      .values({ cartId: cart.id, medicineId, quantity, prescriptionId })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { itemId, quantity } = await req.json();
    if (quantity <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, itemId));
      return NextResponse.json({ deleted: true });
    }
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, itemId))
      .returning();
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return NextResponse.json({ error: "Item ID required" }, { status: 400 });

    await db.delete(cartItems).where(eq(cartItems.id, parseInt(itemId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
