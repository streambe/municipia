import type { Municipality } from '@/types/municipality'

interface WelcomeMessageProps {
  municipality: Municipality
}

export function WelcomeMessage({ municipality }: WelcomeMessageProps) {
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
          <span
            key={suggestion}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600"
          >
            {suggestion}
          </span>
        ))}
      </div>
    </div>
  )
}
