---
tags: [fuente, web]
---

# Sitios Web Municipales

Scraping directo de los sitios oficiales de cada municipio.

## Municipios Configurados

| Municipio | URL | Estado |
|-----------|-----|--------|
| Vicente Lopez | https://www.vicentelopez.gov.ar | Configurado |
| San Isidro | https://www.sanisidro.gob.ar | Configurado |
| Moron | https://www.moron.gob.ar | Configurado |
| La Plata | https://www.laplata.gob.ar | Configurado |
| Lanus | https://www.lanus.gob.ar | Configurado |
| General Rodriguez | https://www.generalrodriguez.gob.ar | Configurado |
| Ameghino | https://www.ameghino.gob.ar | Configurado |
| Tigre | https://www.tigre.gob.ar | Configurado |

## Metodo
- Scraper Cheerio (HTML estatico)
- Fallback a Playwright (SPA/JS-rendered)
- Rate limit: 1.5s entre requests
- Max depth: 2 niveles
