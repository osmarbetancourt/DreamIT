"use client";
import React from "react";
import { PlanetConfig } from "@/types/planet";
import { getTechStackIcons, getCategoryIcon } from "@/utils/techIcons";

interface PlanetScannerProps {
  planet: PlanetConfig;
  scanProgress: number; // 0-1 for animation timing
}

export default function PlanetScanner({ planet, scanProgress }: PlanetScannerProps) {
  const { scanningStats } = planet;

  // Get icons for tech stack
  const techIcons = getTechStackIcons(scanningStats.techStack);

  // Get icons for categories
  const projectTypeIcon = getCategoryIcon(scanningStats.projectType);
  const targetUsersIcon = getCategoryIcon(scanningStats.targetUsers);
  const complexityIcon = getCategoryIcon(scanningStats.complexity);
  const statusIcon = getCategoryIcon(scanningStats.status);

  return (
    <div className="w-full h-full bg-black/90 border border-cyan-400/50 rounded-lg p-3 backdrop-blur-sm">
      {/* Scanning line animation */}
      <div
        className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        style={{
          transform: `translateY(${scanProgress * 100}%)`,
          boxShadow: '0 0 10px cyan',
        }}
      />

      {/* Header */}
      <div className="text-center mb-3">
        <h2 className="text-cyan-400 text-sm font-mono font-bold uppercase tracking-wider">
          {planet.name}
        </h2>
        <div className="text-cyan-300/70 text-xs">
          Planetary Scan Complete
        </div>
      </div>

      {/* Tech Stack */}
      <div className="mb-3">
        <div className="text-cyan-400 text-xs font-mono mb-1">TECH STACK</div>
        <div className="flex flex-wrap gap-1 justify-center">
          {techIcons.slice(0, Math.floor(scanProgress * techIcons.length) + 1).map((techIcon, index) => (
            <div
              key={index}
              className="w-6 h-6 bg-cyan-900/50 rounded border border-cyan-400/30 flex items-center justify-center overflow-hidden"
              title={techIcon.name}
            >
              <img
                src={techIcon.icon}
                alt={techIcon.name}
                className="w-4 h-4 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }} // Make icons white
              />
            </div>
          ))}
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-cyan-900/30 rounded p-2">
          <div className="text-cyan-400/70 font-mono text-xs mb-1">TYPE</div>
          <div className="flex items-center gap-1">
            {projectTypeIcon && (
              <img
                src={projectTypeIcon.icon}
                alt={projectTypeIcon.name}
                className="w-4 h-4 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            )}
            <span className="text-cyan-200 text-xs capitalize">
              {scanningStats.projectType.replace('-', ' ')}
            </span>
          </div>
        </div>

        <div className="bg-cyan-900/30 rounded p-2">
          <div className="text-cyan-400/70 font-mono text-xs mb-1">USERS</div>
          <div className="flex items-center gap-1">
            {targetUsersIcon && (
              <img
                src={targetUsersIcon.icon}
                alt={targetUsersIcon.name}
                className="w-4 h-4 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            )}
            <span className="text-cyan-200 text-xs capitalize">
              {scanningStats.targetUsers.replace('-', ' ')}
            </span>
          </div>
        </div>

        <div className="bg-cyan-900/30 rounded p-2">
          <div className="text-cyan-400/70 font-mono text-xs mb-1">COMPLEXITY</div>
          <div className="flex items-center gap-1">
            {complexityIcon && (
              <img
                src={complexityIcon.icon}
                alt={complexityIcon.name}
                className="w-4 h-4 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            )}
            <span className="text-cyan-200 text-xs capitalize">
              {scanningStats.complexity.replace('-', ' ')}
            </span>
          </div>
        </div>

        <div className="bg-cyan-900/30 rounded p-2">
          <div className="text-cyan-400/70 font-mono text-xs mb-1">STATUS</div>
          <div className="flex items-center gap-1">
            {statusIcon && (
              <img
                src={statusIcon.icon}
                alt={statusIcon.name}
                className="w-4 h-4 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            )}
            <span className="text-cyan-200 text-xs capitalize">
              {scanningStats.status.replace('-', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Scan Progress Bar */}
      <div className="mt-3">
        <div className="w-full bg-cyan-900/50 rounded-full h-1">
          <div
            className="bg-gradient-to-r from-cyan-400 to-cyan-300 h-1 rounded-full transition-all duration-300"
            style={{ width: `${scanProgress * 100}%` }}
          />
        </div>
        <div className="text-center text-cyan-400/50 text-xs mt-1 font-mono">
          SCAN: {Math.round(scanProgress * 100)}%
        </div>
      </div>
    </div>
  );
}