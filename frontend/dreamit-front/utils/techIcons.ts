// /utils/techIcons.ts
// Tech stack and category icons for planet scanning UI
// Using Simple Icons (same as CV) + additional category icons

export interface TechIcon {
  name: string;
  icon: string; // Simple Icons URL or FontAwesome class
  color: string;
  category: 'language' | 'framework' | 'cloud' | 'database' | 'tool' | 'project-type' | 'target-users' | 'complexity' | 'status';
}

// Core tech stack from CV
export const TECH_STACK_ICONS: Record<string, TechIcon> = {
  // Languages
  'Python': {
    name: 'Python',
    icon: 'https://cdn.simpleicons.org/python/3776AB',
    color: '#3776AB',
    category: 'language'
  },
  'JavaScript': {
    name: 'JavaScript',
    icon: 'https://cdn.simpleicons.org/javascript/F7DF1E',
    color: '#F7DF1E',
    category: 'language'
  },
  'TypeScript': {
    name: 'TypeScript',
    icon: 'https://cdn.simpleicons.org/typescript/3178C6',
    color: '#3178C6',
    category: 'language'
  },
  'Rust': {
    name: 'Rust',
    icon: 'https://cdn.simpleicons.org/rust/000000',
    color: '#000000',
    category: 'language'
  },
  'C#': {
    name: 'C#',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Csharp_Logo.png',
    color: '#239120',
    category: 'language'
  },

  // Frameworks & Libraries
  'React': {
    name: 'React',
    icon: 'https://cdn.simpleicons.org/react/61DAFB',
    color: '#61DAFB',
    category: 'framework'
  },
  'Next.js': {
    name: 'Next.js',
    icon: 'https://cdn.simpleicons.org/nextdotjs/000000',
    color: '#000000',
    category: 'framework'
  },
  'Django': {
    name: 'Django',
    icon: 'https://cdn.simpleicons.org/django/092E20',
    color: '#092E20',
    category: 'framework'
  },
  'Unity': {
    name: 'Unity',
    icon: 'https://cdn.simpleicons.org/unity/000000',
    color: '#000000',
    category: 'framework'
  },

  // Cloud & Infrastructure
  'AWS': {
    name: 'AWS',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
    color: '#FF9900',
    category: 'cloud'
  },
  'Google Cloud': {
    name: 'Google Cloud',
    icon: 'https://cdn.simpleicons.org/googlecloud/4285F4',
    color: '#4285F4',
    category: 'cloud'
  },
  'Hetzner': {
    name: 'Hetzner',
    icon: 'https://cdn.simpleicons.org/hetzner/D50C2D',
    color: '#D50C2D',
    category: 'cloud'
  },
  'Render': {
    name: 'Render',
    icon: 'https://cdn.simpleicons.org/render/000000',
    color: '#000000',
    category: 'cloud'
  },
  'Docker': {
    name: 'Docker',
    icon: 'https://cdn.simpleicons.org/docker/2496ED',
    color: '#2496ED',
    category: 'tool'
  },
  'Kubernetes': {
    name: 'Kubernetes',
    icon: 'https://cdn.simpleicons.org/kubernetes/326CE5',
    color: '#326CE5',
    category: 'tool'
  },

  // Databases
  'PostgreSQL': {
    name: 'PostgreSQL',
    icon: 'https://cdn.simpleicons.org/postgresql/4169E1',
    color: '#4169E1',
    category: 'database'
  },
  'MySQL': {
    name: 'MySQL',
    icon: 'https://cdn.simpleicons.org/mysql/4479A1',
    color: '#4479A1',
    category: 'database'
  },
  'MongoDB': {
    name: 'MongoDB',
    icon: 'https://cdn.simpleicons.org/mongodb/47A248',
    color: '#47A248',
    category: 'database'
  },
  'Pinecone': {
    name: 'Pinecone',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Logo_C_sharp.svg',
    color: '#000000',
    category: 'database'
  },

  // AI/ML
  'PyTorch': {
    name: 'PyTorch',
    icon: 'https://cdn.simpleicons.org/pytorch/EE4C2C',
    color: '#EE4C2C',
    category: 'framework'
  },
  'Hugging Face': {
    name: 'Hugging Face',
    icon: 'https://cdn.simpleicons.org/huggingface/fcc419',
    color: '#FCC419',
    category: 'tool'
  },
  'OpenAI': {
    name: 'OpenAI',
    icon: 'https://cdn.simpleicons.org/openai/412991',
    color: '#412991',
    category: 'tool'
  },
  'Google Vertex AI': {
    name: 'Google Vertex AI',
    icon: 'https://cdn.simpleicons.org/googlecloud/4285F4',
    color: '#4285F4',
    category: 'tool'
  },

  // DevOps & Tools
  'GitHub': {
    name: 'GitHub',
    icon: 'https://cdn.simpleicons.org/github/181717',
    color: '#181717',
    category: 'tool'
  },
  'GitHub Actions': {
    name: 'GitHub Actions',
    icon: 'https://cdn.simpleicons.org/githubactions/2088FF',
    color: '#2088FF',
    category: 'tool'
  },
  'Jira': {
    name: 'Jira',
    icon: 'https://cdn.simpleicons.org/jirasoftware/0052CC',
    color: '#0052CC',
    category: 'tool'
  }
};

