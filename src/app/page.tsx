import { requirePrisma } from "@/lib/db";
import { AppGrid } from "@/components/AppGrid";

export const dynamic = "force-dynamic";

export default async function Home() {
  const prisma = requirePrisma();
  const apps = await prisma.app.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="relative z-10 w-full max-w-[900px]">
        <header className="text-center mb-14 animate-header">
          <img
            src="/logo.webp"
            alt="HighLife"
            className="w-16 h-16 rounded-2xl object-contain mx-auto mb-5"
          />
          <h1
            className="text-4xl font-extrabold tracking-tight text-white"
            style={{ letterSpacing: "-1px" }}
          >
            HighLife DMV
          </h1>
          <p className="text-sm text-[#666] font-normal mt-2 tracking-wide">
            Podcast Studio &amp; Creative Agency
          </p>
        </header>

        <AppGrid initialApps={apps} />

        <footer className="text-center mt-14 pt-6 border-t border-[rgba(255,255,255,0.06)] animate-footer">
          <p className="text-xs text-[#555] tracking-wide">
            Cleveland Park, DC &middot;{" "}
            <a
              href="https://www.highlifedmv.com"
              className="text-[#888] font-semibold no-underline hover:underline hover:text-white transition-colors"
            >
              highlifedmv.com
            </a>
          </p>
        </footer>
      </div>

      <style>{`
        .orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(100px);
          will-change: transform;
        }
        .orb-1 {
          width: 600px; height: 600px; top: -15%; right: -10%;
          background: radial-gradient(circle, rgba(255,255,255,.04) 0%, transparent 70%);
          animation: drift1 22s ease-in-out infinite alternate;
        }
        .orb-2 {
          width: 500px; height: 500px; bottom: -12%; left: -8%;
          background: radial-gradient(circle, rgba(255,255,255,.03) 0%, transparent 70%);
          animation: drift2 26s ease-in-out infinite alternate;
        }
        .orb-3 {
          width: 400px; height: 400px; top: 40%; left: 50%;
          background: radial-gradient(circle, rgba(255,255,255,.03) 0%, transparent 70%);
          animation: drift3 30s ease-in-out infinite alternate;
        }
        @keyframes drift1 { 0% { transform: translate(0,0) } 100% { transform: translate(-60px,40px) } }
        @keyframes drift2 { 0% { transform: translate(0,0) } 100% { transform: translate(50px,-35px) } }
        @keyframes drift3 { 0% { transform: translate(-50%,-50%) } 100% { transform: translate(calc(-50% + 40px),calc(-50% - 50px)) } }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-header {
          opacity: 0;
          animation: fadeSlideUp 0.7s cubic-bezier(.25,.1,.25,1) 0.1s forwards;
        }
        .animate-footer {
          opacity: 0;
          animation: fadeSlideUp 0.6s cubic-bezier(.25,.1,.25,1) 0.6s forwards;
        }
      `}</style>
    </div>
  );
}
