export interface Municipality {
  id: string
  slug: string
  name: string
  province: string
  phone: string | null
  website: string | null
  email: string | null
  address: string | null
  agent_name: string
  agent_welcome_message: string | null
  system_prompt_override: string | null
  timezone: string
  enabled: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}
