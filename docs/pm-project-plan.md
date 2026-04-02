# Plan de Trabajo — MunicipIA

## 1. Informacion del documento

| Campo | Valor |
|-------|-------|
| Proyecto | MunicipIA — Red federada de agentes de IA municipales |
| Version | 1.0 |
| Autor | Alan Turing — PM / Scrum Master, Equipo GEN |
| Fecha | 2026-04-02 |
| Estado | PENDIENTE APROBACION |
| Metodologia | Scrum (sprints de 2 semanas) |

---

## 2. Resumen ejecutivo

MunicipIA es una plataforma open source de impacto social, desarrollada por Streambe como iniciativa de RSE, que pone a disposicion de los ciudadanos de la Provincia de Buenos Aires un agente de inteligencia artificial conversacional especializado en cada municipio. El ciudadano selecciona su municipio y puede consultar en lenguaje natural sobre tramites, servicios, presupuesto, obras publicas, horarios y cualquier informacion publica disponible.

El MVP cubre 8 municipios piloto (Vicente Lopez, San Isidro, Moron, La Plata, Lanus, General Rodriguez, Ameghino, Tigre) con arquitectura RAG federada: un LLM compartido (Claude via Anthropic API) con indices de conocimiento independientes por municipio, alimentados por scraping diario de sitios oficiales y fuentes de datos abiertos.

El proyecto no tiene deadline ni presupuesto asignado mas alla del costo operativo de APIs (~$16-31/mes). El equipo GEN de 23 agentes ejecuta el desarrollo completo.

---

## 3. Plan de sprints

### 3.1 Sprint 1: Fundaciones (~40 story points)

**Sprint Goal:** Infraestructura operativa, landing page completa y esqueleto del chat funcional.

**Duracion:** 2 semanas

| ID | Titulo | Epic | SP | Rol principal |
|----|--------|------|----|---------------|
| TASK-001 | Landing page publica | EPIC-1 | 3 | Frontend (Grace Hopper) |
| TASK-002 | Selector de municipio | EPIC-1 | 3 | Frontend (Grace Hopper) |
| TASK-003 | Navegacion al chat | EPIC-1 | 2 | Frontend (Katherine Johnson) |
| TASK-004 | Seccion institucional "Acerca de" | EPIC-1 | 2 | Frontend (Katherine Johnson) |
| TASK-005 | Identidad visual y branding | EPIC-1 | 3 | UX/UI (Leonardo Da Vinci) |
| TASK-006 | Footer con links legales | EPIC-1 | 2 | Frontend (Emmy Noether) |
| TASK-007 | Responsive design (desktop, tablet, mobile) | EPIC-1 | 4 | Frontend (Emmy Noether) |
| TASK-010 | Interfaz de chat (UI) | EPIC-2 | 5 | Frontend (Grace Hopper) |
| TASK-011 | Agente aislado por municipio (estructura) | EPIC-2 | 5 | Backend (Alan Kay) |
| TASK-050 | Esquema de BD en Supabase + config municipios | EPIC-4 | 5 | Backend (Alan Kay) + Datos (Rosalind Franklin) |
| INFRA-01 | Setup repo GitHub + CI/CD basico | EPIC-5 | 3 | DevOps (Margaret Hamilton) |
| INFRA-02 | Deploy Vercel + Supabase provisioning | EPIC-5 | 3 | Cloud (Carl Sagan) |

**Entregables:** Landing page desplegada en Vercel, repo con CI/CD, Supabase configurado, chat UI skeleton visible en preview URL.

---

### 3.2 Sprint 2: Agente Conversacional (~45 story points)

**Sprint Goal:** Chat funcional con RAG respondiendo preguntas reales sobre al menos 2-3 municipios piloto.

**Duracion:** 2 semanas

