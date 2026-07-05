import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wishlists, medicines, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const data = await db
      .select({
        id: wishlists.id,
        createdAt: wishlists.createdAt,
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
      .from(wishlists)
      .leftJoin(medicines, eq(wishlists.medicineId, medicines.id))
      .leftJoin(categories, eq(medicines.categoryId, categories.id))
      .where(eq(wishlists.userId, user.userId));

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
    const { medicineId } = body;

    if (!medicineId) {
      return NextResponse.json({ error: "Medicine ID is required" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, user.userId), eq(wishlists.medicineId, medicineId)));

    if (existing.length > 0) {
      // Remove if already exists (toggle)
      await db.delete(wishlists).where(eq(wishlists.id, existing[0].id));
      return NextResponse.json({ message: "Removed from wishlist", added: false });
    } else {
      // Add if doesn't exist
      const [wishlist] = await db.insert(wishlists).values({
        userId: user.userId,
        medicineId,
      }).returning();
      return NextResponse.json({ message: "Added to wishlist", added: true, wishlist });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(req.url);
    const medicineId = searchParams.get("medicineId");

    if (!medicineId) {
      return NextResponse.json({ error: "Medicine ID is required" }, { status: 400 });
    }

    await db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, user.userId), eq(wishlists.medicineId, parseInt(medicineId))));

    return NextResponse.json({ message: "Removed from wishlist" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
