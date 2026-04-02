interface FallbackResponseProps {
  municipalityName: string
  phone?: string | null
  website?: string | null
  address?: string | null
}

export function FallbackResponse({
  municipalityName,
  phone,
  website,
  address,
}: FallbackResponseProps) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-disclaimer-border bg-disclaimer-bg p-4 text-sm">
      <p className="font-medium text-disclaimer-text">
        No tengo informacion suficiente para responder esa consulta.
      </p>
      <p className="mt-2 text-disclaimer-text/80">
        Te recomiendo contactar directamente a {municipalityName}:
      </p>
      <ul className="mt-2 space-y-1 text-disclaimer-text/80">
        {phone && (
          <li>
            Tel:{' '}
            <a href={`tel:${phone}`} className="underline hover:text-disclaimer-text">
              {phone}
            </a>
          </li>
        )}
        {website && (
          <li>
            Web:{' '}
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-disclaimer-text"
            >
              {website}
            </a>
          </li>
        )}
        {address && <li>Direccion: {address}</li>}
      </ul>
    </div>
  )
}
