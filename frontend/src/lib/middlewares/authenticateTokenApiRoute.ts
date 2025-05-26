import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Interface utile si tu veux taper le req.user dans tes handlers
export interface JwtPayload {
  userId: string;
  // ajoute d'autres champs ici si tu en mets dans le token
}

/**
 * Middleware Next.js API Route
 * @returns userId extrait du token ou NextResponse avec erreur 401/403
 */
export async function authenticateTokenApiRoute(req: NextRequest): Promise<{ userId: string } | NextResponse> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return NextResponse.json({ message: "Token manquant" }, { status: 401 });
  }

  try {
    const secret = process.env.JWT_SECRET || '';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: "Token invalide" }, { status: 403 });
    }
    return { userId: decoded.userId };
  } catch (err) {
    return NextResponse.json({ message: "Token invalide" }, { status: 403 });
  }
}
