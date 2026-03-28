import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { budget } = await req.json();
    if (typeof budget !== "number" || budget < 0) {
      return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
    }

    await prisma.profile.update({
      where: { userId: session.userId },
      data: { monthlyBudget: budget },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
