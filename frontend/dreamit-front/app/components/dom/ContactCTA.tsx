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
    window.location.href = `mailto:hello@dreamit.example?subject=${subject}&body=${body}`;
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
              <a href="https://instagram.com/dreamit" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-white/90 hover:text-amber-300">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.2"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.2"/><circle cx="17.5" cy="6.5" r="0.7" fill="currentColor"/></svg>
              </a>
              <a href="https://linkedin.com/company/dreamit" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-white/90 hover:text-amber-300">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M8 11v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M8 8v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M12 11v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M16 11v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M12 11c0-1.1 1-2 2-2s2 .9 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </a>
              <a href="https://github.com/DreamIT-VE" target="_blank" rel="noreferrer" aria-label="GitHub" className="text-white/90 hover:text-amber-300">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.2-3.37-1.2-.45-1.14-1.1-1.44-1.1-1.44-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.71.115 2.51.337 1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85 0 1.33-.01 2.4-.01 2.73 0 .27.18.58.69.48A10 10 0 0022 12c0-5.52-4.48-10-10-10z" stroke="currentColor" strokeWidth="0.6"/></svg>
              </a>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
