"use client";
import React from "react";
import { useRouter, useParams } from "next/navigation";

export default function HomeButton() {
  const router = useRouter();
  const params = useParams();
  const lang = params?.lang || 'en';

  const handleHome = () => {
    router.push(`/${lang}`);
  };

  return (
    <button
      onClick={handleHome}
      className="fixed left-4 top-4 z-50 rounded-full bg-white/10 backdrop-blur px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 focus:outline-none transition-colors"
      aria-label="Go to home"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    </button>
  );
}