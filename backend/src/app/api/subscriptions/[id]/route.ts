import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
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
    const { status, frequency, address, quantity } = body;

    const existing = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.userId)));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (frequency) updateData.frequency = frequency;
    if (address) updateData.address = address;
    if (quantity) updateData.quantity = quantity;
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, id))
      .returning();

    return NextResponse.json({ message: "Subscription updated", subscription: updated });
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
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.userId)));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Instead of actual delete, we just cancel it
    await db
      .update(subscriptions)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(subscriptions.id, id));

    return NextResponse.json({ message: "Subscription cancelled" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
