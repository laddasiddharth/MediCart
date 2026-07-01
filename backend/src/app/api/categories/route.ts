import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, medicines } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireRole } from "@/lib/middleware";

export async function GET() {
  try {
    const data = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        icon: categories.icon,
        medicineCount: sql<number>`count(${medicines.id})`,
      })
      .from(categories)
      .leftJoin(medicines, eq(medicines.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.description, categories.icon)
      .orderBy(categories.name);

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = requireRole(req, ["admin"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const [category] = await db.insert(categories).values(body).returning();
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
