import ContactCTA from "../../components/dom/ContactCTA";

export default function ContactPage({ params }: { params: { lang: string } }) {
  const { lang } = params;
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl">
        <h1 className="mb-4 text-3xl font-bold">{lang === 'es' ? 'Contáctanos' : 'Contact'}</h1>
        <p className="mb-6 text-white/80">{lang === 'es' ? 'Rellena el formulario o envíanos un correo.' : 'Fill the form or send us an email.'}</p>

        {/* Reuse the CTA component as an inline form opener */}
        <ContactCTA lang={lang} />

        <div className="mt-10 text-sm text-white/70">Or email us directly: osmar.betancourt@dreamit.example</div>
      </div>
    </div>
  );
}
