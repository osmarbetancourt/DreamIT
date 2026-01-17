"use client";

import React from "react";

export type CarIconProps = {
  width?: number;
  height?: number;
  className?: string;
};

const CarIcon: React.FC<CarIconProps> = ({ width = 140, height = 70, className }) => {
  return (
    <div style={{ width, height }} className={className} aria-hidden>
      <svg viewBox="0 0 140 70" width="100%" height="100%">
        <rect x="10" y="10" width="120" height="50" rx="10" fill="#f7f7f7" stroke="#111" strokeWidth="2" />
        <rect x="18" y="16" width="104" height="22" rx="6" fill="#dcdcdc" stroke="#111" strokeWidth="1.5" />
        <rect x="10" y="38" width="120" height="8" fill="#111" />
        <rect x="24" y="20" width="32" height="14" rx="2" fill="#9fb8d0" stroke="#111" strokeWidth="1" />
        <rect x="64" y="20" width="52" height="14" rx="2" fill="#9fb8d0" stroke="#111" strokeWidth="1" />
        <circle cx="32" cy="54" r="10" fill="#111" />
        <circle cx="108" cy="54" r="10" fill="#111" />
        <circle cx="32" cy="54" r="4" fill="#e9e9e9" />
        <circle cx="108" cy="54" r="4" fill="#e9e9e9" />
        <rect x="18" y="14" width="20" height="4" fill="#f5d24b" stroke="#111" strokeWidth="1" />
        <rect x="102" y="52" width="18" height="4" fill="#f25b5b" stroke="#111" strokeWidth="1" />
        <line x1="10" y1="33" x2="130" y2="33" stroke="#111" strokeWidth="1" />
      </svg>
    </div>
  );
};

export default CarIcon;
