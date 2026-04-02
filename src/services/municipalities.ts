import { createServerClient } from '@/lib/supabase/server'
import type { Municipality } from '@/types/municipality'

export async function getMunicipalities(): Promise<Municipality[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('municipalities')
    .select('*')
    .eq('enabled', true)
    .order('name')

  if (error) throw error
  return data as Municipality[]
}

export async function getMunicipalityBySlug(
  slug: string
): Promise<Municipality | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('municipalities')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (error) return null
  return data as Municipality
}

export async function getMunicipalityById(
  id: string
): Promise<Municipality | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('municipalities')
    .select('*')
    .eq('id', id)
    .eq('enabled', true)
    .single()

  if (error) return null
  return data as Municipality
}

/**
 * Seed data for the 8 initial municipalities.
 * Used for local development and initial DB population.
 */
export const SEED_MUNICIPALITIES = [
  {
    slug: 'vicente-lopez',
    name: 'Vicente López',
    province: 'Buenos Aires',
    phone: '(011) 4510-5000',
    website: 'https://www.vicentelopez.gov.ar',
    address: 'Av. Maipú 2609',
    agent_name: 'Asistente de Vicente López',
    enabled: true,
  },
  {
    slug: 'san-isidro',
    name: 'San Isidro',
    province: 'Buenos Aires',
    phone: '(011) 4512-3131',
    website: 'https://www.sanisidro.gob.ar',
    address: '9 de Julio 2150',
    agent_name: 'Asistente de San Isidro',
    enabled: true,
  },
  {
    slug: 'moron',
    name: 'Morón',
    province: 'Buenos Aires',
    phone: '(011) 4489-5500',
    website: 'https://www.moron.gob.ar',
    address: 'Almirante Brown 901',
    agent_name: 'Asistente de Morón',
    enabled: true,
  },
  {
    slug: 'la-plata',
    name: 'La Plata',
    province: 'Buenos Aires',
    phone: '(0221) 427-6691',
    website: 'https://www.laplata.gob.ar',
    address: 'Calle 12 entre 51 y 53',
    agent_name: 'Asistente de La Plata',
    enabled: true,
  },
  {
    slug: 'lanus',
    name: 'Lanús',
    province: 'Buenos Aires',
    phone: '(011) 4241-7070',
    website: 'https://www.lanus.gob.ar',
    address: 'Av. Hipólito Yrigoyen 3863',
    agent_name: 'Asistente de Lanús',
    enabled: true,
  },
  {
    slug: 'general-rodriguez',
    name: 'General Rodríguez',
    province: 'Buenos Aires',
    phone: '(0237) 484-0054',
    website: 'https://www.generalrodriguez.gob.ar',
    address: 'Av. Pres. Perón 635',
    agent_name: 'Asistente de General Rodríguez',
    enabled: true,
  },
  {
    slug: 'ameghino',
    name: 'Florentino Ameghino',
    province: 'Buenos Aires',
    phone: '(0336) 449-1000',
    website: 'https://www.ameghino.gob.ar',
    address: 'Av. Mitre 200',
    agent_name: 'Asistente de Ameghino',
    enabled: true,
  },
  {
    slug: 'tigre',
    name: 'Tigre',
    province: 'Buenos Aires',
    phone: '(011) 4512-7800',
    website: 'https://www.tigre.gob.ar',
    address: 'Av. Cazón 1514',
    agent_name: 'Asistente de Tigre',
    enabled: true,
  },
] as const
