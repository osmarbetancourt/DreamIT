"use client";
import React from "react";

export default function MobileFallback() {
  return (
    <div className="p-6 text-center text-zinc-50 dreamit-hidden-for-loader">
      <h2 className="text-2xl font-bold">DreamIT</h2>
      <p className="mt-2 text-zinc-300">Interactive canvas disabled for low-power or mobile devices.</p>
    </div>
  );
}
