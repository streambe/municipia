# Auditoria de Seguridad - MunicipIA

**Autor**: Hedy Lamarr (Especialista en Seguridad)
**Fecha**: 2026-04-02
**Sprint**: 1 + 2 (consolidado)
**Version**: 1.0

---

## 1. Resumen Ejecutivo

Se realizo una auditoria de seguridad sobre la aplicacion MunicipIA, un chatbot RAG municipal construido con Next.js 16, Supabase (PostgreSQL + pgvector), Anthropic Claude y Voyage AI. La aplicacion es de uso publico anonimo (sin autenticacion de usuarios finales).

La auditoria cubre el codigo fuente, la configuracion de base de datos, los workflows de CI/CD, y las politicas de acceso. El resultado general es **GO con condiciones**: no se encontraron vulnerabilidades CRITICAL ni HIGH. Existen hallazgos MEDIUM que deben abordarse como deuda tecnica planificada.

---

## 2. Alcance de la Auditoria

| Componente | Revisado |
|---|---|
| API route `/api/chat` | Si |
| Guardrails de prompt injection (`guardrails.ts`) | Si |
| Rate limiting (`rate-limit.ts`) | Si |
| Redaccion de PII (`pii.ts`) | Si |
| Schema de base de datos y RLS (`001_initial_schema.sql`) | Si |
| Variables de entorno (`.env.example`) | Si |
| CI/CD workflows (`.github/workflows/`) | Si |
| Dependencias (`package.json`) | Si |
| Configuracion de deploy (Vercel + Supabase) | Si |

**Fuera de alcance**: infraestructura interna de Supabase, seguridad de Anthropic API, seguridad de Voyage AI.

---

## 3. Pruebas Ejecutadas (OWASP Top 10)

### A01: Broken Access Control

**Estado**: PASS

- RLS habilitado en las 7 tablas del schema.
- Tablas sensibles (`documents`, `ingestion_sources`, `ingestion_logs`) tienen politica `USING (false)` para el rol anonimo, bloqueando acceso publico. Solo accesibles via `service_role_key`.
- Tabla `municipalities` solo permite SELECT de municipios habilitados (`enabled = true`).
- Tablas `conversations` y `messages` permiten INSERT y SELECT abierto, lo cual es correcto para un chatbot anonimo.
- `ADMIN_API_KEY` protege endpoints administrativos (ingestion manual).
- El `service_role_key` se usa solo server-side y en GitHub Secrets.

**Observacion**: Las politicas de `document_chunks` permiten SELECT abierto (`USING (true)`). Esto es intencional para que el RAG funcione con el `anon_key`, pero expone los chunks via la API REST de Supabase si alguien conoce la URL. Riesgo: LOW (los chunks son contenido publico municipal).

### A02: Cryptographic Failures

**Estado**: PASS

- HTTPS obligatorio en Vercel (forzado automaticamente).
- API keys almacenadas en variables de entorno, nunca en codigo fuente.
- `.env.example` no contiene valores reales, solo placeholders vacios.
- Supabase maneja encripcion at-rest de la base de datos.
- No se almacenan passwords (aplicacion anonima).

### A03: Injection

**Estado**: PASS

- **Prompt injection**: Modulo `guardrails.ts` implementa 30+ patrones regex con scoring ponderado (threshold 1.0). Cubre 4 categorias: `instruction_override`, `prompt_extraction`, `jailbreak`, `role_injection`. Soporte bilingue (ES + EN).
- **SQL injection**: Todo acceso a base de datos usa Supabase JS SDK con queries parametrizadas. La funcion `match_chunks` usa parametros tipados en PL/pgSQL. No se encontro concatenacion de strings en queries.
- **XSS**: React 19 escapa contenido por defecto. No se encontro uso de `dangerouslySetInnerHTML`. El streaming de texto plano desde la API no inyecta HTML.

**Observacion**: Los guardrails son pattern-based y pueden ser evadidos con tecnicas de ofuscacion avanzada (unicode, homoglyphs, base64). Riesgo: MEDIUM. Recomendacion: agregar un segundo layer con clasificador LLM en el futuro.

### A04: Insecure Design

**Estado**: PASS

- Rate limiting implementado: 20 requests/minuto por IP en el endpoint de chat.
- Longitud maxima de mensaje: 2000 caracteres.
- Redaccion de PII antes de persistir mensajes del usuario (DNI, CUIL/CUIT, email, telefono argentino).
- Validacion de inputs en el API route: `municipalityId`, `messages` array, tipo y longitud de contenido.

### A05: Security Misconfiguration

**Estado**: PASS

- `.env.example` no contiene secrets reales.
- CI workflow no expone secrets en logs.
- Ingestion workflow usa `${{ secrets.* }}` correctamente.
- Edge Runtime (`export const runtime = 'edge'`) limita la superficie de ataque (sin acceso a filesystem del servidor).

