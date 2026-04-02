import Link from "next/link";

interface MunicipalityCardProps {
  name: string;
  slug: string;
  description: string;
  emoji: string;
}

export function MunicipalityCard({
  name,
  slug,
  description,
  emoji,
}: MunicipalityCardProps) {
  return (
    <Link
      href={`/chat/${slug}`}
      aria-label={`Consultar asistente de ${name}`}
      className="group block rounded-xl border border-gray-200 bg-white p-6 min-h-[44px] transition-all duration-200 hover:border-primary-600/30 hover:shadow-lg hover:shadow-primary-600/5 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
    >
      <div className="mb-3 text-3xl" aria-hidden="true">
        {emoji}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
        {name}
      </h3>
      <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
        {description}
      </p>
      <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Consultar
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M2 8a.75.75 0 01.75-.75h8.69L8.22 4.03a.75.75 0 011.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H2.75A.75.75 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </Link>
  );
}
