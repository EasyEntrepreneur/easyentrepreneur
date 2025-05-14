// app/api/user/update/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json();

  const { name, lastname, email, password } = body;

  try {
    const data: any = { name, lastname, email };
    if (password && password.length > 3) {
      const hashedPassword = await bcrypt.hash(password, 10);
      data.password = hashedPassword;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (e) {
    return NextResponse.json({ error: "Erreur mise à jour utilisateur" }, { status: 500 });
  }
}
