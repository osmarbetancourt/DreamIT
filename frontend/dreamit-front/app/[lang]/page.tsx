// Notice: NO "use client" at the top. This is now a Server Component.
import React from 'react';
import HeroInteractive from '../components/HeroInteractive';
import { getDictionary } from '../dictionaries/get-dictionary';

// Define the interface for the Page props
interface PageProps {
  params: Promise<{ lang: 'en' | 'es' }>;
}

export default async function Home({ params }: PageProps) {
  // 1. Await the params to get the language (en or es)
  const { lang } = await params;

  // 2. Fetch the dictionary for that language (runs on server)
  const dict = await getDictionary(lang);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="w-full max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur">
        {/* 3. Pass the translated text to the interactive component */}
        <HeroInteractive 
          title={dict.hero.title}
          subtitle={dict.hero.subtitle}
        />
      </div>
    </div>
  );
}