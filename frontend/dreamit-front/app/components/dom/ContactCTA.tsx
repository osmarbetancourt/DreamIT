"use client";
import React, { useState } from "react";

export default function ContactCTA({ lang = "en" }: { lang?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const toggle = () => setOpen((v) => !v);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mailto fallback: opens user's mail client with prefilled body
    const subject = encodeURIComponent("DreamIT enquiry from " + (name || "website"));
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`);
    window.location.href = `mailto:osmar.betancourt@dreamit.example?subject=${subject}&body=${body}`;
  };

  const label = lang === "es" ? "Contáctanos" : "Contact";

  return (
    <div>
      {/* Social bar removed - icons live inside the modal footer only */}
      <button
        onClick={toggle}
        className="fixed right-4 top-4 z-50 rounded-full bg-white/10 backdrop-blur px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 focus:outline-none"
        aria-expanded={open}
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <form
            onSubmit={submit}
            className="relative z-10 w-full max-w-md rounded-lg bg-white/5 p-6 backdrop-blur-md text-white"
          >
            <h3 className="mb-2 text-lg font-semibold">{label}</h3>
            {/* small action links removed; social icons in footer below */}
            <label className="block mb-2 text-sm">
              <div className="text-xs text-white/80">Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded bg-white/5 p-2 text-white placeholder-white/60" placeholder="Your name" />
            </label>
            <label className="block mb-2 text-sm">
              <div className="text-xs text-white/80">Email</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded bg-white/5 p-2 text-white placeholder-white/60" placeholder="you@company.com" />
            </label>
            <label className="block mb-2 text-sm">
              <div className="text-xs text-white/80">Phone</div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded bg-white/5 p-2 text-white placeholder-white/60" placeholder="Optional" />
            </label>
            <label className="block mb-4 text-sm">
              <div className="text-xs text-white/80">Message</div>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full rounded bg-white/5 p-2 text-white placeholder-white/60" rows={4} placeholder="Tell us about your project" />
            </label>

            <div className="flex items-center justify-between">
              <button type="submit" className="rounded bg-amber-400 px-4 py-2 font-semibold text-black">Send</button>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-white/80">Cancel</button>
            </div>

            {/* Footer social icons (only Instagram, LinkedIn, GitHub) */}
            <div className="mt-4 flex items-center justify-center gap-6">
              <a href="https://www.instagram.com/dreamit.software" target="_blank" rel="noreferrer" aria-label="Instagram" className="filter brightness-0 invert hover:sepia hover:saturate-[5] hover:hue-rotate-[45deg] transition-all">
                <img src="https://simpleicons.org/icons/instagram.svg" alt="Instagram" width="22" height="22" />
              </a>
              <a href="https://www.linkedin.com/company/dreamit-software/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="filter brightness-0 invert hover:sepia hover:saturate-[5] hover:hue-rotate-[45deg] transition-all">
                <img src="/icons8-linkedin.svg" alt="LinkedIn" width="22" height="22" />
              </a>
              <a href="https://tiktok.com/@dreamit.software" target="_blank" rel="noreferrer" aria-label="TikTok" className="filter brightness-0 invert hover:sepia hover:saturate-[5] hover:hue-rotate-[45deg] transition-all">
                <img src="https://simpleicons.org/icons/tiktok.svg" alt="TikTok" width="22" height="22" />
              </a>
              <a href="https://github.com/DreamIT-VE" target="_blank" rel="noreferrer" aria-label="GitHub" className="filter brightness-0 invert hover:sepia hover:saturate-[5] hover:hue-rotate-[45deg] transition-all">
                <img src="https://simpleicons.org/icons/github.svg" alt="GitHub" width="22" height="22" />
              </a>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