| ID | Titulo | Epic | SP | Rol principal |
|----|--------|------|----|---------------|
| TASK-012 | Personalidad y nombre del agente | EPIC-2 | 3 | Analista (Ada Lovelace) + UX/UI |
| TASK-013 | Fallback inteligente | EPIC-2 | 5 | Backend (Alan Kay) |
| TASK-014 | Respuestas basadas en RAG | EPIC-2 | 8 | Backend (Alan Kay) |
| TASK-015 | ReAct tool-using | EPIC-2 | 5 | Backend (John von Neumann) |
| TASK-016 | Citas bajo demanda | EPIC-2 | 3 | Backend (John von Neumann) |
| TASK-017 | Sin limite de conversacion | EPIC-2 | 2 | Backend (Blaise Pascal) |
| TASK-018 | Streaming de respuestas + indicador de carga | EPIC-2 | 5 | Frontend (Grace Hopper) + Backend |
| TASK-030 | Scraper web para 2-3 municipios piloto (parcial) | EPIC-3 | 5 | Backend (John von Neumann) |
| TASK-051 | Indice vectorial por municipio (pgvector + HNSW) | EPIC-4 | 5 | Datos (Rosalind Franklin) |
| TASK-052 | Embeddings pipeline (Voyage AI) | EPIC-4 | 4 | Datos (Rosalind Franklin) |

**Entregables:** Chat funcional en Vercel preview respondiendo preguntas reales de Vicente Lopez, San Isidro y Moron como minimo. Streaming de respuestas operativo.

---

### 3.3 Sprint 3: Pipeline de Ingestion Completo (~45 story points)

**Sprint Goal:** Pipeline de ingestion automatizado cubriendo los 8 municipios y todas las fuentes de datos criticas.

**Duracion:** 2 semanas

| ID | Titulo | Epic | SP | Rol principal |
|----|--------|------|----|---------------|
| TASK-030 | Scrapers completos para los 8 municipios | EPIC-3 | 8 | Backend (John von Neumann + Blaise Pascal) |
| TASK-031 | Conector CKAN | EPIC-3 | 5 | Integraciones (Claude Shannon) |
| TASK-032 | Conector SIBOM | EPIC-3 | 5 | Integraciones (Claude Shannon) |
| TASK-033 | Conector Buenos Aires Abierta | EPIC-3 | 5 | Integraciones (Claude Shannon) |
| TASK-039 | Ejecucion diaria automatizada (cron/scheduled) | EPIC-3 | 5 | DevOps (Margaret Hamilton) |
| TASK-040 | Logs de ingestion | EPIC-3 | 3 | Backend (Blaise Pascal) |
| TASK-041 | Deduplicacion de documentos | EPIC-3 | 5 | Datos (Rosalind Franklin) |
| TASK-019 | Historial de conversacion + anonimizacion PII | EPIC-2 | 5 | Backend (Alan Kay) + Seguridad (Hedy Lamarr) |
| TASK-061 | Rate limiting en endpoints publicos | EPIC-5 | 4 | Backend (Alan Kay) |

**Entregables:** Los 8 municipios con datos ingestados, pipeline corriendo en schedule diario, logs visibles, PII detection activo.

---

### 3.4 Sprint 4: Hardening + Lanzamiento (~21 story points + QA transversal)

**Sprint Goal:** Producto listo para produccion con los 8 municipios, auditoria de seguridad aprobada y deploy final.

**Duracion:** 2 semanas

| ID | Titulo | Epic | SP | Rol principal |
|----|--------|------|----|---------------|
| TASK-034 | Conector PBAC/OPC | EPIC-3 | 3 | Integraciones (Claude Shannon) |
| TASK-035 | Conector INDEC | EPIC-3 | 3 | Integraciones (Claude Shannon) |
| TASK-038 | Conector redes sociales oficiales | EPIC-3 | 3 | Integraciones (Claude Shannon) |
| TASK-021 | Guardrails prompt injection | EPIC-2 | 5 | Seguridad (Hedy Lamarr) + Backend |
| TASK-022 | Accesibilidad WCAG AA | EPIC-1 | 3 | Frontend (Katherine Johnson) + UX/UI |
| TASK-062 | Monitoreo y alertas | EPIC-5 | 4 | Cloud (Carl Sagan) + DevOps |
| QA-FULL | QA completo de los 8 municipios | -- | -- | QA (Feynman, Bohr, Hodgkin) |
| SEC-AUDIT | Auditoria de seguridad final | -- | -- | Seguridad (Hedy Lamarr) |
| DEPLOY | Deploy a produccion en municipia.org.ar | EPIC-5 | -- | DevOps + Cloud |

