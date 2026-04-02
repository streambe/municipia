'use client'

import Link from 'next/link'

interface ChatHeaderProps {
  municipalityName: string
  onNewChat: () => void
}

export function ChatHeader({ municipalityName, onNewChat }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="min-h-[44px] min-w-[44px] inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          aria-label="Volver al selector de municipios"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline">Volver</span>
        </Link>

        <div className="h-5 w-px bg-gray-200 hidden sm:block" aria-hidden="true" />

        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🏛️</span>
          <h1 className="text-base font-semibold text-gray-900 md:text-lg truncate max-w-[200px] sm:max-w-none">
            {municipalityName}
          </h1>
        </div>
      </div>

      <button
        onClick={onNewChat}
        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        aria-label="Iniciar nueva conversacion"
      >
        <span className="hidden sm:inline">Nuevo chat</span>
        <svg
          className="sm:hidden h-5 w-5"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 4V16M4 10H16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </header>
  )
}
