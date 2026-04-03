'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
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

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function ChatInterface({ municipality }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<{ focus: () => void }>(null)
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleNewChat = () => {
    setMessages([])
    setInput('')
  }

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }

    const allMessages = [...messages, userMessage]
    setMessages(allMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          municipalityId: municipality.slug,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: errText || 'Hubo un error. Por favor intentá de nuevo.',
        }])
        setIsLoading(false)
        return
      }

      // Read streaming response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      const assistantId = crypto.randomUUID()

      // Add empty assistant message
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantContent += decoder.decode(value, { stream: true })
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
          )
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'No pude conectarme al servidor. Por favor intentá de nuevo más tarde.',
      }])
    } finally {
      setIsLoading(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [input, isLoading, messages, municipality.slug])

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
              role={msg.role}
              content={msg.content}
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
