import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { medicines, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [medicine] = await db
      .select({
        id: medicines.id,
        name: medicines.name,
        genericName: medicines.genericName,
        brand: medicines.brand,
        categoryId: medicines.categoryId,
        supplierId: medicines.supplierId,
        description: medicines.description,
        dosage: medicines.dosage,
        sideEffects: medicines.sideEffects,
        ingredients: medicines.ingredients,
        manufacturer: medicines.manufacturer,
        sku: medicines.sku,
        batchNumber: medicines.batchNumber,
        barcode: medicines.barcode,
        price: medicines.price,
        discountPercent: medicines.discountPercent,
        purchasePrice: medicines.purchasePrice,
        stock: medicines.stock,
        minStockLevel: medicines.minStockLevel,
        manufacturingDate: medicines.manufacturingDate,
        expiryDate: medicines.expiryDate,
        prescriptionRequired: medicines.prescriptionRequired,
        isActive: medicines.isActive,
        imageUrl: medicines.imageUrl,
        rating: medicines.rating,
        reviewCount: medicines.reviewCount,
        createdAt: medicines.createdAt,
        updatedAt: medicines.updatedAt,
        categoryName: categories.name,
      })
      .from(medicines)
      .leftJoin(categories, eq(medicines.categoryId, categories.id))
      .where(eq(medicines.id, parseInt(id)));

    if (!medicine) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    return NextResponse.json(medicine);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireRole(req, ["admin", "pharmacist"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await req.json();
    const [updated] = await db
      .update(medicines)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(medicines.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireRole(req, ["admin"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    await db.update(medicines).set({ isActive: false }).where(eq(medicines.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
