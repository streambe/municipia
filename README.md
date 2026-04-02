# MunicipIA

Red federada de asistentes virtuales municipales potenciados por inteligencia artificial.

Proyecto open source de responsabilidad social empresaria desarrollado por [Streambe](https://streambe.com).

## Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **State**: Zustand
- **Backend**: Next.js API Routes (Edge Runtime)
- **Base de datos**: Supabase (PostgreSQL + pgvector)
- **LLM**: Claude (Anthropic) via Vercel AI SDK
- **Embeddings**: Voyage AI (voyage-3-lite, 512d)
- **Pipeline**: GitHub Actions (cron)
- **Deploy**: Vercel

## Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus API keys

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Base de datos

El schema SQL se encuentra en `supabase/migrations/001_initial_schema.sql`. Ejecutarlo en el dashboard de Supabase o con la CLI:

```bash
supabase db push
```

## Pipeline de ingestion

```bash
npx tsx scripts/ingestion/index.ts
```

Se ejecuta automaticamente via GitHub Actions todos los dias a las 03:00 ART.

## Licencia

MIT