// Category icons for scanning stats
export const CATEGORY_ICONS: Record<string, TechIcon> = {
  // Project Types
  'web-app': {
    name: 'Web Application',
    icon: '🌐',
    color: '#3B82F6',
    category: 'project-type'
  },
  'mobile-app': {
    name: 'Mobile App',
    icon: '📱',
    color: '#10B981',
    category: 'project-type'
  },
  'enterprise': {
    name: 'Enterprise Platform',
    icon: '🏢',
    color: '#8B5CF6',
    category: 'project-type'
  },
  'ai-solution': {
    name: 'AI Solution',
    icon: '🤖',
    color: '#F59E0B',
    category: 'project-type'
  },
  'game': {
    name: 'Game Development',
    icon: '🎮',
    color: '#EF4444',
    category: 'project-type'
  },
  'api': {
    name: 'API/Backend',
    icon: '🔧',
    color: '#6B7280',
    category: 'project-type'
  },

  // Target Users
  'b2b-enterprise': {
    name: 'B2B Enterprise',
    icon: '🏢',
    color: '#1E40AF',
    category: 'target-users'
  },
  'b2c-consumers': {
    name: 'B2C Consumers',
    icon: '👥',
    color: '#059669',
    category: 'target-users'
  },
  'internal-tools': {
    name: 'Internal Tools',
    icon: '🔧',
    color: '#7C3AED',
    category: 'target-users'
  },
  'global-scale': {
    name: 'Global Scale',
    icon: '🌍',
    color: '#DC2626',
    category: 'target-users'
  },

  // Complexity
  'minimal-viable': {
    name: 'Minimal Viable',
    icon: '📱',
    color: '#10B981',
    category: 'complexity'
  },
  'full-featured': {
    name: 'Full-Featured',
    icon: '⚖️',
    color: '#3B82F6',
    category: 'complexity'
  },
  'enterprise-grade': {
    name: 'Enterprise-Grade',
    icon: '🏗️',
    color: '#8B5CF6',
    category: 'complexity'
  },
  'cutting-edge': {
    name: 'Cutting-Edge',
    icon: '🚀',
    color: '#F59E0B',
    category: 'complexity'
  },

  // Status
  'active-development': {
    name: 'Active Development',
    icon: '⚡',
    color: '#10B981',
    category: 'status'
  },
  'production-ready': {
    name: 'Production Ready',
    icon: '✅',
    color: '#059669',
    category: 'status'
  },
  'recently-completed': {
    name: 'Recently Completed',
    icon: '🏆',
    color: '#F59E0B',
    category: 'status'
  },
  'prototype': {
    name: 'Prototype',
    icon: '🔄',
    color: '#6B7280',
    category: 'status'
  }
};

// Helper functions
export function getTechIcon(techName: string): TechIcon | undefined {
  return TECH_STACK_ICONS[techName];
}

export function getCategoryIcon(categoryKey: string): TechIcon | undefined {
  return CATEGORY_ICONS[categoryKey];
}

export function getTechStackIcons(techNames: string[]): TechIcon[] {
  return techNames.map(name => TECH_STACK_ICONS[name]).filter(Boolean);
}