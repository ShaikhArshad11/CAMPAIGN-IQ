import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export function verifyAuth(request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return { error: NextResponse.json({ error: "No token provided" }, { status: 401 }) };
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return { user };
  } catch {
    return { error: NextResponse.json({ error: "Invalid or expired token" }, { status: 403 }) };
  }
}

export function requireAdmin(request) {
  const result = verifyAuth(request);
  if (result.error) return result;
  if (result.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return result;
}
