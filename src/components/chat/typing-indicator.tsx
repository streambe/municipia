export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-[fadeSlideIn_0.25s_ease-out]">
      <div
        className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm"
        aria-hidden="true"
      >
        🏛️
      </div>
      <div
        className="flex items-center gap-1 rounded-[16px] rounded-bl-[4px] border border-gray-100 bg-gray-50 px-4 py-3"
        role="status"
        aria-label="El asistente esta escribiendo"
      >
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-[pulse_1.4s_ease-in-out_infinite]" />
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
      </div>
    </div>
  )
}
