import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reminders } from "@/db/schema";
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
    const { isActive, medicineName, dosage, reminderTime, daysOfWeek, note } = body;

    const existing = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.userId, user.userId)));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (medicineName) updateData.medicineName = medicineName;
    if (dosage) updateData.dosage = dosage;
    if (reminderTime) updateData.reminderTime = reminderTime;
    if (daysOfWeek) updateData.daysOfWeek = daysOfWeek;
    if (note) updateData.note = note;

    const [updated] = await db
      .update(reminders)
      .set(updateData)
      .where(eq(reminders.id, id))
      .returning();

    return NextResponse.json({ message: "Reminder updated", reminder: updated });
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
      .from(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.userId, user.userId)));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    await db.delete(reminders).where(eq(reminders.id, id));

    return NextResponse.json({ message: "Reminder deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
