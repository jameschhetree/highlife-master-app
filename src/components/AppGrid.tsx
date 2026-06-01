"use client";

import { useState, useRef, useCallback } from "react";
import { GripVertical, Trash2, Plus, ExternalLink } from "lucide-react";

interface AppItem {
  id: string;
  title: string;
  description: string;
  url: string;
  glyph: string;
  colorVariant: string;
  sortOrder: number;
}

const VARIANT_STYLES: Record<
  string,
  { bg: string; color: string }
> = {
  dashboard: { bg: "rgba(26,26,26,.06)", color: "#1a1a1a" },
  finances: { bg: "rgba(139,115,85,.08)", color: "#8B7355" },
  prospect: { bg: "rgba(59,130,246,.06)", color: "#2563eb" },
  records: { bg: "rgba(139,92,246,.06)", color: "#7c3aed" },
  live: { bg: "rgba(236,72,153,.08)", color: "#db2777" },
  calculator: { bg: "rgba(16,185,129,.08)", color: "#059669" },
  playlists: { bg: "rgba(245,158,11,.08)", color: "#d97706" },
  roadmap: { bg: "rgba(20,184,166,.08)", color: "#0d9488" },
  custom: { bg: "rgba(139,115,85,.08)", color: "#8B7355" },
};

function getVariantStyle(variant: string) {
  return VARIANT_STYLES[variant] || VARIANT_STYLES.custom;
}

