"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  durationMs?: number; // total duration for all strokes
  className?: string;
  durationsOverride?: Record<number, number>;
  showHead?: boolean;
};

const FALLBACK_VIEWBOX = "0 0 1024 1024";
const STROKE_COLOR = "#0ea5e9";
const MIN_STROKE_MS = 550;
const HEAD_SIZE = 72;
// Default explicit per-path overrides (ms) to slow specific letters (indexes refer to
// paths after the background/frame is removed). Adjust as needed.
const DEFAULT_PATH_OVERRIDES: Record<number, number> = {
  2: 1400, // D outer
  9: 900,  // D inner
  3: 1100, // e outer
  4: 700,  // e inner
  0: 900,  // a outer (slow down a)
  1: 700,  // a inner
};
// Overlap (ms) to subtract after a given path index so the following stroke starts earlier.
// Keys are path indexes (after the background is removed). Positive value shortens gap.
const DEFAULT_PATH_OVERLAPS: Record<number, number> = {
  9: 1500, // after D inner, start next earlier (close D→r gap)
  4: 900,  // after e inner, start a earlier
  1: 800,  // after a inner, start m earlier
};

function parseViewBox(vb: string) {
  const parts = vb.split(/\s+/).map(Number);
  if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
    return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
  }
  return { x: 0, y: 0, width: 1024, height: 1024 };
}

