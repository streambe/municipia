'use client'

import { useRef, useEffect, useImperativeHandle, type KeyboardEvent, type Ref } from 'react'

interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  isLoading: boolean
  municipalityName: string
  ref?: Ref<{ focus: () => void }>
}

export function ChatInput({
  input,
  onInputChange,
  onSend,
  isLoading,
  municipalityName,
  ref,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }))

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`
  }, [input])

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3 md:px-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSend()
        }}
        className="mx-auto flex max-w-3xl items-end gap-2"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Escribi tu pregunta sobre ${municipalityName}...`}
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none rounded-3xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-600 disabled:opacity-50"
          aria-label={`Escribi tu pregunta sobre ${municipalityName}`}
        />

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white transition-all hover:bg-primary-700 disabled:opacity-40 disabled:hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          aria-label="Enviar mensaje"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 10L17 3L10 17L9 11L3 10Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </form>
    </div>
  )
}
