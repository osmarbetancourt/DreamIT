"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  durationMs?: number; // total duration for all strokes
  className?: string;
  durationsOverride?: Record<number, number>;
  showHead?: boolean;
  driftMode?: "spline" | "path"; // spline: use smoothed guide points for car; path: raw path
  driftPath?: string; // optional custom drift guide svg path
  carSpeedFactor?: number; // multiplier for car speed relative to stroke timeline
};

const FALLBACK_VIEWBOX = "0 0 1024 1024";
const STROKE_COLOR = "#0ea5e9";
const SPEED_FACTOR = 7; // global slow-down multiplier
const MIN_STROKE_MS = 550 * SPEED_FACTOR;
const HEAD_SIZE = 180;
const HEAD_LEAD_PX = 6; // place the car slightly ahead of the mark to mimic drifting
const STROKE_LAG_RATIO = 0; // percent of stroke duration to delay mark start behind the car
const STROKE_LAG_MIN = 120; // minimum lag in ms (kept modest even with SPEED_FACTOR)
const DRIFT_SLIP_DEG = 28; // stronger fixed yaw to simulate drifting
const DRIFT_LATERAL_PX = 12; // larger lateral offset so the body hangs out more
const ANGLE_SMOOTH = 0.2; // how strongly to ease heading changes
const MAX_ANGLE_STEP = 10; // clamp per-frame heading change (deg) to reduce jitter
const STROKE_TRANSITION_FRAMES = 4; // carry previous heading briefly when switching strokes
const GUIDE_SAMPLES = 80; // number of points to sample per stroke for guide path
const DRIFT_PATH = "/drift_path.svg";
// Default explicit per-path overrides (ms) to slow specific letters (indexes refer to
// paths after the background/frame is removed). Adjust as needed.
const DEFAULT_PATH_OVERRIDES: Record<number, number> = {
  2: 1750 * SPEED_FACTOR, // D outer
  9: 100 * SPEED_FACTOR,  // D inner
  5: 1 * SPEED_FACTOR,  // r
  3: 1100 * SPEED_FACTOR, // e outer
  4: 900 * SPEED_FACTOR,  // e inner
  0: 900 * SPEED_FACTOR,  // a outer (slow down a)
  1: 700 * SPEED_FACTOR,  // a inner
  7: 700 * SPEED_FACTOR, // m
  6: 700 * SPEED_FACTOR,  // I
  8: 400 * SPEED_FACTOR,  // T
  10: 700 * SPEED_FACTOR, // dot / star
  11: 700 * SPEED_FACTOR, // final flourish (if present)
};
const DEFAULT_PATH_OVERLAPS: Record<number, number> = {
  9: 1820 * SPEED_FACTOR, // after D inner (D → r)
  5: 400 * SPEED_FACTOR,  // after r (r → e)
  4: 1700 * SPEED_FACTOR, // after e inner (e → a)
  1: 1300 * SPEED_FACTOR, // after a inner (a → m)
  7: 500 * SPEED_FACTOR,  // after m (m → I)
  6: 500 * SPEED_FACTOR,  // after I (I → T)
  8: 500 * SPEED_FACTOR,  // after T (T → dot)
};

function parseViewBox(vb: string) {
  const parts = vb.split(/\s+/).map(Number);
  if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
    return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
  }
  return { x: 0, y: 0, width: 1024, height: 1024 };
}