const WriteAnimation: React.FC<Props> = ({ durationMs = 5600, className, durationsOverride, showHead = true }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const headRef = useRef<SVGGElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [pathLengths, setPathLengths] = useState<number[]>([]);
  const [scale, setScale] = useState<number>(1);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [orderedIndexes, setOrderedIndexes] = useState<number[]>([]);
  const [viewBox, setViewBox] = useState<string>(FALLBACK_VIEWBOX);
  const [viewDims, setViewDims] = useState(() => parseViewBox(FALLBACK_VIEWBOX));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    // Fetch and parse the provided SVG so we can animate its paths.
    const run = async () => {
      const res = await fetch("/vectorized.svg");
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "image/svg+xml");
      const vb = doc.documentElement.getAttribute("viewBox") || FALLBACK_VIEWBOX;
      const dims = parseViewBox(vb);
      const parsedPaths = Array.from(doc.querySelectorAll("path"))
        .map((p) => p.getAttribute("d"))
        .filter(Boolean) as string[];

      // Skip the first path (outer frame); keep the rest as drawable strokes.
      const usable = parsedPaths.length > 1 ? parsedPaths.slice(1) : parsedPaths;
      setViewBox(vb);
      setViewDims(dims);
      setPaths(usable);
      const defaultOrder = usable.map((_, i) => i);
      // Map to the word order: D → r → e → a → m → I → T → dot.
      // Some letters have two strokes (outline + inner fill), so they sit back-to-back.
      const dreamItOrder = [2, 9, 5, 3, 4, 0, 1, 7, 6, 8, 10, 11];
      setOrderedIndexes(dreamItOrder.length === usable.length ? dreamItOrder : defaultOrder);
    };
    run().catch(() => {
      // fallback to empty on error
      setPaths([]);
    });
  }, []);

  useEffect(() => {
    const lengths = pathRefs.current.map((p) => {
      if (!p) return 0;
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      return len;
    });
    setPathLengths(lengths);
  }, [paths]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const newScale = viewDims.width ? width / viewDims.width : 1;
        setScale(newScale);
      }
    });
    resizeObserver.observe(shell);
    return () => resizeObserver.disconnect();
  }, [viewDims.width]);

  // Compute per-stroke durations honoring explicit overrides.
  const overrides = { ...(DEFAULT_PATH_OVERRIDES || {}), ...(durationsOverride || {}) };

  // Base weights for flexible strokes (non-overridden): use measured length
  const baseWeights = orderedIndexes.map((idx) => pathLengths[idx] || 1);
  const strokeCount = orderedIndexes.length || 1;

  // Clamp overrides to at least MIN_STROKE_MS and collect totals.
  const clampedOverrides: Record<number, number> = {};
  let sumOverrides = 0;
  orderedIndexes.forEach((idx) => {
    if (overrides[idx]) {
      const v = Math.max(MIN_STROKE_MS, Math.round(overrides[idx]));
      clampedOverrides[idx] = v;
      sumOverrides += v;
    }
  });

  // Target total time budget (allow a little extra headroom so overrides can breathe).
  const minTotal = MIN_STROKE_MS * strokeCount;
  const targetTotal = Math.max(durationMs * 1.25, minTotal);

  // Flexible strokes count and weight sum.
  const flexibleIndexes = orderedIndexes.filter((idx) => !(idx in clampedOverrides));
  const flexibleCount = flexibleIndexes.length;
  const flexibleWeightSum = flexibleIndexes.reduce((s, idx) => s + (baseWeights[orderedIndexes.indexOf(idx)] || 1), 0) || 1;

  // Time available to distribute among flexible strokes (after honoring overrides and their MINs).
  const baseFlexibleMin = MIN_STROKE_MS * flexibleCount;
  const remainingPool = Math.max(0, targetTotal - sumOverrides - baseFlexibleMin);

  const durations: number[] = new Array(strokeCount).fill(MIN_STROKE_MS);
  // assign overrides first
  orderedIndexes.forEach((idx, i) => {
    if (idx in clampedOverrides) durations[i] = clampedOverrides[idx];
  });

  // distribute remainingPool to flexible strokes proportionally
  flexibleIndexes.forEach((idx) => {
    const i = orderedIndexes.indexOf(idx);
    const w = baseWeights[i] || 1;
    const extra = Math.round((remainingPool * w) / flexibleWeightSum);
    durations[i] = MIN_STROKE_MS + extra;
  });

  // Apply optional overlaps: allow next stroke to start earlier by subtracting overlap ms
  const overlaps = { ...(DEFAULT_PATH_OVERLAPS || {}) } as Record<number, number>;
  const delays: number[] = new Array(durations.length).fill(0);
  for (let i = 0; i < durations.length; i++) {
    if (i === 0) {
      delays[i] = 0;
      continue;
    }
    const prevIdx = orderedIndexes[i - 1];
    const overlap = Math.max(0, overlaps[prevIdx] || 0);
    delays[i] = Math.max(0, delays[i - 1] + durations[i - 1] - overlap);
  }

  if (process.env.NODE_ENV !== "production") {
    // Debug timing output for tuning overlaps and durations
    // eslint-disable-next-line no-console
    console.log("write-animation timing", { orderedIndexes, durations, delays, overlaps, overrides: DEFAULT_PATH_OVERRIDES });
  }

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (reduceMotion || !showHead) {
      if (headRef.current) headRef.current.style.display = "none";
      return undefined;
    }

    const head = headRef.current;
    if (head) head.style.display = "block";

    const allReady = orderedIndexes.every((idx) => {
      const el = pathRefs.current[idx];
      return el && (pathLengths[idx] || el.getTotalLength());
    });
    if (!allReady) return undefined;

    const totalEnd = (delays[delays.length - 1] || 0) + (durations[durations.length - 1] || 0);
    const start = performance.now();

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

    const tick = (now: number) => {
      const t = now - start;
      const lastIdx = orderedIndexes.length - 1;
      if (t > totalEnd + 200) return;

      // find active stroke
      let active = lastIdx;
      for (let i = 0; i < delays.length; i++) {
        if (t < delays[i] + durations[i]) {
          active = i;
          break;
        }
      }

      const pathIdx = orderedIndexes[active];
      const pathEl = pathRefs.current[pathIdx];
      if (!pathEl) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const len = pathLengths[pathIdx] || pathEl.getTotalLength();
      if (!len) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const startOffset = delays[active] || 0;
      const progress = clamp((t - startOffset) / (durations[active] || 1), 0, 1);
      const dist = len * progress;
      const ahead = clamp(dist + Math.max(1, len * 0.01), 0, len);
      const p1 = pathEl.getPointAtLength(dist);
      const p2 = pathEl.getPointAtLength(ahead);
      const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;

      if (head) {
        head.setAttribute(
          "transform",
          `translate(${p1.x},${p1.y}) rotate(${angle}) translate(${-HEAD_SIZE / 2},${-HEAD_SIZE / 2})`
        );
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduceMotion, showHead, durations, delays, orderedIndexes, pathLengths, paths]);

  return (
    <div
      className={`write-shell ${className ?? ""}`.trim()}
      ref={shellRef}
      style={{ aspectRatio: `${viewDims.width}/${viewDims.height}` }}
    >
      <div
        className="write-stage"
        style={{
          width: `${viewDims.width}px`,
          height: `${viewDims.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="write-svg"
          role="img"
          aria-labelledby="dreamit-title"
        >
          <title id="dreamit-title">DreamIT hand-drawn stroke animation</title>
          {paths.length === 0 ? (
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={STROKE_COLOR}>
              Loading...
            </text>
          ) : (
            orderedIndexes.map((pathIdx, seqIdx) => {
              const d = paths[pathIdx];
              const len = pathLengths[pathIdx] || 1;
              const perStroke = durations[seqIdx] || Math.max(500, durationMs / paths.length);
              const delay = delays[seqIdx] || seqIdx * perStroke;
              return (
                <path
                  key={pathIdx}
                  ref={(el) => {
                    pathRefs.current[pathIdx] = el;
                  }}
                  d={d}
                  fill="none"
                  stroke={STROKE_COLOR}
                  strokeWidth={12}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={!reduceMotion ? "write-stroke" : ""}
                  style={{
                    strokeDasharray: len,
                    strokeDashoffset: len,
                    animation: reduceMotion
                      ? "none"
                      : `stroke-draw ${perStroke}ms ease-out ${delay}ms forwards`,
                    // @ts-ignore custom prop for keyframes
                    "--len": `${len}px`,
                  }}
                />
              );
            })
          )}

          {!reduceMotion && showHead ? (
            <g ref={headRef} style={{ pointerEvents: "none", display: "none" }}>
              <image href="/top_ae86_2d_wbg.svg" width={HEAD_SIZE} height={HEAD_SIZE} />
            </g>
          ) : null}
        </svg>

        <span className="sr-only">DreamIT</span>
      </div>

      <style jsx>{`
        .write-shell {
          position: relative;
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
        }
        .write-stage {
          position: relative;
        }
        .write-svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .write-stroke {
          animation: stroke-draw 1s ease-out forwards;
        }
        @keyframes stroke-draw {
          from { stroke-dashoffset: var(--len, 1px); }
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .write-stroke { animation: none; stroke-dashoffset: 0; }
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
};

export default WriteAnimation;
