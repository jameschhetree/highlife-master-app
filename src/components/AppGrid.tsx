"use client";

import { useState, useRef, useCallback } from "react";
import { GripVertical, Trash2, Plus, ArrowUpRight } from "lucide-react";

interface AppItem {
  id: string;
  title: string;
  description: string;
  url: string;
  glyph: string;
  colorVariant: string;
  sortOrder: number;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function AppGrid({ initialApps }: { initialApps: AppItem[] }) {
  const [apps, setApps] = useState<AppItem[]>(initialApps);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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

  const handleDragStart = useCallback(
    (e: React.DragEvent, idx: number) => {
      setDragIdx(idx);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(idx));
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

      const reordered = updated.map((app, i) => ({
        ...app,
        sortOrder: i,
      }));
      setApps(reordered);
      setDragOverIdx(null);

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

  const handleAdd = useCallback(async () => {
    const res = await fetch("/api/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const app = await res.json();
    setApps((prev) => [...prev, app]);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/apps/${id}`, { method: "DELETE" });
    setApps((prev) => prev.filter((a) => a.id !== id));
    setConfirmDelete(null);
  }, []);

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
          const isOver = dragOverIdx === idx && dragIdx !== idx;
          const domain = extractDomain(app.url);

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
                  ? "rgba(255,255,255,.2)"
                  : undefined,
              }}
            >
              <div className="card-flashlight" />

              {/* Drag handle */}
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing z-10">
                <GripVertical size={16} className="text-[#666]" />
              </div>

              {/* Delete button */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity z-10">
                {confirmDelete === app.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-xs text-red-400 font-semibold px-2 py-0.5 rounded bg-red-400/10 hover:bg-red-400/20 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs text-[#888] font-medium px-2 py-0.5 rounded hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(app.id)}
                    className="p-1 rounded hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={14} className="text-[#666] hover:text-red-400" />
                  </button>
                )}
              </div>

              {/* Browser chrome preview */}
              <div className="preview-area">
                <div className="chrome-bar">
                  <div className="chrome-dots">
                    <span className="chrome-dot" />
                    <span className="chrome-dot" />
                    <span className="chrome-dot" />
                  </div>
                  <span className="chrome-url">{domain}</span>
                </div>
                <div className="preview-body">
                  <span className="preview-glyph">{app.glyph}</span>
                </div>
              </div>

              {/* Content */}
              <div className="card-content">
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
                  className="text-[15px] font-semibold tracking-tight text-white mb-1.5 outline-none focus:ring-1 focus:ring-white/20 rounded px-1 -mx-1 cursor-text"
                  style={{ letterSpacing: "-0.3px" }}
                >
                  {app.title}
                </h2>

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
                  className="text-[13px] text-[#888] leading-relaxed mb-3 outline-none focus:ring-1 focus:ring-white/20 rounded px-1 -mx-1 cursor-text"
                >
                  {app.description}
                </p>

                <div className="flex items-center justify-between">
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
                    className="text-[11px] text-[#555] font-mono truncate max-w-[180px] outline-none focus:ring-1 focus:ring-white/20 rounded px-1 -mx-1 cursor-text"
                  >
                    {domain}
                  </span>

                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add button */}
      <div className="flex justify-center mt-8 animate-footer">
        <button
          onClick={handleAdd}
          className="add-btn"
        >
          <Plus size={16} />
          Add App
        </button>
      </div>

      <style>{`
        .app-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(.25,.1,.25,1);
          box-shadow:
            0 1px 2px rgba(0,0,0,.2),
            0 4px 12px rgba(0,0,0,.15),
            inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .app-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.07);
          box-shadow:
            0 4px 8px rgba(0,0,0,.25),
            0 12px 36px rgba(0,0,0,.2),
            inset 0 1px 0 rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.15);
        }
        .app-card:active {
          transform: translateY(-2px);
        }

        .card-flashlight {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(255,255,255,.04),
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

        /* Browser chrome preview */
        .preview-area {
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .chrome-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .chrome-dots {
          display: flex;
          gap: 5px;
        }
        .chrome-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
        }
        .chrome-url {
          font-family: "SF Mono", SFMono-Regular, ui-monospace, Menlo, monospace;
          font-size: 10px;
          color: #555;
          letter-spacing: 0.3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .preview-body {
          position: relative;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%);
          overflow: hidden;
        }
        .preview-glyph {
          font-size: 56px;
          font-weight: 700;
          color: rgba(255,255,255,0.08);
          user-select: none;
          line-height: 1;
        }

        /* Card content */
        .card-content {
          padding: 16px 20px 20px;
        }

        /* Open link button */
        .open-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          color: #666;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .open-link:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border-color: rgba(255,255,255,0.2);
        }

        /* Add button */
        .add-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          font-size: 13px;
          font-weight: 600;
          color: #888;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(.25,.1,.25,1);
        }
        .add-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }
        .add-btn:active {
          transform: translateY(0);
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .preview-body {
            height: 80px;
          }
          .preview-glyph {
            font-size: 48px;
          }
          .card-content {
            padding: 14px 16px 18px;
          }
          .chrome-bar {
            padding: 8px 14px;
          }
        }
      `}</style>
    </>
  );
}
