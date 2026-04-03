'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { ChatBubble } from './chat-bubble'
import { ChatInput } from './chat-input'
import { ChatHeader } from './chat-header'
import { WelcomeMessage } from './welcome-message'
import { DisclaimerBanner } from './disclaimer-banner'
import { TypingIndicator } from './typing-indicator'
import type { Municipality } from '@/types/municipality'

interface ChatInterfaceProps {
  municipality: Municipality
}

function getMessageText(msg: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!msg.parts) return ''
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
}

export function ChatInterface({ municipality }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<{ focus: () => void }>(null)
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [input, setInput] = useState('')

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: '/api/chat',
        body: { municipalityId: municipality.slug },
      }),
    [municipality.slug],
  )

  const { messages, status, sendMessage, setMessages } = useChat({
    transport,
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleNewChat = () => {
    setMessages([])
    setInput('')
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    sendMessage({ text })
    // Return focus to input after sending
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className="flex flex-col h-dvh bg-white">
      <ChatHeader
        municipalityName={municipality.name}
        onNewChat={handleNewChat}
      />

      {showDisclaimer && (
        <DisclaimerBanner onDismiss={() => setShowDisclaimer(false)} />
      )}

      <main
        id="main-content"
        className="flex-1 overflow-y-auto"
        role="log"
        aria-label="Mensajes del chat"
        aria-live="polite"
      >
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <WelcomeMessage
              municipality={municipality}
              onSuggestionClick={(text) => {
                setInput(text)
              }}
            />
          )}

          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              role={msg.role as 'user' | 'assistant'}
              content={getMessageText(msg)}
            />
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <TypingIndicator />
          )}

          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      </main>

      <ChatInput
        ref={inputRef}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        isLoading={isLoading}
        municipalityName={municipality.name}
      />
    </div>
  )
}
