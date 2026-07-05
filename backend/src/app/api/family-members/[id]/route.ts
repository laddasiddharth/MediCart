import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { familyMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const { name, relation, dateOfBirth, bloodGroup, allergies, medicalHistory } = body;

    const existing = await db
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.id, id), eq(familyMembers.userId, user.userId)));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Family member not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (relation !== undefined) updateData.relation = relation;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (medicalHistory !== undefined) updateData.medicalHistory = medicalHistory;

    const [updated] = await db
      .update(familyMembers)
      .set(updateData)
      .where(eq(familyMembers.id, id))
      .returning();

    return NextResponse.json({ message: "Family member updated", member: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const existing = await db
      .select()
      .from(familyMembers)
      .where(and(eq(familyMembers.id, id), eq(familyMembers.userId, user.userId)));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Family member not found" }, { status: 404 });
    }

    await db.delete(familyMembers).where(eq(familyMembers.id, id));

    return NextResponse.json({ message: "Family member deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
