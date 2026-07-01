import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prescriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "@/lib/middleware";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireRole(req, ["admin", "pharmacist"]);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, remarks } = body;

    const [updated] = await db
      .update(prescriptions)
      .set({
        status,
        remarks,
        pharmacistId: user.userId,
        reviewedAt: new Date(),
      })
      .where(eq(prescriptions.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
