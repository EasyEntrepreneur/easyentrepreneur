import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Middleware pour authentifier (exemple, à adapter si tu as un helper)
const getUserFromToken = (req: NextRequest) => {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith("Bearer ")) return null;
  try {
    const token = auth.replace("Bearer ", "");
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return payload.userId as string;
  } catch {
    return null;
  }
};

export async function GET(req: NextRequest) {
  const userId = getUserFromToken(req);
  if (!userId) {
    return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, currentPlan: true },
  });

  if (!user) {
    return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
