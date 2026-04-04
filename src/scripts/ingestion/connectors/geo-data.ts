/**
 * Geo Data connector — Static geographic and demographic data per municipality.
 *
 * Provides structured information about localidades, barrios, surface area,
 * population, and boundaries for each municipality.
 */

import { emptyResult, type IngestResult } from '../types'

// ---------------------------------------------------------------------------
// Geographic data per municipality
// ---------------------------------------------------------------------------

export interface GeoInfo {
  localidades: string[]
  limites: string
  superficie: string
  poblacion: string
}

export const GEO_DATA: Record<string, GeoInfo> = {
  'vicente-lopez': {
    localidades: [
      'Olivos', 'Florida', 'Vicente López', 'Munro', 'Carapachay',
      'Villa Martelli', 'La Lucila', 'Florida Oeste', 'Villa Adelina (parte)',
    ],
    limites: 'Limita con la Ciudad Autónoma de Buenos Aires, San Martín y San Isidro. Al este limita con el Río de la Plata.',
    superficie: '33,8 km²',
    poblacion: 'Censo 2022: ~274.000 habitantes',
  },
  'san-isidro': {
    localidades: [
      'San Isidro', 'Martínez', 'Acassuso', 'Beccar', 'Boulogne Sur Mer',
      'Villa Adelina (parte)', 'San Isidro Centro',
    ],
    limites: 'Limita con Vicente López, San Fernando, San Martín y General San Martín. Al este limita con el Río de la Plata.',
    superficie: '48 km²',
    poblacion: 'Censo 2022: ~295.000 habitantes',
  },
  'moron': {
    localidades: [
      'Morón', 'Haedo', 'El Palomar', 'Castelar', 'Villa Sarmiento',
      'Castelar Norte', 'Castelar Sur',
    ],
    limites: 'Limita con Tres de Febrero, Ituzaingó, Merlo, La Matanza y Hurlingham.',
    superficie: '55,8 km²',
    poblacion: 'Censo 2022: ~351.000 habitantes',
  },
  'la-plata': {
    localidades: [
      'La Plata', 'City Bell', 'Gonnet', 'Villa Elisa', 'Tolosa',
      'Ringuelet', 'Los Hornos', 'San Carlos', 'Altos de San Lorenzo',
      'Villa Elvira', 'Abasto', 'Arturo Seguí', 'Melchor Romero',
      'Lisandro Olmos', 'Etcheverry',
    ],
    limites: 'Limita con Ensenada, Berisso, Brandsen, San Vicente, Florencio Varela y Berazategui. Es la capital de la provincia de Buenos Aires.',
    superficie: '926 km²',
    poblacion: 'Censo 2022: ~740.000 habitantes',
  },
  'lanus': {
    localidades: [
      'Lanús Este', 'Lanús Oeste', 'Gerli', 'Valentín Alsina',
      'Remedios de Escalada', 'Monte Chingolo',
    ],
    limites: 'Limita con la Ciudad Autónoma de Buenos Aires, Avellaneda, Quilmes y Lomas de Zamora.',
    superficie: '45,3 km²',
    poblacion: 'Censo 2022: ~469.000 habitantes',
  },
  'general-rodriguez': {
    localidades: [
      'General Rodríguez', 'Barrio Parque General Rodríguez',
    ],
    limites: 'Limita con Luján, Mercedes, San Andrés de Giles, Moreno y Marcos Paz.',
    superficie: '360 km²',
    poblacion: 'Censo 2022: ~109.000 habitantes',
  },
  'ameghino': {
    localidades: [
      'Florentino Ameghino', 'Blaquier',
    ],
    limites: 'Limita con General Villegas, Lincoln, General Pinto y Rivadavia. Ubicado en el noroeste de la provincia de Buenos Aires.',
    superficie: '1.825 km²',
    poblacion: 'Censo 2022: ~9.900 habitantes',
  },
  'tigre': {
    localidades: [
      'Don Torcuato', 'General Pacheco', 'El Talar', 'Benavídez',
      'Rincón de Milberg', 'Troncos del Talar', 'Delta de Tigre',
      'Dique Luján', 'Tigre Centro', 'Ricardo Rojas', 'Nuevo Delta',
    ],
    limites: 'Limita con San Fernando, San Isidro, San Martín, Malvinas Argentinas y Escobar. Incluye la zona del Delta del Paraná.',
    superficie: '360 km²',
    poblacion: 'Censo 2022: ~470.000 habitantes',
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format geographic data as a readable text chunk for RAG ingestion.
 */
export function formatGeoChunk(municipalityId: string, municipalityName: string, data: GeoInfo): string {
  const lines = [
    `Datos geográficos del Municipio de ${municipalityName}`,
    '',
    `Superficie: ${data.superficie}`,
    `Población: ${data.poblacion}`,
    '',
    `Localidades y barrios: ${data.localidades.join(', ')}.`,
    '',
    `Límites: ${data.limites}`,
  ]
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main connector
// ---------------------------------------------------------------------------

export async function ingestGeoData(
  municipalityName: string,
  municipalityId: string
): Promise<IngestResult> {
  const result = emptyResult('geo_data', municipalityId)
  const startTime = Date.now()

  const data = GEO_DATA[municipalityId]

  if (!data) {
    const warning = `No geo data available for ${municipalityName} (${municipalityId})`
    console.warn(`  [geo-data] ${warning}`)
    result.errors.push(warning)
    result.duration = Date.now() - startTime
    return result
  }

  const chunk = formatGeoChunk(municipalityId, municipalityName, data)
  console.log(
    `  [geo-data] ${municipalityName}: ${data.localidades.length} localidades, ${data.superficie}`
  )

  result.pagesProcessed = 1
  result.chunksCreated = 1
  result.duration = Date.now() - startTime
  return result
}