**Entregables:** Producto en produccion en municipia.org.ar, auditoria de seguridad GO, 8 municipios funcionales, documentacion completa.

---

## 4. Camino critico

```
Sprint 1                    Sprint 2                    Sprint 3                    Sprint 4
─────────────────────────── ─────────────────────────── ─────────────────────────── ───────────────────────────
Supabase + pgvector setup → Indice vectorial operativo → Pipeline completo 8 munis → QA final + deploy prod
                           → RAG funcional              → Ingestion diaria auto     → Auditoria seguridad
Landing page + chat UI    → Chat con streaming         → PII detection             → Guardrails prompt inject
CI/CD + Vercel            → Scrapers 2-3 munis         → Scrapers 8 munis          → Produccion
```

**Dependencias criticas:**
1. Supabase con pgvector (Sprint 1) bloquea todo el pipeline RAG (Sprint 2)
2. RAG funcional (Sprint 2) bloquea la validacion real del chat
3. Scrapers (Sprint 2-3) bloquean la calidad de respuestas del agente
4. Auditoria de seguridad (Sprint 4) es gate bloqueante para deploy a produccion

---

## 5. Riesgos y mitigaciones

| # | Riesgo | Prob. | Impacto | Mitigacion | Contingencia | Owner |
|---|--------|-------|---------|------------|--------------|-------|
| R1 | Free tier de Vercel insuficiente (timeout 10s en serverless) | Media | Alto | Usar Edge Runtime para rutas de chat (sin limite de timeout en streaming) | Migrar API de chat a Cloudflare Workers (free tier 100K req/dia) | Carl Sagan |
| R2 | Sitios municipales bloquean scraping o cambian estructura | Alta | Alto | Respetar robots.txt, rate limiting agresivo, user-agent identificado como MunicipIA | Contactar municipios via programa Generacion T para pedir acceso, usar APIs donde existan | Claude Shannon |
| R3 | Calidad de datos variable entre municipios | Alta | Medio | Implementar validacion y limpieza en pipeline, logs detallados por fuente | Degradar gracefully: fallback inteligente indica que no hay info y deriva al municipio | Rosalind Franklin |
| R4 | Cambios en APIs de redes sociales (Twitter/X, Instagram) | Media | Bajo | Conectores modulares con interface comun, facil de reemplazar | Desactivar fuente especifica sin afectar el resto del pipeline | Claude Shannon |
| R5 | Costos de API Claude mayores a estimado ($16-31/mo) | Baja | Medio | Monitoreo de uso desde Sprint 2, cache de respuestas frecuentes | Limitar largo de contexto, implementar cache agresivo, evaluar modelo mas barato | Alan Kay |
| R6 | PII presente en documentos publicos ingestados | Alta | Alto | Pipeline de PII detection obligatorio antes de almacenar, regex + heuristicas | Eliminacion retroactiva, notificacion al equipo, revision manual del dataset | Hedy Lamarr |
| R7 | Compliance legal (Ley 25.326, Ley 27.275) | Media | Alto | Revision legal de terminos y politica de privacidad, anonimizacion de historial, disclaimer visible | Consulta con asesor legal externo de Streambe | Ada Lovelace |
| R8 | Disponibilidad del equipo Streambe para mantenimiento post-lanzamiento | Baja | Medio | Documentacion exhaustiva, deployment guide, codigo open source bien documentado | Comunidad open source puede contribuir, municipios pueden forkear | Alan Turing |
| R9 | Free tier Supabase (500MB) insuficiente con 8 municipios | Media | Medio | Retencion de historial a 90 dias, monitoreo de storage, embeddings compactos (voyage-3-lite) | Upgrade a Supabase Pro ($25/mo) — cubierto por Streambe | Rosalind Franklin |
| R10 | Prompt injection por usuarios maliciosos | Media | Alto | Guardrails en Sprint 4, system prompt robusto, no exponer herramientas destructivas | Logging de intentos, rate limiting por IP, bloqueo temporal | Hedy Lamarr |

