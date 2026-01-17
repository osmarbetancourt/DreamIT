"use client";

import WriteAnimation from "./components/WriteAnimation";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="w-full max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur">
        <WriteAnimation durationMs={3200} />
      </div>
    </div>
  );
}
