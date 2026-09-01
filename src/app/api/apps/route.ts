import { NextRequest, NextResponse } from "next/server";
import { requirePrisma } from "@/lib/db";

/** A bare domain saved here resolves relative to the page and 404s. Same guard
 *  as the PATCH route in [id]/route.ts. */
function normaliseUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const url = value.trim();
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url) || url.startsWith("/")) return url;
  return `https://${url}`;
}

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
      url: normaliseUrl(body.url) || "https://example.com",
      glyph: body.glyph || "N",
      colorVariant: body.colorVariant || "custom",
      sortOrder: nextOrder,
    },
  });

  return NextResponse.json(app, { status: 201 });
}
