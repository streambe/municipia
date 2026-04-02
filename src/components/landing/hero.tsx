export function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50"
      aria-labelledby="hero-heading"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-primary-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-24 sm:py-32 lg:py-40 text-center">
        {/* Logo mark */}
        <div className="mb-8 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/25">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 24V12l8-6 8 6v12H8z"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="18" r="3" fill="white" />
            <path
              d="M22 26c2-1 4-1 6 0"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 id="hero-heading" className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900">
          Municip
          <span className="text-primary-600">IA</span>
        </h1>

        <p className="mt-6 text-xl sm:text-2xl font-medium text-gray-700 max-w-2xl mx-auto leading-relaxed">
          Tu asistente municipal con inteligencia artificial
        </p>

        <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
          Consult&aacute; informaci&oacute;n sobre tu municipio de forma f&aacute;cil e inmediata
        </p>

        <a
          href="#municipios"
          className="mt-10 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-8 py-3.5 min-h-[44px] text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all duration-200 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Elegí tu municipio
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
