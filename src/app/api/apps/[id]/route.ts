import { NextRequest, NextResponse } from "next/server";
import { requirePrisma } from "@/lib/db";

/**
 * The grid lets you edit a tile's URL inline, and typing a bare domain saved it
 * as-is. The anchor then resolved relative to the current page, so
 * "highlife-finance.vercel.app" became
 * highlife-master.vercel.app/highlife-finance.vercel.app and 404'd while the
 * app itself was fine. Normalise on write so a bare domain can't do that again.
 */
function normaliseUrl(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const url = value.trim();
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  // Leave deliberate in-app paths alone.
  if (url.startsWith("/")) return url;
  return `https://${url}`;
}

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
    "category",
    "sortOrder",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      data[key] = key === "url" ? normaliseUrl(body[key]) : body[key];
    }
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
