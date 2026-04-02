import type { Municipality } from '@/types/municipality'

interface WelcomeMessageProps {
  municipality: Municipality
  onSuggestionClick?: (text: string) => void
}

export function WelcomeMessage({ municipality, onSuggestionClick }: WelcomeMessageProps) {
  const defaultMessage = `Hola! Soy Muni, tu asistente de ${municipality.name}. Puedo ayudarte con informacion sobre tramites, servicios, horarios, presupuesto, obras y mas. En que te puedo ayudar?`

  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-3xl" aria-hidden="true">
        🏛️
      </div>

      <h2 className="mt-4 text-xl font-semibold text-gray-900">
        {municipality.agent_name}
      </h2>

      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-gray-500">
        {municipality.agent_welcome_message ?? defaultMessage}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {[
          'Que tramites puedo hacer?',
          'Horarios de atencion',
          'Obras en curso',
        ].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestionClick?.(suggestion)}
            className="min-h-[44px] rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-primary-600/30 hover:text-primary-600 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
