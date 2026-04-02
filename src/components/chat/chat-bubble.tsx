interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-[fadeSlideIn_0.25s_ease-out]`}
    >
      {!isUser && (
        <div
          className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm"
          aria-hidden="true"
        >
          🏛️
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 ${
          isUser
            ? 'rounded-[16px] rounded-br-[4px] bg-primary-600 text-white'
            : 'rounded-[16px] rounded-bl-[4px] bg-gray-50 text-gray-900 border border-gray-100'
        }`}
      >
        <div
          className={`whitespace-pre-wrap text-[15px] leading-relaxed ${
            isUser ? '' : '[&_strong]:font-semibold [&_em]:italic'
          }`}
          dangerouslySetInnerHTML={
            !isUser ? { __html: renderBasicMarkdown(content) } : undefined
          }
        >
          {isUser ? content : undefined}
        </div>
      </div>
    </div>
  )
}

function renderBasicMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<span class="block pl-3 before:content-[\'•\'] before:absolute before:left-0 relative">$1</span>')
    .replace(/^\d+\. (.+)$/gm, '<span class="block pl-3">$1</span>')
    .replace(/\n/g, '<br />')
}
