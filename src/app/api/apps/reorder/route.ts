import { NextRequest, NextResponse } from "next/server";
import { requirePrisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const prisma = requirePrisma();
  const body: { items: { id: string; sortOrder: number }[] } =
    await req.json();

  if (!Array.isArray(body.items)) {
    return NextResponse.json(
      { error: "items array required" },
      { status: 400 }
    );
  }

  // Use a transaction to update all sort orders
  await prisma.$transaction(
    body.items.map((item) =>
      prisma.app.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
