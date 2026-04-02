export function AboutSection() {
  return (
    <section
      className="py-20 sm:py-24 px-4"
      aria-labelledby="about-heading"
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2
            id="about-heading"
            className="text-3xl sm:text-4xl font-bold text-gray-900"
          >
            Sobre MunicipIA
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Acercamos la información municipal a los ciudadanos mediante
            inteligencia artificial, de forma gratuita y abierta.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <AboutCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            title="Gratuito"
            description="Sin costo para los ciudadanos. Acceso libre a información municipal las 24 horas."
          />
          <AboutCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            title="Open Source"
            description="Código abierto y transparente. Cualquier municipio puede sumarse al proyecto."
          />
          <AboutCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            }
            title="IA Conversacional"
            description="Respuestas claras y naturales potenciadas por inteligencia artificial."
          />
          <AboutCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                <path d="M3.6 9h16.8M3.6 15h16.8" />
                <path d="M12 3a15.3 15.3 0 014 18 15.3 15.3 0 01-8 0A15.3 15.3 0 0112 3z" />
              </svg>
            }
            title="RSE de Streambe"
            description="Un proyecto de Responsabilidad Social Empresaria que busca impacto real en la comunidad."
          />
        </div>
      </div>
    </section>
  );
}

function AboutCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