---

## 6. Supuestos y dependencias

### Supuestos
- Los sitios web de los 8 municipios piloto son accesibles via HTTP y permiten scraping (dentro de robots.txt)
- Streambe cubre el costo operativo mensual (~$16-31/mo) indefinidamente
- El equipo GEN tiene acceso a API keys de Anthropic (Claude) y Voyage AI
- Los municipios no requieren aprobacion formal para que se usen sus datos publicos (Ley 27.275)
- El dominio municipia.org.ar esta disponible o sera adquirido por Streambe
- Vercel free tier es suficiente para el trafico inicial del MVP

### Dependencias
- API de Anthropic (Claude) disponible y funcional
- API de Voyage AI disponible para embeddings
- Supabase con extension pgvector habilitada en free tier
- GitHub y Vercel operativos para CI/CD
- Fuentes de datos publicas (CKAN, SIBOM, Buenos Aires Abierta) accesibles

---

## 7. Criterios de exito del MVP

| Criterio | Metrica | Umbral |
|----------|---------|--------|
| Cobertura municipal | Municipios con agente funcional | 8/8 |
| Calidad de respuestas | Respuestas relevantes en test manual (100 preguntas por municipio) | >= 80% |
| Disponibilidad | Uptime mensual | >= 99% |
| Performance | Tiempo de primera respuesta del chat | < 3 segundos |
| Ingestion | Datos actualizados diariamente | Pipeline ejecuta sin errores >= 95% de las veces |
| Seguridad | Auditoria de seguridad | GO sin vulnerabilidades criticas ni altas |
| Accesibilidad | WCAG | Nivel AA |
| Costo operativo | Costo mensual total | <= $35/mes |
| Open source | Repositorio publico con documentacion | Completo y navegable |

---

## 8. Comunicacion

| Ceremonia | Frecuencia | Participantes | Formato |
|-----------|------------|---------------|---------|
| Sprint Planning | Inicio de cada sprint | PM + todo el equipo GEN + usuario | Seleccion de stories, estimacion, sprint goal |
| Daily Standup | Diario | PM + roles activos del sprint | Yesterday / Today / Blockers (15 min) |
| Sprint Review | Fin de cada sprint | PM + todo el equipo GEN + usuario | Demo en Vercel staging, validacion feature por feature |
| Retrospectiva | Fin de cada sprint | PM + todo el equipo GEN | Que salio bien / Que mejorar / Acciones |
| Status Report | Semanal | PM -> usuario | 3P Update (Progress, Plans, Problems) |
| Reporte de Sprint | Fin de cada sprint | PM | Reporte consolidado en .claude/pm-reports/ |
| Trello Board | Continuo | Todos | Board "MunicipIA - Desarrollo" actualizado en tiempo real |

---

## 9. Velocidad estimada

| Sprint | Story Points estimados | Notas |
|--------|------------------------|-------|
| Sprint 1 | ~40 | Setup + landing + chat skeleton |
| Sprint 2 | ~45 | Core RAG + chat funcional |
| Sprint 3 | ~45 | Pipeline completo |
| Sprint 4 | ~21 + QA | Hardening + lanzamiento |
| **Total** | **~151** | **4 sprints, 8 semanas** |

---

*Documento sujeto a aprobacion del usuario. Sin aprobacion, no se inicia el desarrollo.*
