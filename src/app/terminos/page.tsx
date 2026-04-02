import Link from "next/link";

export default function TerminosPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main id="main-content" className="flex-1 mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M14 8a.75.75 0 01-.75.75H4.56l3.22 3.22a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06l4.5-4.5a.75.75 0 011.06 1.06L4.56 7.25h8.69A.75.75 0 0114 8z" clipRule="evenodd" />
          </svg>
          Volver al inicio
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
          Términos de Uso
        </h1>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            Al usar MunicipIA aceptás las siguientes condiciones de uso.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 pt-4">Uso del servicio</h2>
          <p>
            MunicipIA proporciona respuestas orientativas basadas en información
            pública municipal. Las respuestas son generadas por inteligencia
            artificial y <strong>no constituyen asesoramiento legal, médico ni
            financiero</strong>.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 pt-4">Limitación de responsabilidad</h2>
          <p>
            La información proporcionada puede no estar actualizada o contener
            inexactitudes. Para confirmación oficial, contactá directamente al
            municipio correspondiente. Streambe no se responsabiliza por decisiones
            tomadas en base a las respuestas del asistente.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 pt-4">Uso aceptable</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Consultá información municipal de forma responsable</li>
            <li>No uses el servicio para actividades ilegales o fraudulentas</li>
            <li>No intentes vulnerar la seguridad del sistema</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 pt-4">Licencia</h2>
          <p>
            MunicipIA es software libre distribuido bajo licencia MIT. El código
            fuente está disponible públicamente en GitHub.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 pt-4">Contacto</h2>
          <p>
            Para consultas sobre estos términos, escribinos a{" "}
            <a
              href="mailto:contacto@streambe.com"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              contacto@streambe.com
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
