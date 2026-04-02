# Lecciones Aprendidas - MunicipIA

**Autor**: Alan Turing (PM / Scrum Master)
**Fecha**: 2026-04-02
**Sprints cubiertos**: 1 + 2

---

## 1. Resumen del Proyecto

MunicipIA es un chatbot RAG municipal que permite a ciudadanos consultar informacion de tramites, servicios y noticias de su municipio usando lenguaje natural. Stack: Next.js 16, Supabase (PostgreSQL + pgvector), Anthropic Claude, Voyage AI. Deploy en Vercel con ingestion automatizada via GitHub Actions.

**Entregables finales**: 104 archivos, 184 tests unitarios, 8 municipios configurados, pipeline de ingestion automatica diaria.

---

## 2. Lo que Salio Bien

### Stack unificado (monolito Next.js)
Usar un solo proyecto Next.js para frontend + API elimino la complejidad de mantener servicios separados. El Edge Runtime permitio rate limiting y guardrails sin servidor dedicado. Despliegue en un solo lugar (Vercel) simplifico el CI/CD.

### pgvector en Supabase
Integrar la busqueda vectorial directamente en PostgreSQL elimino la necesidad de un servicio vectorial separado (Pinecone, Weaviate). Reduce costos, reduce latencia, y simplifica la arquitectura. La funcion `match_chunks` con HNSW index funciona bien para el volumen actual.

### GitHub Actions gratis para open source
El workflow de ingestion diaria corre sin costo en el free tier de GitHub Actions. El trigger manual (`workflow_dispatch`) resulto util para debugging. CI basico (lint + build) detecta errores antes del merge.

### Scraper generico reutilizable
El sistema de ingestion con conectores modulares permite agregar nuevos municipios con solo configurar URLs en la tabla `ingestion_sources`. No se necesita codigo nuevo por municipio.

### Guardrails desde el dia 1
Implementar deteccion de prompt injection con scoring ponderado desde el Sprint 1 evito tener que retrofitear seguridad. Los 30+ patrones bilingues cubren los vectores de ataque mas comunes.

### PII redaction automatica
Redactar datos personales (DNI, CUIL, email, telefono) antes de persistir mensajes del usuario protege la privacidad sin impactar la experiencia. Implementacion simple con regex, compatible con Edge Runtime.

---

## 3. Lo que se Puede Mejorar

### SIBOM y BA Abierta son stubs
Los conectores para SIBOM (Sistema de Boleta Municipal) y BA Abierta (datos abiertos PBA) quedaron como stubs porque los portales son complejos y requieren scraping especializado o APIs no documentadas. Impacta la cobertura de informacion para algunos municipios.

**Accion**: Investigar si hay APIs oficiales o datasets descargables. Priorizar en Sprint 3 si hay demanda de usuarios.

### Sin tests e2e
Se escribieron 184 tests unitarios pero no hay tests end-to-end con Playwright. Los flujos criticos (usuario abre chat, envia mensaje, recibe respuesta) solo se validan manualmente.

**Accion**: Agregar Playwright en Sprint 3. Minimo 5 tests e2e cubriendo el happy path.

### Rate limiting in-memory
El rate limiter usa un `Map` en memoria que no persiste entre instancias serverless de Vercel. En teoria un atacante puede distribuir requests entre cold starts para evadir el limite.

**Accion**: Migrar a Upstash Redis o Vercel KV cuando el volumen lo justifique (ver security-audit.md, SEC-001).

### Falta monitoreo de costos de API en tiempo real
No hay alertas cuando el gasto en Anthropic o Voyage AI supera un umbral. Si hay un spike de uso, nos enteramos al ver la factura.

**Accion**: Configurar alerts en Anthropic Console y Voyage AI dashboard. Considerar implementar un budget cap en el API route.

---

## 4. Problemas Encontrados y Soluciones

### npm ci falla cross-platform
`npm ci` fallaba en algunos entornos por diferencias en el lockfile entre Windows y Linux.

**Solucion**: En CI se usa `npm install --frozen-lockfile || npm install` como fallback. Documentar que el desarrollo principal se hace en la misma plataforma que CI (Linux/Node 24).

### ESLint strict con `any` en scripts de ingestion
ESLint strict rechazaba `any` en los scripts de ingestion donde cheerio y otras librerias de scraping devuelven tipos dinamicos.

**Solucion**: Configurar regla especifica para permitir `any` en `src/scripts/**` manteniendo strictness en el resto del codigo.

### AI SDK v6 breaking changes
La migracion a AI SDK v6 rompio las importaciones de `useChat`. La API cambio significativamente respecto a v5.

**Solucion**: Leer la documentacion de `ai@6.x` y usar `DefaultChatTransport` para el streaming. Los tipos de mensajes tambien cambiaron.

### Node 24 vs Node 20 en CI
El CI usaba Node 24 pero algunos desarrolladores tenian Node 20 localmente, causando diferencias en el comportamiento de `fetch` y `crypto`.

**Solucion**: Alinear a Node 24 en CI y documentar en README que Node 24 es el minimo. Agregar `.nvmrc` con `24`.

---

## 5. Checklist para Proximos Proyectos

Derivado de la experiencia en MunicipIA:

- [ ] Definir version de Node en `.nvmrc` desde el dia 1
- [ ] Configurar ESLint con excepciones para scripts antes de escribir codigo
- [ ] Implementar rate limiting persistente desde el inicio si el deploy es serverless
- [ ] Agregar headers de seguridad en `next.config.ts` desde el primer deploy
- [ ] Configurar alertas de billing en APIs externas (LLM, embeddings) antes de ir a produccion
- [ ] Escribir al menos 3 tests e2e para el happy path antes del Sprint Review
- [ ] Documentar el proceso de ingestion/seed para que cualquier dev pueda levantar el entorno en <15 minutos
- [ ] Usar `USING (false)` como RLS default y abrir solo lo necesario
- [ ] Incluir PII redaction desde el Sprint 1 si se almacenan mensajes de usuarios
- [ ] Verificar compatibilidad cross-platform del lockfile en CI

---

## 6. Metricas Finales

| Metrica | Valor |
|---|---|
| Archivos totales | 104 |
| Tests unitarios | 184 |
| Tests pasando | 184 (100%) |
| Municipios configurados | 8 |
| Patrones de prompt injection | 30+ |
| Tablas en DB | 7 |
| Indices en DB | 13 (incluyendo HNSW) |
| Politicas RLS | 9 |
| Costo mensual estimado | $16 - $31 USD |
| Sprints completados | 2 |
