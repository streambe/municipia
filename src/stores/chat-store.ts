import { create } from 'zustand'
import type { Message } from '@/types/conversation'

interface ChatState {
  messages: Message[]
  isLoading: boolean
  conversationId: string | null
  activeMunicipalitySlug: string | null
  addMessage: (message: Message) => void
  setLoading: (loading: boolean) => void
  setConversationId: (id: string) => void
  setActiveMunicipality: (slug: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  conversationId: null,
  activeMunicipalitySlug: null,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setConversationId: (id) => set({ conversationId: id }),
  setActiveMunicipality: (slug) => set({ activeMunicipalitySlug: slug }),
  clearMessages: () => set({ messages: [], conversationId: null }),
}))