export function AppGrid({ initialApps }: { initialApps: AppItem[] }) {
  const [apps, setApps] = useState<AppItem[]>(initialApps);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // ── Inline edit ──
  const saveField = useCallback(
    async (id: string, field: string, value: string) => {
      setApps((prev) =>
        prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
      );
      await fetch(`/api/apps/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    },
    []
  );

  // ── Drag and drop ──
  const handleDragStart = useCallback(
    (e: React.DragEvent, idx: number) => {
      setDragIdx(idx);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(idx));
      // Style the dragged element
      const el = e.currentTarget as HTMLElement;
      requestAnimationFrame(() => {
        el.style.opacity = "0.4";
      });
    },
    []
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      (e.currentTarget as HTMLElement).style.opacity = "1";
      setDragIdx(null);
      setDragOverIdx(null);
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverIdx(idx);
    },
    []
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent, dropIdx: number) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === dropIdx) {
        setDragOverIdx(null);
        return;
      }

      const updated = [...apps];
      const [moved] = updated.splice(dragIdx, 1);
      updated.splice(dropIdx, 0, moved);

      // Reassign sortOrder
      const reordered = updated.map((app, i) => ({
        ...app,
        sortOrder: i,
      }));
      setApps(reordered);
      setDragOverIdx(null);

      // Persist
      await fetch("/api/apps/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: reordered.map((a) => ({ id: a.id, sortOrder: a.sortOrder })),
        }),
      });
    },
    [apps, dragIdx]
  );

  // ── Add new ──
  const handleAdd = useCallback(async () => {
    const res = await fetch("/api/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const app = await res.json();
    setApps((prev) => [...prev, app]);
  }, []);

  // ── Delete ──
  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/apps/${id}`, { method: "DELETE" });
    setApps((prev) => prev.filter((a) => a.id !== id));
    setConfirmDelete(null);
  }, []);

  // ── Mouse tracking for flashlight effect ──
  const handleMouseMove = useCallback(
    (e: React.MouseEvent, id: string) => {
      const el = cardRefs.current.get(id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mouse-x", e.clientX - r.left + "px");
      el.style.setProperty("--mouse-y", e.clientY - r.top + "px");
    },
    []
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {apps.map((app, idx) => {
          const vs = getVariantStyle(app.colorVariant);
          const isOver = dragOverIdx === idx && dragIdx !== idx;

          return (
            <div
              key={app.id}
              ref={(el) => {
                if (el) cardRefs.current.set(app.id, el);
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onMouseMove={(e) => handleMouseMove(e, app.id)}
              className="app-card group"
              style={{
                opacity: 0,
                animation: `fadeSlideUp 0.6s cubic-bezier(.25,.1,.25,1) ${0.2 + idx * 0.05}s forwards`,
                transform: isOver ? "scale(1.02)" : undefined,
                borderColor: isOver
                  ? "rgba(139,115,85,.3)"
                  : undefined,
              }}
            >
              {/* Flashlight hover effect */}
              <div className="card-flashlight" />

              {/* Drag handle */}
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical size={16} className="text-[#1a1a1a]" />
              </div>

              {/* Delete button */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity">
                {confirmDelete === app.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-xs text-red-600 font-semibold px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs text-[#888] font-medium px-2 py-0.5 rounded hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(app.id)}
                    className="p-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} className="text-[#888] hover:text-red-500" />
                  </button>
                )}
              </div>

              {/* Icon chip */}
              <div
                className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[22px] font-bold mb-5 select-none"
                style={{ background: vs.bg, color: vs.color }}
              >
                {app.glyph}
              </div>

              {/* Title - inline editable */}
              <h2
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) =>
                  saveField(
                    app.id,
                    "title",
                    e.currentTarget.textContent || app.title
                  )
                }
                className="text-lg font-bold tracking-tight mb-2 outline-none focus:ring-1 focus:ring-[#8B7355]/30 rounded px-1 -mx-1 cursor-text"
                style={{ letterSpacing: "-0.3px" }}
              >
                {app.title}
              </h2>

              {/* Description - inline editable */}
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) =>
                  saveField(
                    app.id,
                    "description",
                    e.currentTarget.textContent || app.description
                  )
                }
                className="text-[13px] text-[#888] leading-relaxed mb-3 outline-none focus:ring-1 focus:ring-[#8B7355]/30 rounded px-1 -mx-1 cursor-text"
              >
                {app.description}
              </p>

              {/* URL - inline editable */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    saveField(
                      app.id,
                      "url",
                      e.currentTarget.textContent || app.url
                    )
                  }
                  className="text-[11px] text-[#aaa] font-mono truncate max-w-[220px] outline-none focus:ring-1 focus:ring-[#8B7355]/30 rounded px-1 -mx-1 cursor-text"
                >
                  {app.url}
                </span>
              </div>

              {/* Open link */}
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8B7355] mt-2 hover:gap-2.5 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                Open{" "}
                <ExternalLink
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </div>
          );
        })}
      </div>

      {/* Add button */}
      <div className="flex justify-center mt-8 animate-footer">
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#8B7355] bg-white/70 backdrop-blur-xl border border-[rgba(0,0,0,0.06)] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:translate-y-0"
        >
          <Plus size={16} />
          Add App
        </button>
      </div>

      <style>{`
        .app-card {
          background: rgba(255,255,255,.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0,0,0,.06);
          border-radius: 20px;
          padding: 36px 32px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(.25,.1,.25,1);
          box-shadow:
            0 1px 2px rgba(0,0,0,.03),
            0 4px 12px rgba(0,0,0,.04),
            0 8px 28px rgba(0,0,0,.03);
        }
        .app-card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 2px 4px rgba(0,0,0,.04),
            0 8px 24px rgba(0,0,0,.06),
            0 20px 56px rgba(0,0,0,.08),
            inset 0 1px 1px rgba(255,255,255,.6);
          border-color: rgba(139,115,85,.18);
        }
        .app-card:active {
          transform: translateY(-2px);
        }
        .card-flashlight {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(139,115,85,.06),
            transparent 60%
          );
          opacity: 0;
          transition: opacity 0.4s cubic-bezier(.25,.1,.25,1);
          pointer-events: none;
          z-index: 0;
          border-radius: inherit;
        }
        .app-card:hover .card-flashlight {
          opacity: 1;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .app-card {
            padding: 28px 24px;
          }
        }
      `}</style>
    </>
  );
}
