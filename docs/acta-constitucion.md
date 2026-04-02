# Acta de Constitucion de Proyecto — MunicipIA

## 1. Informacion del documento

| Campo | Valor |
|-------|-------|
| Proyecto | MunicipIA — Red federada de agentes de IA municipales |
| Version | 1.0 |
| Autor | Alan Turing — PM / Scrum Master, Equipo GEN |
| Fecha | 2026-04-02 |
| Estado | APROBADO |
| Sponsor | Streambe (area RSE) |

---

## 2. Datos del proyecto

| Campo | Valor |
|-------|-------|
| Nombre | MunicipIA |
| Sponsor | Streambe — Responsabilidad Social Empresaria |
| Tipo | Nuevo — Impacto social |
| Dominio | municipia.org.ar |
| Licencia | Open Source |
| Repositorio | GitHub (por definir URL exacta) |
| Municipios piloto | Vicente Lopez, San Isidro, Moron, La Plata, Lanus, General Rodriguez, Ameghino, Tigre |
| Stack | Next.js 15 + Supabase (pgvector) + Claude API + Voyage AI + Vercel + GitHub Actions |

### Proposito

MunicipIA es una plataforma publica y gratuita que permite a los ciudadanos de la Provincia de Buenos Aires consultar informacion de su municipio a traves de un agente de inteligencia artificial conversacional. Cada municipio tiene su propio agente con base de conocimiento independiente, alimentada por fuentes de datos publicas. El proyecto es open source y mantenido por Streambe como iniciativa de RSE.

---

## 3. Alcance

### 3.1 In Scope (MVP)

- Landing page publica con selector de municipio (8 municipios piloto)
- Chat conversacional con agente IA aislado por municipio
- Acceso libre, anonimo, sin autenticacion
- Arquitectura RAG + LLM compartido (Claude) + indices separados por municipio + ReAct (tool-using)
- Pipeline de ingestion de datos desde fuentes publicas:
  - Scraping diario de sitios web municipales
  - Conectores CKAN, SIBOM, Buenos Aires Abierta, PBAC/OPC, INDEC, AAIP FOIA, Linea 148
  - Redes sociales oficiales
- Fallback inteligente cuando el agente no tiene informacion
- Citas de fuente bajo demanda (solo cuando el ciudadano las pide)
- Historial de conversaciones con anonimizacion de PII
- Compliance con Ley 25.326 (proteccion de datos) y Ley 27.275 (acceso a informacion publica)
- Respeto de robots.txt (RFC 9309)
- Solo idioma espanol
- Identidad visual propia
- Responsive design (desktop, tablet, mobile)
- Accesibilidad WCAG AA

### 3.2 Out of Scope (MVP)

- Modo funcionario municipal
- Alertas y deteccion de anomalias
- Scoring de transparencia municipal
- Autenticacion de usuarios
- Idiomas distintos a espanol
- Municipios fuera de los 8 piloto
- Panel de administracion para municipios
- Integracion directa con sistemas internos municipales
- Notificaciones push
- Aplicacion movil nativa

---

## 4. Requerimientos funcionales y no funcionales (resumen)

### Funcionales

| Epic | Descripcion | Stories | Story Points |
|------|-------------|---------|--------------|
| EPIC-1 | Landing page y navegacion | 7 | 19 |
| EPIC-2 | Agente conversacional (chat) | 13 | 41 |
| EPIC-3 | Pipeline de ingestion | 12 | 53 |
| EPIC-4 | Base de conocimiento RAG | 4 | 17 |
| EPIC-5 | Infraestructura y deploy | 6 | 21 |
| **Total** | | **42** | **~151** |

Detalle completo en: `projects/municipia/docs/functional-specification.md` (APROBADO)

### No funcionales

- Performance: primera respuesta del chat < 3 segundos
- Disponibilidad: >= 99% uptime mensual
- Seguridad: OWASP Top 10 cubierto, guardrails contra prompt injection, PII detection
- Accesibilidad: WCAG AA
- Escalabilidad: arquitectura preparada para agregar municipios sin cambios de codigo
- Costo operativo: <= $35/mes
- Mantenibilidad: codigo open source, documentado, con deployment guide

---

## 5. Equipo asignado

