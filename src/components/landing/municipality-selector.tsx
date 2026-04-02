import { MunicipalityCard } from "./municipality-card";

const MUNICIPALITIES = [
  {
    name: "Vicente López",
    slug: "vicente-lopez",
    description: "Trámites, servicios y consultas del municipio de Vicente López",
    emoji: "🏛️",
  },
  {
    name: "San Isidro",
    slug: "san-isidro",
    description: "Información municipal de San Isidro al instante",
    emoji: "🌳",
  },
  {
    name: "Morón",
    slug: "moron",
    description: "Tu asistente para consultas del municipio de Morón",
    emoji: "🏢",
  },
  {
    name: "La Plata",
    slug: "la-plata",
    description: "Capital provincial — consultas y trámites municipales",
    emoji: "🏫",
  },
  {
    name: "Lanús",
    slug: "lanus",
    description: "Servicios e información del municipio de Lanús",
    emoji: "🏘️",
  },
  {
    name: "General Rodríguez",
    slug: "general-rodriguez",
    description: "Consultas municipales de General Rodríguez",
    emoji: "🌾",
  },
  {
    name: "Ameghino",
    slug: "ameghino",
    description: "Información y servicios del municipio de Ameghino",
    emoji: "🌻",
  },
  {
    name: "Tigre",
    slug: "tigre",
    description: "Trámites y consultas del municipio de Tigre",
    emoji: "🌊",
  },
] as const;

export function MunicipalitySelector() {
  return (
    <section
      id="municipios"
      className="py-20 sm:py-24 px-4 bg-surface"
      aria-labelledby="municipios-heading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2
            id="municipios-heading"
            className="text-3xl sm:text-4xl font-bold text-gray-900"
          >
            Elegí tu municipio
          </h2>
          <p className="mt-3 text-gray-500 text-lg max-w-xl mx-auto">
            Seleccioná un municipio para comenzar a consultar
          </p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          role="list"
        >
          {MUNICIPALITIES.map((m) => (
            <div key={m.slug} role="listitem">
              <MunicipalityCard
                name={m.name}
                slug={m.slug}
                description={m.description}
                emoji={m.emoji}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
