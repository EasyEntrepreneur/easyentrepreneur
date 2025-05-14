// app/api/billing/update/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json();

  try {
    const billingInfo = await prisma.billingInfo.upsert({
      where: { userId },
      update: { ...body },
      create: {
        userId,
        ...body,
      },
    });

    return NextResponse.json({ success: true, billingInfo });
  } catch (e) {
    return NextResponse.json({ error: "Erreur mise à jour facturation" }, { status: 500 });
  }
}
