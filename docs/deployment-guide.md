# Guia de Deployment - MunicipIA

**Autores**: Carl Sagan (Ingeniero Cloud) + Margaret Hamilton (DevOps)
**Fecha**: 2026-04-02
**Version**: 1.0

---

## 1. Arquitectura de Deploy

```
                    +------------------+
                    |   Usuario Final  |
                    +--------+---------+
                             |
                             | HTTPS
                             v
                    +------------------+
                    |  Vercel (Edge)   |
                    |  Next.js 16      |
                    |  - Frontend SSR  |
                    |  - API /chat     |
                    +---+---------+----+
                        |         |
              +---------+         +---------+
              v                             v
   +------------------+          +------------------+
   |  Anthropic API   |          |  Supabase        |
   |  Claude Sonnet   |          |  PostgreSQL 15   |
   |  (LLM streaming) |          |  + pgvector      |
   +------------------+          |  - municipalities|
                                 |  - documents     |
              +---------+        |  - chunks (RAG)  |
              v         |        |  - conversations |
   +------------------+ |        +------------------+
   |  Voyage AI       | |
   |  (Embeddings)    +-+
   +------------------+
              ^
              |
   +------------------+
   | GitHub Actions   |
   | - CI (lint+build)|
   | - Daily Ingestion|
   |   (cron 03:00 AR)|
   +------------------+
```

---

## 2. Paso a Paso: Supabase

### 2.1 Crear proyecto

