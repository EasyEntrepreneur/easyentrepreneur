import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

export async function authenticateToken(request: NextRequest): Promise<JwtPayload | null> {
  // Compatible avec NextRequest headers
  const authHeader =
    request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}