| Rol | Nombre | Responsabilidad principal |
|-----|--------|---------------------------|
| PM / Scrum Master | Alan Turing | Coordinacion general, ceremonias, reportes |
| Product Owner | Marie Curie | Vision de producto, priorizacion de backlog |
| Analista Funcional | Ada Lovelace | Requerimientos, user stories, criterios de aceptacion |
| Analista Funcional 2 | Hypatia de Alejandria | Soporte en epicas adicionales |
| Arquitecto de Software | Nikola Tesla | Arquitectura de solucion, ADRs |
| Lider Tecnico | Linus Torvalds | Estandares de codigo, code review, stack |
| Dev Frontend 1 | Grace Hopper | Landing page, chat UI, componentes core |
| Dev Frontend 2 | Katherine Johnson | Accesibilidad, navegacion, responsive |
| Dev Frontend 3 | Emmy Noether | Footer, componentes secundarios |
| Dev Backend 1 | Alan Kay | RAG pipeline, chat API, Supabase |
| Dev Backend 2 | John von Neumann | Scrapers, ReAct, conectores |
| Dev Backend 3 | Blaise Pascal | Logs, rate limiting, historial |
| Dev Fullstack | Tim Berners-Lee | Soporte transversal frontend/backend |
| Especialista Integraciones | Claude Shannon | Conectores CKAN, SIBOM, BA Abierta, PBAC, INDEC, redes |
| Ingeniero de Datos | Rosalind Franklin | Esquema BD, pgvector, embeddings, deduplicacion |
| Cientifico de Datos | Albert Einstein | Optimizacion RAG, evaluacion de calidad de respuestas |
| Tester QA 1 | Richard Feynman | Plan de testing, ejecucion, reporte |
| Tester QA 2 | Niels Bohr | Testing por municipio |
| Tester QA 3 | Dorothy Hodgkin | Testing por municipio |
| Ingeniero Cloud | Carl Sagan | Vercel, Supabase provisioning, monitoreo |
| DevOps | Margaret Hamilton | CI/CD, GitHub Actions, pipeline de ingestion scheduling |
| Especialista Seguridad | Hedy Lamarr | Auditoria, PII detection, guardrails, compliance |
| Disenador UI/UX/CX | Leonardo Da Vinci | Wireframes, identidad visual, accesibilidad |

---

## 6. Plan de comunicacion

| Canal | Proposito | Frecuencia |
|-------|-----------|------------|
| Sprint Planning | Seleccion de stories y sprint goal | Inicio de cada sprint (cada 2 semanas) |
| Daily Standup | Sincronizacion del equipo | Diario |
| Sprint Review | Demo al usuario, validacion de features | Fin de cada sprint |
| Retrospectiva | Mejora continua del equipo | Fin de cada sprint |
| Status Report (3P) | Progress, Plans, Problems | Semanal |
| Trello Board | Estado en tiempo real de tareas | Continuo |
| Vercel Preview URLs | Demos visuales de features en progreso | Por cada push a feature branch |
| CLAUDE.md | Estado persistente del proyecto | Actualizado cada sesion |
| Reportes de sprint | Documentacion formal por rol | Fin de cada sprint en .claude/pm-reports/ |

---

## 7. Plan de trabajo aceptado

### Resumen de sprints

| Sprint | Duracion | Goal | SP estimados |
|--------|----------|------|--------------|
| Sprint 1 | 2 semanas | Fundaciones: infra, landing completa, chat skeleton | ~40 |
| Sprint 2 | 2 semanas | Agente conversacional: chat funcional con RAG en 2-3 municipios | ~45 |
| Sprint 3 | 2 semanas | Pipeline de ingestion completo para los 8 municipios | ~45 |
| Sprint 4 | 2 semanas | Hardening, QA completo, auditoria de seguridad, deploy a produccion | ~21 + QA |
| **Total** | **8 semanas** | **MVP completo: 8 municipios en produccion** | **~151** |

### Camino critico

1. Supabase + pgvector setup (Sprint 1) -- bloquea pipeline RAG
2. RAG funcional con chat (Sprint 2) -- bloquea validacion real
3. Scrapers de 8 municipios (Sprint 3) -- bloquea calidad de respuestas
4. Auditoria de seguridad GO (Sprint 4) -- bloquea deploy a produccion

Detalle completo en: `projects/municipia/docs/pm-project-plan.md`

