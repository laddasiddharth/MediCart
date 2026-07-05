import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { medicines, categories } from "@/db/schema";
import { eq, ilike, and, gte, lte, or, desc, asc, sql } from "drizzle-orm";
import { requireRole } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const prescriptionRequired = searchParams.get("prescriptionRequired");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;
    const inStock = searchParams.get("inStock");

    const conditions = [eq(medicines.isActive, true)];

    if (search) {
      conditions.push(
        or(
          ilike(medicines.name, `%${search}%`),
          ilike(medicines.genericName, `%${search}%`),
          ilike(medicines.brand, `%${search}%`)
        )!
      );
    }

    if (categoryId) conditions.push(eq(medicines.categoryId, parseInt(categoryId)));
    if (prescriptionRequired === "true") conditions.push(eq(medicines.prescriptionRequired, true));
    if (prescriptionRequired === "false") conditions.push(eq(medicines.prescriptionRequired, false));
    if (minPrice) conditions.push(gte(medicines.price, minPrice));
    if (maxPrice) conditions.push(lte(medicines.price, maxPrice));
    if (inStock === "true") conditions.push(gte(medicines.stock, 1));

    let orderExpr;
    if (sortBy === "price") {
      orderExpr = sortOrder === "desc" ? desc(medicines.price) : asc(medicines.price);
    } else if (sortBy === "rating") {
      orderExpr = desc(medicines.rating);
    } else if (sortBy === "newest") {
      orderExpr = desc(medicines.createdAt);
    } else {
      orderExpr = sortOrder === "desc" ? desc(medicines.name) : asc(medicines.name);
    }

    const whereClause = and(...conditions);

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: medicines.id,
          name: medicines.name,
          genericName: medicines.genericName,
          brand: medicines.brand,
          categoryId: medicines.categoryId,
          price: medicines.price,
          discountPercent: medicines.discountPercent,
          stock: medicines.stock,
          minStockLevel: medicines.minStockLevel,
          prescriptionRequired: medicines.prescriptionRequired,
          imageUrl: medicines.imageUrl,
          rating: medicines.rating,
          reviewCount: medicines.reviewCount,
          expiryDate: medicines.expiryDate,
          sku: medicines.sku,
          isActive: medicines.isActive,
          description: medicines.description,
          manufacturer: medicines.manufacturer,
          dosage: medicines.dosage,
          sideEffects: medicines.sideEffects,
          ingredients: medicines.ingredients,
          batchNumber: medicines.batchNumber,
          purchasePrice: medicines.purchasePrice,
          manufacturingDate: medicines.manufacturingDate,
          categoryName: categories.name,
        })
        .from(medicines)
        .leftJoin(categories, eq(medicines.categoryId, categories.id))
        .where(whereClause)
        .orderBy(orderExpr)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(medicines)
        .where(whereClause),
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

  try {
    const body = await req.json();
    const [medicine] = await db.insert(medicines).values(body).returning();
    return NextResponse.json(medicine, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
