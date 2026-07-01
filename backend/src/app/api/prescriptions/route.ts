import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prescriptions, users } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const status = searchParams.get("status");

    const isAdmin = user.role === "admin" || user.role === "pharmacist";
    const conditions = isAdmin ? [] : [eq(prescriptions.userId, user.userId)];
    if (status) conditions.push(eq(prescriptions.status, status as "pending" | "approved" | "rejected" | "needs_clarification"));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: prescriptions.id,
          userId: prescriptions.userId,
          fileUrl: prescriptions.fileUrl,
          fileName: prescriptions.fileName,
          fileType: prescriptions.fileType,
          status: prescriptions.status,
          pharmacistId: prescriptions.pharmacistId,
          remarks: prescriptions.remarks,
          uploadDate: prescriptions.uploadDate,
          reviewedAt: prescriptions.reviewedAt,
          patientName: users.name,
          patientEmail: users.email,
          patientPhone: users.phone,
        })
        .from(prescriptions)
        .leftJoin(users, eq(prescriptions.userId, users.id))
        .where(whereClause)
        .orderBy(desc(prescriptions.uploadDate))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(prescriptions).where(whereClause),
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
  const authResult = requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const { fileUrl, fileName, fileType } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: "File URL is required" }, { status: 400 });
    }

    const [prescription] = await db
      .insert(prescriptions)
      .values({
        userId: user.userId,
        fileUrl,
        fileName,
        fileType,
        status: "pending",
      })
      .returning();

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
