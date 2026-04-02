import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          {/* Brand */}
          <div>
            <p className="text-lg font-bold text-gray-900">
              Municip<span className="text-primary-600">IA</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Un proyecto de{" "}
              <span className="font-medium text-gray-700">Streambe</span> — RSE
            </p>
          </div>

          {/* Nav */}
          <nav aria-label="Pie de pagina" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link
              href="/privacidad"
              className="min-h-[44px] min-w-[44px] inline-flex items-center text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-900 hover:decoration-gray-900 transition-colors"
            >
              Politica de privacidad
            </Link>
            <Link
              href="/terminos"
              className="min-h-[44px] min-w-[44px] inline-flex items-center text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-900 hover:decoration-gray-900 transition-colors"
            >
              Terminos de uso
            </Link>
            <a
              href="https://github.com/streambe"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] min-w-[44px] inline-flex items-center text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-900 hover:decoration-gray-900 transition-colors"
            >
              GitHub<span className="sr-only"> (abre en nueva ventana)</span>
            </a>
            <a
              href="mailto:contacto@streambe.com"
              className="min-h-[44px] min-w-[44px] inline-flex items-center text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-900 hover:decoration-gray-900 transition-colors"
            >
              Contacto
            </a>
          </nav>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-lg bg-disclaimer-bg border border-disclaimer-border px-4 py-3" role="note" aria-label="Aviso legal">
          <p className="text-sm text-disclaimer-text leading-relaxed">
            <strong>Aviso:</strong> Las respuestas son generadas por inteligencia
            artificial y pueden contener errores. Para información oficial,
            contactá directamente a tu municipio.
          </p>
        </div>

        {/* Copyright */}
        <p className="mt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} MunicipIA — Streambe. Todos los
          derechos reservados.
        </p>
      </div>
    </footer>
  );
}
