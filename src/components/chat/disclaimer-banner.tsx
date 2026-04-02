'use client'

interface DisclaimerBannerProps {
  onDismiss: () => void
}

export function DisclaimerBanner({ onDismiss }: DisclaimerBannerProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b border-disclaimer-border bg-disclaimer-bg px-4 py-2"
      role="status"
    >
      <p className="text-xs leading-relaxed text-disclaimer-text">
        Las respuestas son generadas por IA y pueden contener errores. Para
        informacion oficial, consulta los canales del municipio.
      </p>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 text-disclaimer-text/60 transition-colors hover:text-disclaimer-text"
        aria-label="Cerrar aviso"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