### A07: Identification and Authentication Failures

**Estado**: N/A (con observaciones)

- La aplicacion es de uso anonimo. No hay autenticacion de usuarios finales, lo cual es una decision de diseno valida para un chatbot municipal publico.
- Endpoints de ingestion protegidos por `ADMIN_API_KEY`.
- Supabase `service_role_key` solo se usa server-side.

**Observacion**: No hay autenticacion para el dashboard de administracion (si se implementa en el futuro, debe agregarse auth).

### A09: Security Logging and Monitoring

**Estado**: PASS con observaciones

- Tabla `ingestion_logs` registra cada ejecucion de ingestion con status, conteos, errores y duracion.
- Tabla `conversations` y `messages` registran todas las interacciones.
- `console.error` en el API route captura errores de persistencia y errores generales.

**Observacion**: No hay alertas automaticas ante errores repetidos ni metricas de intentos de prompt injection bloqueados. Riesgo: LOW.

---

## 4. Vulnerabilidades Encontradas

| ID | Severidad | Descripcion | Estado |
|---|---|---|---|
| SEC-001 | MEDIUM | Rate limiting in-memory no persiste entre instancias serverless de Vercel. Un atacante podria distribuir requests entre multiples cold starts. | Abierta |
| SEC-002 | MEDIUM | Guardrails de prompt injection son pattern-based. Pueden evadirse con tecnicas de ofuscacion avanzada (unicode substitution, token splitting). | Abierta |
| SEC-003 | MEDIUM | `document_chunks` tiene SELECT abierto via RLS. Los chunks son accesibles directamente via Supabase REST API con el anon key. | Abierta |
| SEC-004 | LOW | No se registran metricas de intentos de prompt injection bloqueados. No hay visibilidad sobre frecuencia de ataques. | Abierta |
| SEC-005 | LOW | PII redaction es regex-based. Puede no detectar formatos no estandar de datos personales (e.g., DNI escrito con palabras). | Abierta |
| SEC-006 | LOW | No hay headers de seguridad explicitos configurados (CSP, X-Frame-Options). Vercel agrega algunos por defecto pero no todos. | Abierta |

**CRITICAL encontradas**: 0
**HIGH encontradas**: 0

---

## 5. Recomendaciones

### Prioridad Alta (resolver en Sprint 3)

1. **Migrar rate limiting a Vercel KV o Upstash Redis** para persistencia entre instancias serverless. Costo estimado: free tier de Upstash es suficiente para el volumen esperado.

2. **Agregar headers de seguridad en `next.config.ts`**: Content-Security-Policy, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy.

### Prioridad Media (Sprint 4+)

3. **Agregar segundo layer de guardrails**: Usar un clasificador LLM lightweight (o Anthropic moderation API cuando este disponible) como complemento a los patrones regex.

4. **Restringir acceso a `document_chunks`** via RLS para que solo sean accesibles desde la funcion `match_chunks` (usando `security definer`).

5. **Implementar logging de intentos de injection bloqueados** en una tabla `security_events` para monitoreo y analisis de patrones de ataque.

### Prioridad Baja (backlog)

6. Mejorar PII detection con NER o patrones adicionales.
7. Implementar CORS restrictivo si se usan dominios conocidos.

---

## 6. Veredicto

### GO con condiciones

La aplicacion MunicipIA esta lista para produccion. No presenta vulnerabilidades CRITICAL ni HIGH. Las vulnerabilidades MEDIUM identificadas no representan un riesgo inmediato dado que:

- El contenido expuesto (chunks) es informacion publica municipal.
- El rate limiting in-memory funciona razonablemente para el volumen esperado inicial.
- Los guardrails pattern-based cubren los vectores de ataque mas comunes.

**Condiciones para mantener el GO**:

1. Implementar headers de seguridad antes del primer mes en produccion.
2. Migrar rate limiting a solucion persistente antes de superar 1000 usuarios diarios.
3. Monitorear manualmente los logs de conversaciones las primeras 2 semanas para detectar patrones de abuso.

---

## 7. Deuda Tecnica de Seguridad

| Item | Severidad | Sprint estimado | Esfuerzo |
|---|---|---|---|
| Rate limiting persistente (Redis/KV) | MEDIUM | Sprint 3 | 3 SP |
| Headers de seguridad en next.config | MEDIUM | Sprint 3 | 1 SP |
| Segundo layer de guardrails (LLM-based) | MEDIUM | Sprint 4 | 5 SP |
| RLS restrictivo en document_chunks | MEDIUM | Sprint 4 | 2 SP |
| Tabla security_events + logging | LOW | Sprint 4 | 3 SP |
| PII detection mejorado | LOW | Backlog | 3 SP |
| CORS restrictivo | LOW | Backlog | 1 SP |

**Total deuda tecnica de seguridad**: 18 SP
