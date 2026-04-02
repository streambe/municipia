import { ChatInterface } from '@/components/chat/chat-interface'
import type { Municipality } from '@/types/municipality'

// TODO: Fetch municipality data from Supabase by slug
// For now, using a placeholder
async function getMunicipality(slug: string): Promise<Municipality | null> {
  // TODO: Replace with actual Supabase call
  return {
    id: 'placeholder',
    slug,
    name: `Municipio de ${slug}`,
    province: 'Buenos Aires',
    phone: null,
    website: null,
    email: null,
    address: null,
    agent_name: 'Asistente Municipal',
    agent_welcome_message: null,
    system_prompt_override: null,
    timezone: 'America/Argentina/Buenos_Aires',
    enabled: true,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ municipality: string }>
}) {
  const { municipality: slug } = await params
  const municipality = await getMunicipality(slug)

  if (!municipality) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Municipio no encontrado</p>
      </div>
    )
  }

  return <ChatInterface municipality={municipality} />
}
