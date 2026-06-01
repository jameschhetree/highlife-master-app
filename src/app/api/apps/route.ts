import { NextRequest, NextResponse } from "next/server";
import { requirePrisma } from "@/lib/db";

export async function GET() {
  const prisma = requirePrisma();
  const apps = await prisma.app.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(apps);
}

export async function POST(req: NextRequest) {
  const prisma = requirePrisma();
  const body = await req.json();

  // Get max sortOrder
  const maxApp = await prisma.app.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const nextOrder = (maxApp?.sortOrder ?? -1) + 1;

  const app = await prisma.app.create({
    data: {
      title: body.title || "New App",
      description: body.description || "Click to edit description",
      url: body.url || "https://example.com",
      glyph: body.glyph || "N",
      colorVariant: body.colorVariant || "custom",
      sortOrder: nextOrder,
    },
  });

  return NextResponse.json(app, { status: 201 });
}
