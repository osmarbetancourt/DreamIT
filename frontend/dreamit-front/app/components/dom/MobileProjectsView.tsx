"use client";
import React from "react";

interface Project {
  id: string;
  title: string;
  tagline?: string;
  hexColor?: string;
}

interface MobileProjectsViewProps {
  projects: Project[];
  locale: 'en' | 'es';
}

export default function MobileProjectsView({ projects, locale }: MobileProjectsViewProps) {
  const isSpanish = locale === 'es';

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-20">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-4">
          {isSpanish ? 'Nuestros proyectos' : 'Our projects'}
        </h1>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">
          {isSpanish
            ? 'Explora una selección de trabajos destacados que demuestran nuestra experiencia.'
            : 'Explore a selection of highlighted projects that showcase our expertise.'
          }
        </p>
      </div>

      {/* Projects Grid */}
      <div className="max-w-4xl mx-auto space-y-6">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="bg-zinc-900/50 backdrop-blur-sm rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-colors"
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            {/* Project Color Indicator */}
            <div
              className="w-4 h-4 rounded-full mb-4"
              style={{ backgroundColor: project.hexColor || '#666' }}
            />

            {/* Project Title */}
            <h3 className="text-xl font-semibold mb-2 text-white">
              {project.title}
            </h3>

            {/* Project Tagline */}
            {project.tagline && (
              <p className="text-zinc-300 mb-4">
                {project.tagline}
              </p>
            )}

            {/* Project Actions */}
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-sm font-medium transition-colors">
                {isSpanish ? 'Ver detalles' : 'View details'}
              </button>
              <button className="px-4 py-2 border border-zinc-600 hover:border-zinc-500 rounded-md text-sm font-medium transition-colors">
                {isSpanish ? 'Visitar' : 'Visit'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12 mb-8">
        <p className="text-zinc-400 mb-4">
          {isSpanish
            ? '¿Interesado en trabajar juntos?'
            : 'Interested in working together?'
          }
        </p>
        <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 rounded-lg font-medium transition-all">
          {isSpanish ? 'Contactanos' : 'Contact us'}
        </button>
      </div>
    </div>
  );
}