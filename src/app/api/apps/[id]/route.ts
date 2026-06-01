import { NextRequest, NextResponse } from "next/server";
import { requirePrisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prisma = requirePrisma();
  const body = await req.json();

  const allowed = [
    "title",
    "description",
    "url",
    "glyph",
    "colorVariant",
    "sortOrder",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  const app = await prisma.app.update({
    where: { id },
    data,
  });

  return NextResponse.json(app);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prisma = requirePrisma();

  await prisma.app.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
