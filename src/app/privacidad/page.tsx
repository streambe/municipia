import Link from "next/link";

export default function PrivacidadPage() {
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
          Política de Privacidad
        </h1>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            MunicipIA es un proyecto open source de responsabilidad social empresaria
            desarrollado por Streambe. Nos comprometemos a proteger la privacidad de
            los usuarios en cumplimiento con la Ley 25.326 de Protección de Datos
            Personales de la República Argentina.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 pt-4">Datos que procesamos</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Mensajes de chat anonimizados, sin datos personales identificables</li>
            <li>Métricas de uso agregadas (cantidad de consultas por municipio)</li>
            <li>No recopilamos nombres, emails ni información de contacto</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 pt-4">Retención de datos</h2>
          <p>
            Las conversaciones se almacenan de forma anonimizada por un período
            máximo de 90 días con fines de mejora del servicio. Transcurrido ese
            plazo, se eliminan automáticamente.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 pt-4">Tus derechos</h2>
          <p>
            De acuerdo con la Ley 25.326, tenés derecho a acceder, rectificar y
            suprimir tus datos personales. Dado que no recopilamos datos personales
            identificables, este derecho se aplica de forma limitada. Para cualquier
            consulta, contactanos a{" "}
            <a
              href="mailto:contacto@streambe.com"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              contacto@streambe.com
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold text-gray-900 pt-4">Cookies</h2>
          <p>
            MunicipIA no utiliza cookies de seguimiento ni de publicidad. Solo
            utilizamos cookies técnicas esenciales para el funcionamiento del
            servicio.
          </p>
        </div>
      </main>
    </div>
  );
}
