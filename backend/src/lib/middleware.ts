import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader, JWTPayload } from "./auth";

export function getUser(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get("authorization");
  const token = getTokenFromHeader(authHeader);
  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(req: NextRequest): { user: JWTPayload } | NextResponse {
  const user = getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { user };
}

export function requireRole(
  req: NextRequest,
  roles: string[]
): { user: JWTPayload } | NextResponse {
  const result = requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (!roles.includes(result.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}
