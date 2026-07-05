import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prescriptionMessages, prescriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    const { id } = await params;
    const prescriptionId = parseInt(id);
    const data = await db
      .select()
      .from(prescriptionMessages)
      .where(eq(prescriptionMessages.prescriptionId, prescriptionId))
      .orderBy(prescriptionMessages.createdAt);

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id } = await params;
    const prescriptionId = parseInt(id);
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const [newMsg] = await db.insert(prescriptionMessages).values({
      prescriptionId,
      senderId: user.userId,
      message,
    }).returning();

    return NextResponse.json({ message: "Message sent", data: newMsg }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
