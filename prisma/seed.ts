import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url =
  process.env.DATABASE_URL ||
  process.env.PRISMA_DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const apps = [
  {
    title: "HL Dashboard",
    description:
      "Artist portal, admin panel, release pipeline, Google Calendar & Drive integrations.",
    url: "https://highlifedashboard.com",
    glyph: "D",
    colorVariant: "dashboard",
    sortOrder: 0,
  },
  {
    title: "HL Finances",
    description:
      "Studio & podcast income calculator. Track sessions, revenue, and profit connected to Google Sheets.",
    url: "https://highlife-finance.vercel.app",
    glyph: "$",
    colorVariant: "finances",
    sortOrder: 1,
  },
  {
    title: "HL Prospect CRM",
    description:
      "LinkedIn prospecting pipeline. Kanban board tracking prospects from discovery to booking.",
    url: "https://highlife-crm.vercel.app",
    glyph: "LI",
    colorVariant: "prospect",
    sortOrder: 2,
  },
  {
    title: "HL Records",
    description:
      "Artist submission portal. Submit songs for approval, track releases, admin dashboard.",
    url: "http://100.79.115.56:7900/submit",
    glyph: "R",
    colorVariant: "records",
    sortOrder: 3,
  },
  {
    title: "HL Live",
    description:
      "Public talent booking site for venues + promoters. /admin console runs the full booking CRM (artists, venues, campaigns, pipeline).",
    url: "https://highlife-live.vercel.app",
    glyph: "L",
    colorVariant: "live",
    sortOrder: 4,
  },
  {
    title: "HL Calculator",
    description:
      "Studio + podcast session cost calculator. Prices out room time, edits, packages.",
    url: "https://highlife-calculator.vercel.app",
    glyph: "C",
    colorVariant: "calculator",
    sortOrder: 5,
  },
  {
    title: "HL Playlists",
    description:
      "Curated playlist hub. Pitches, submissions, and tracking for HighLife-aligned audio drops.",
    url: "https://highlife-playlists.vercel.app",
    glyph: "P",
    colorVariant: "playlists",
    sortOrder: 6,
  },
  {
    title: "HL Roadmap",
    description:
      "12-month plan. 39 tasks, 213 steps across 4 phases. Editable across devices with AI chat to modify items in plain English.",
    url: "https://highlife-roadmap.vercel.app",
    glyph: "M",
    colorVariant: "roadmap",
    sortOrder: 7,
  },
];

async function main() {
  // Clear existing
  await prisma.app.deleteMany();

  for (const app of apps) {
    await prisma.app.create({ data: app });
  }

  const count = await prisma.app.count();
  console.log(`Seeded ${count} apps`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
