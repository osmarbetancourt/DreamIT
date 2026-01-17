"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  durationMs?: number; // total duration for all strokes
  className?: string;
};

const FALLBACK_VIEWBOX = "0 0 1024 1024";
const STROKE_COLOR = "#0ea5e9";

function parseViewBox(vb: string) {
  const parts = vb.split(/\s+/).map(Number);
  if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
    return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
  }
  return { x: 0, y: 0, width: 1024, height: 1024 };
}

const WriteAnimation: React.FC<Props> = ({ durationMs = 5600, className }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
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
              const perStroke = Math.max(500, durationMs / paths.length);
              const delay = seqIdx * perStroke;
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
