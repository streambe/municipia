const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY!}`,
    },
    body: JSON.stringify({
      input: text,
      model: 'voyage-3-lite',
    }),
  })

  if (!response.ok) {
    throw new Error(`Voyage AI error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY!}`,
    },
    body: JSON.stringify({
      input: texts,
      model: 'voyage-3-lite',
    }),
  })

  if (!response.ok) {
    throw new Error(`Voyage AI error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data.map((item: { embedding: number[] }) => item.embedding)
}

/**
 * Generate embeddings for a large batch of texts, splitting into sub-batches
 * of up to 128 texts (Voyage AI limit).
 */
export async function generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 128
  const results: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const embeddings = await generateEmbeddings(batch)
    results.push(...embeddings)
  }

  return results
}