1. Ir a [supabase.com](https://supabase.com) y crear cuenta (o login).
2. Click **New Project**.
3. Nombre: `municipia`. Region: `South America (Sao Paulo)`. Password: generar y guardar.
4. Esperar a que el proyecto se aprovisione (~2 minutos).

### 2.2 Habilitar pgvector

En el SQL Editor de Supabase, ejecutar:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2.3 Correr migration

Copiar el contenido completo de `supabase/migrations/001_initial_schema.sql` en el SQL Editor y ejecutar. Esto crea:

- 7 tablas: `municipalities`, `documents`, `document_chunks`, `conversations`, `messages`, `ingestion_sources`, `ingestion_logs`
- Indices incluyendo HNSW para busqueda vectorial
- RLS habilitado en todas las tablas con politicas apropiadas
- Funcion `match_chunks` para busqueda semantica

### 2.4 Correr seed

Copiar el contenido de `supabase/seed.sql` en el SQL Editor y ejecutar. Esto inserta los 8 municipios iniciales con sus fuentes de ingestion.

### 2.5 Obtener credenciales

En **Settings > API**:

- `Project URL`: `https://xxx.supabase.co` (guardar como `NEXT_PUBLIC_SUPABASE_URL`)
- `anon public key`: `eyJ...` (guardar como `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `service_role key`: `eyJ...` (guardar como `SUPABASE_SERVICE_ROLE_KEY`) -- NUNCA exponer en el cliente

---

## 3. Paso a Paso: Vercel

### 3.1 Importar repositorio

1. Ir a [vercel.com](https://vercel.com) y login.
2. Click **Add New > Project**.
3. Importar desde GitHub: `streambe/municipia`.
4. Framework: **Next.js** (auto-detected).

### 3.2 Configurar variables de entorno

En **Settings > Environment Variables**, agregar:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...
ADMIN_API_KEY=<generar un UUID random con uuidgen o https://www.uuidgenerator.net>
```

Marcar `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY` y `ADMIN_API_KEY` como **Sensitive** (no visible en logs).

### 3.3 Custom domain

1. En **Settings > Domains**, agregar `municipia.org.ar`.
2. Configurar DNS del dominio:
   - CNAME `@` o `www` apuntando a `cname.vercel-dns.com`
   - O registro A apuntando a `76.76.21.21`
3. Vercel provee SSL automaticamente.

### 3.4 Deploy

Click **Deploy**. El build ejecuta `next build` y despliega a la red Edge de Vercel.

---

## 4. Paso a Paso: GitHub Secrets

Para que el workflow de ingestion diaria funcione:

1. Ir al repositorio en GitHub: `streambe/municipia`.
2. **Settings > Secrets and variables > Actions**.
3. Agregar los siguientes **Repository secrets**:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VOYAGE_API_KEY=pa-...
```

El workflow `Daily Ingestion` se ejecuta automaticamente a las 03:00 hora Argentina (06:00 UTC) y tambien puede dispararse manualmente desde la pestana Actions.

---

## 5. Primera Ingestion Manual

Antes de que el chatbot pueda responder preguntas, es necesario ingestar contenido de los sitios municipales:

```bash
# Clonar el repositorio
git clone https://github.com/streambe/municipia.git
cd municipia

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las keys reales:
#   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=eyJ...
#   VOYAGE_API_KEY=pa-...

# Ejecutar ingestion
npx tsx src/scripts/ingestion/index.ts
```

La ingestion procesa los 8 municipios configurados, scrapea sus sitios web, genera embeddings con Voyage AI, y almacena los chunks en Supabase. Duracion estimada: 10-30 minutos dependiendo de la cantidad de paginas.

---

## 6. Verificacion Post-Deploy

| Check | Como verificar | Resultado esperado |
|---|---|---|
| Landing visible | Abrir `https://municipia.org.ar` | Pagina principal con lista de municipios |
| Chat funcional | Click en un municipio, enviar mensaje | Respuesta en streaming del asistente |
| Persistencia | Revisar Supabase > Table Editor > `conversations` | Nueva fila creada |
| Mensajes guardados | Revisar Supabase > Table Editor > `messages` | Mensajes user + assistant |
| Ingestion configurada | GitHub > Actions > Daily Ingestion | Workflow visible y habilitado |
| RAG funcional | Preguntar algo especifico del municipio | Respuesta con informacion del sitio web |
| Rate limiting | Enviar 21+ mensajes en 1 minuto | Error 429 en el request 21 |

---

## 7. Troubleshooting

| Problema | Causa probable | Solucion |
|---|---|---|
| Build falla en Vercel | Variables de entorno faltantes | Verificar que todas las env vars estan configuradas en Vercel |
| Chat no responde | `ANTHROPIC_API_KEY` invalida o sin credito | Verificar API key en Anthropic Console, verificar billing |
| RAG sin resultados relevantes | Ingestion no ejecutada | Correr ingestion manual (seccion 5) |
| Error 429 Too Many Requests | Rate limiting activado | Esperar 1 minuto. Limite: 20 req/min por IP |
| Ingestion falla en GitHub Actions | Secrets no configurados | Verificar seccion 4 (GitHub Secrets) |
| Embeddings fallan | `VOYAGE_API_KEY` invalida | Verificar API key en Voyage AI dashboard |
| Municipio no aparece | `enabled = false` en DB | Verificar tabla `municipalities` en Supabase |
| `npm ci` falla | Lockfile inconsistente | Usar `npm install` en vez de `npm ci` |

---

## 8. URLs y Dashboards

| Servicio | URL |
|---|---|
| Produccion | https://municipia.org.ar |
| Supabase Dashboard | https://supabase.com/dashboard/project/[PROJECT_ID] |
| Vercel Dashboard | https://vercel.com/streambe/municipia |
| GitHub Actions | https://github.com/streambe/municipia/actions |
| Anthropic Console | https://console.anthropic.com |
| Voyage AI Dashboard | https://dash.voyageai.com |

---

## 9. Checklist Pre-Deploy

- [ ] Supabase proyecto creado y migration ejecutada
- [ ] Seed data ejecutado (8 municipios)
- [ ] pgvector extension habilitada
- [ ] Variables de entorno configuradas en Vercel (6 variables)
- [ ] GitHub Secrets configurados (3 secrets)
- [ ] Primera ingestion ejecutada exitosamente
- [ ] Custom domain configurado con SSL
- [ ] Verificacion post-deploy completada (seccion 6)
- [ ] Al menos 1 municipio responde preguntas correctamente
- [ ] Rate limiting verificado (429 al superar limite)

---

## Costos Estimados Mensuales

| Servicio | Tier | Costo estimado |
|---|---|---|
| Vercel | Hobby (gratis) o Pro ($20/mo) | $0 - $20 |
| Supabase | Free tier (500MB DB) | $0 |
| Anthropic API | Pay per use | $10 - $25/mo (estimado 5K mensajes) |
| Voyage AI | Pay per use | $1 - $5/mo (ingestion diaria) |
| GitHub Actions | Free (open source) | $0 |
| Dominio | .org.ar | ~$5/ano |
| **Total estimado** | | **$16 - $31/mo** |