---

## 8. Riesgos identificados y plan de mitigacion

| # | Riesgo | Prob. | Impacto | Mitigacion |
|---|--------|-------|---------|------------|
| R1 | Free tier Vercel insuficiente (timeout) | Media | Alto | Edge Runtime para streaming; contingencia: Cloudflare Workers |
| R2 | Municipios bloquean scraping | Alta | Alto | Respetar robots.txt; contactar via Generacion T |
| R3 | Calidad de datos variable | Alta | Medio | Validacion en pipeline; fallback inteligente |
| R4 | Cambios en APIs de redes sociales | Media | Bajo | Conectores modulares desacoplados |
| R5 | Costos API Claude mayores a estimado | Baja | Medio | Monitoreo + cache; evaluar modelo mas barato |
| R6 | PII en documentos publicos | Alta | Alto | Pipeline PII detection obligatorio |
| R7 | Compliance legal (Ley 25.326, 27.275) | Media | Alto | Revision legal, anonimizacion, disclaimers |
| R8 | Disponibilidad equipo Streambe post-lanzamiento | Baja | Medio | Documentacion exhaustiva, open source |
| R9 | Supabase free tier (500MB) insuficiente | Media | Medio | Retencion 90 dias; contingencia: upgrade Pro |
| R10 | Prompt injection por usuarios maliciosos | Media | Alto | Guardrails, system prompt robusto, rate limiting |

---

## 9. Criterios de exito

| Criterio | Umbral |
|----------|--------|
| Municipios con agente funcional | 8/8 |
| Calidad de respuestas (test manual) | >= 80% relevantes |
| Uptime mensual | >= 99% |
| Tiempo primera respuesta del chat | < 3 segundos |
| Pipeline de ingestion sin errores | >= 95% ejecuciones exitosas |
| Auditoria de seguridad | GO (sin criticas ni altas) |
| Accesibilidad | WCAG AA |
| Costo operativo mensual | <= $35 |
| Repositorio open source documentado | Completo |

---

## 10. Supuestos y restricciones

### Supuestos
- Los sitios web de los 8 municipios piloto son accesibles y permiten scraping dentro de robots.txt
- Streambe cubre el costo operativo mensual indefinidamente
- El equipo GEN tiene acceso a API keys de Anthropic y Voyage AI
- Los datos publicos municipales no requieren aprobacion formal para su uso (Ley 27.275)
- El dominio municipia.org.ar esta disponible o sera adquirido por Streambe
- Vercel free tier es suficiente para el trafico inicial

### Restricciones
- Sin deadline fijo
- Sin presupuesto de desarrollo (equipo GEN, costo $0)
- Presupuesto operativo: solo free tiers + ~$16-31/mo API Anthropic
- Open source obligatorio
- Solo idioma espanol
- Solo 8 municipios piloto en MVP
- Mantenido por Streambe post-lanzamiento

---

## 11. Estimacion de costos

| Concepto | Costo mensual | Notas |
|----------|---------------|-------|
| Vercel (hosting + edge) | $0 | Free tier (Hobby) |
| Supabase (BD + pgvector) | $0 | Free tier (500MB) |
| GitHub (repo + Actions) | $0 | Free tier |
| Anthropic API (Claude) | $15-30 | Estimado segun volumen |
| Voyage AI (embeddings) | $1 | Estimado, free tier generoso |
| Dominio municipia.org.ar | ~$10/anio | Unico costo fijo no mensual |
| **Total mensual** | **~$16-31** | **Cubierto por Streambe RSE** |
| Desarrollo | $0 | Equipo GEN |

---

## 12. Aprobaciones

| Rol | Nombre | Estado | Fecha |
|-----|--------|--------|-------|
| Usuario / Sponsor | Streambe | **APROBADO** | 2026-04-02 |
| PM / Scrum Master | Alan Turing | Conforme | 2026-04-02 |
| Product Owner | Marie Curie | Conforme | 2026-04-02 |

> **NOTA:** Este documento requiere aprobacion explicita del usuario para proceder con el inicio del Sprint 1. Sin esta aprobacion, el desarrollo NO se inicia (CP-11 bloqueante).

---

*Documento formal del proyecto MunicipIA. Fuente de verdad para alcance, equipo, plan y restricciones.*
