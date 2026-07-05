import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { familyMembers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const data = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, user.userId))
      .orderBy(desc(familyMembers.createdAt));

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
    const { name, relation, dateOfBirth, bloodGroup, allergies, medicalHistory } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [member] = await db.insert(familyMembers).values({
      userId: user.userId,
      name,
      relation,
      dateOfBirth: dateOfBirth || null,
      bloodGroup,
      allergies,
      medicalHistory,
    }).returning();

    return NextResponse.json({ message: "Family member added", member }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
