import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reminders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const data = await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, user.userId))
      .orderBy(desc(reminders.createdAt));

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
    const { medicineId, medicineName, dosage, reminderTime, daysOfWeek, note } = body;

    if (!medicineName || !reminderTime || !daysOfWeek) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [reminder] = await db.insert(reminders).values({
      userId: user.userId,
      medicineId: medicineId || null,
      medicineName,
      dosage,
      reminderTime,
      daysOfWeek,
      note,
      isActive: true,
    }).returning();

    return NextResponse.json({ message: "Reminder created", reminder }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