const WriteAnimation: React.FC<Props> = ({
  durationMs = 5600 * SPEED_FACTOR,
  className,
  durationsOverride,
  showHead = true,
  driftMode = "spline",
  driftPath,
  carSpeedFactor = 0.25,
}) => {
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
  const lastAngleRef = useRef<number>(0);
  const prevActiveRef = useRef<number>(-1);
  const transitionFramesRef = useRef<number>(0);
  const guideCacheRef = useRef<{ pts: { x: number; y: number }[]; lens: number[]; total: number }[]>([]);
  const driftGuideRef = useRef<{ pts: { x: number; y: number }[]; lens: number[]; total: number } | null>(null);

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
    // Load the dedicated drift guide path (single path) for smoother car motion.
    const run = async () => {
      try {
        const res = await fetch(driftPath || DRIFT_PATH);
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, "image/svg+xml");
        const pathEl = doc.querySelector("path");
        const d = pathEl?.getAttribute("d");
        if (!d) return;
        const tmp = document.createElementNS("http://www.w3.org/2000/svg", "path");
        tmp.setAttribute("d", d);
        const total = tmp.getTotalLength();
        const samples = Math.max(20, GUIDE_SAMPLES);
        const step = total / Math.max(1, samples - 1);
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < samples; i++) {
          const dist = Math.min(total, step * i);
          const p = tmp.getPointAtLength(dist);
          pts.push({ x: p.x, y: p.y });
        }
        // smooth the guide points
        const smoothed = pts.map((p, i) => {
          const w = 2;
          let sx = 0;
          let sy = 0;
          let c = 0;
          for (let k = -w; k <= w; k++) {
            const j = Math.min(Math.max(0, i + k), pts.length - 1);
            sx += pts[j].x;
            sy += pts[j].y;
            c += 1;
          }
          return { x: sx / c, y: sy / c };
        });
        const lens: number[] = [0];
        for (let i = 1; i < smoothed.length; i++) {
          const dx = smoothed[i].x - smoothed[i - 1].x;
          const dy = smoothed[i].y - smoothed[i - 1].y;
          lens[i] = (lens[i - 1] || 0) + Math.hypot(dx, dy);
        }
        driftGuideRef.current = { pts: smoothed, lens, total: lens[lens.length - 1] || total };
      } catch (e) {
        // ignore guide load errors
      }
    };
    run();
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
    // Build guide caches for car path smoothing
    const guides: { pts: { x: number; y: number }[]; lens: number[]; total: number }[] = [];
    orderedIndexes.forEach((idx) => {
      const el = pathRefs.current[idx];
      if (!el) {
        guides[idx] = { pts: [], lens: [], total: 0 };
        return;
      }
      const len = pathLengths[idx] || el.getTotalLength();
      const samples = Math.max(10, GUIDE_SAMPLES);
      const step = len / Math.max(1, samples - 1);
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < samples; i++) {
        const d = Math.min(len, step * i);
        const p = el.getPointAtLength(d);
        pts.push({ x: p.x, y: p.y });
      }
      // simple moving average smoothing
      const smoothed = pts.map((p, i) => {
        const w = 2;
        let sx = 0;
        let sy = 0;
        let c = 0;
        for (let k = -w; k <= w; k++) {
          const j = Math.min(Math.max(0, i + k), pts.length - 1);
          sx += pts[j].x;
          sy += pts[j].y;
          c += 1;
        }
        return { x: sx / c, y: sy / c };
      });
      const lens: number[] = [0];
      for (let i = 1; i < smoothed.length; i++) {
        const dx = smoothed[i].x - smoothed[i - 1].x;
        const dy = smoothed[i].y - smoothed[i - 1].y;
        lens[i] = lens[i - 1] + Math.hypot(dx, dy);
      }
      guides[idx] = { pts: smoothed, lens, total: lens[lens.length - 1] || len };
    });
    guideCacheRef.current = guides;
  }, [orderedIndexes, pathLengths, paths]);

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
    const carTimelineTotal = Math.max(
      600,
      ((durationMs || totalEnd) as number) / Math.max(0.001, carSpeedFactor)
    );
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

      if (active !== prevActiveRef.current) {
        transitionFramesRef.current = STROKE_TRANSITION_FRAMES;
        prevActiveRef.current = active;
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

      const driftGuide = driftGuideRef.current;

      const mapGuide = (d: number, guide?: { pts: { x: number; y: number }[]; lens: number[]; total: number }) => {
        if (!guide || guide.pts.length < 2) return pathEl.getPointAtLength(d);
        const total = guide.total;
        const target = clamp(d, 0, total);
        const lens = guide.lens;
        let i = 0;
        while (i < lens.length - 1 && lens[i + 1] < target) i++;
        const segLen = Math.max(1e-6, lens[i + 1] - lens[i]);
        const tSeg = Math.max(0, Math.min(1, (target - lens[i]) / segLen));
        const pA = guide.pts[i];
        const pB = guide.pts[Math.min(i + 1, guide.pts.length - 1)];
        return { x: pA.x + (pB.x - pA.x) * tSeg, y: pA.y + (pB.y - pA.y) * tSeg };
      };

      const useDriftGuide = driftMode === "spline" && driftGuide?.pts.length;
      const driftTotal = useDriftGuide ? driftGuide.total : len;
      const carProgress = useDriftGuide
        ? clamp(t / carTimelineTotal, 0, 1)
        : clamp(progress * carSpeedFactor, 0, 1);
      const driftDist = clamp(carProgress * driftTotal, 0, driftTotal);
      const headDist = clamp(driftDist + HEAD_LEAD_PX, 0, useDriftGuide ? driftTotal : len);
      const sampleStep = Math.max(2, (useDriftGuide ? driftTotal : len) * 0.02);
      const p1 = useDriftGuide ? mapGuide(headDist, driftGuide!) : pathEl.getPointAtLength(headDist);
      const p2 = useDriftGuide
        ? mapGuide(clamp(headDist + sampleStep, 0, driftTotal), driftGuide!)
        : pathEl.getPointAtLength(clamp(headDist + sampleStep, 0, len));
      const p0 = useDriftGuide
        ? mapGuide(clamp(headDist - sampleStep, 0, driftTotal), driftGuide!)
        : pathEl.getPointAtLength(clamp(headDist - sampleStep, 0, len));

      const fwdVec = { x: p2.x - p1.x, y: p2.y - p1.y };
      const backVec = { x: p1.x - p0.x, y: p1.y - p0.y };
      const fwdLen = Math.hypot(fwdVec.x, fwdVec.y);
      const angleFwd = fwdLen > 0.001 ? (Math.atan2(fwdVec.y, fwdVec.x) * 180) / Math.PI : lastAngleRef.current;
      const cross = backVec.x * fwdVec.y - backVec.y * fwdVec.x;
      const driftSign = Math.sign(cross) || 1;
      // Smooth angle changes to reduce jitter on small segments.
      const normalize = (a: number) => {
        let v = a;
        while (v > 180) v -= 360;
        while (v < -180) v += 360;
        return v;
      };
      const prevAngle = lastAngleRef.current || angleFwd;

      let smoothedAngle = prevAngle;
      if (transitionFramesRef.current > 0) {
        transitionFramesRef.current -= 1;
      } else {
        const delta = normalize(angleFwd - prevAngle);
        const clampedDelta = clamp(delta, -MAX_ANGLE_STEP, MAX_ANGLE_STEP);
        smoothedAngle = prevAngle + clampedDelta * ANGLE_SMOOTH;
        lastAngleRef.current = smoothedAngle;
      }

      const driftAngle = smoothedAngle + driftSign * DRIFT_SLIP_DEG;
      const rad = (driftAngle * Math.PI) / 180;
      const lateralX = Math.cos(rad + Math.PI / 2) * DRIFT_LATERAL_PX * driftSign;
      const lateralY = Math.sin(rad + Math.PI / 2) * DRIFT_LATERAL_PX * driftSign;

      if (head) {
        if (active === lastIdx) {
          head.style.display = "none"; // hide car on the final (dot/star) stroke
        } else {
          head.style.display = "block";
          head.setAttribute(
            "transform",
            `translate(${p1.x + lateralX},${p1.y + lateralY}) rotate(${driftAngle}) translate(${-HEAD_SIZE / 2},${-HEAD_SIZE / 2})`
          );
        }
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
              const baseDelay = delays[seqIdx] || seqIdx * perStroke;
              const strokeLag = Math.max(STROKE_LAG_MIN, Math.round(perStroke * STROKE_LAG_RATIO));
              const delay = baseDelay + strokeLag;
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
