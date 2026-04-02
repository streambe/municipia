# MunicipIA -- Wireframes y Especificaciones UI/UX

**Responsable**: Leonardo Da Vinci (UI/UX/CX Designer)
**Fecha**: 2026-04-02
**Version**: 1.0 -- Iteracion 1
**Estado**: EN ITERACION (pendiente aprobacion)

---

## Tabla de contenidos

1. [Identidad visual](#1-identidad-visual)
2. [Personalidad del agente](#2-personalidad-del-agente)
3. [Wireframes](#3-wireframes)
4. [Componentes UI](#4-componentes-ui)
5. [Responsive breakpoints](#5-responsive-breakpoints)
6. [Accesibilidad](#6-accesibilidad)

---

## 1. Identidad visual

### 1.1 Concepto de marca

MunicipIA combina "municipio" + "IA". La identidad debe transmitir: cercanía ciudadana, confianza institucional y tecnología accesible. No es una app de gobierno fría ni un chatbot corporativo -- es un asistente vecinal que habla como un vecino informado.

**Logo concept**: Isotipo que fusiona un pin de ubicación (municipio/localidad) con un globo de diálogo (conversación/IA). Tipografía sans-serif redondeada. El nombre se escribe "MunicipIA" con las dos últimas letras en el color primario para destacar "IA".

### 1.2 Paleta de colores

```
PRIMARIO
  primary-600:  #2563EB  (azul institucional -- CTAs, links, foco)
  primary-700:  #1D4ED8  (hover de primario)
  primary-50:   #EFF6FF  (fondos suaves, burbuja agente)
  primary-100:  #DBEAFE  (badges, highlights)

SECUNDARIO
  secondary-600: #059669  (verde -- confirmaciones, estado activo)
  secondary-50:  #ECFDF5  (fondo verde suave)

NEUTROS
  white:     #FFFFFF
  gray-50:   #F9FAFB  (fondo de pagina)
  gray-100:  #F3F4F6  (bordes suaves, separadores)
  gray-200:  #E5E7EB  (bordes)
  gray-300:  #D1D5DB  (bordes input)
  gray-400:  #9CA3AF  (placeholder text)
  gray-500:  #6B7280  (texto secundario)
  gray-700:  #374151  (texto body)
  gray-900:  #111827  (texto headings)

ESTADOS
  success:  #22C55E  (operacion exitosa)
  warning:  #F59E0B  (precaucion)
  error:    #EF4444  (error)
  info:     #3B82F6  (informativo)

ESPECIALES
  disclaimer-bg:    #FFFBEB  (amarillo muy suave -- fondo disclaimer)
  disclaimer-border: #FDE68A  (amarillo borde)
  disclaimer-text:   #92400E  (texto disclaimer)
```

**Contraste verificado (WCAG AA)**:

| Combinacion                    | Ratio  | Cumple |
|--------------------------------|--------|--------|
| gray-900 sobre white           | 17.4:1 | Si     |
| gray-700 sobre white           | 10.3:1 | Si     |
| primary-600 sobre white        | 4.6:1  | Si     |
| white sobre primary-600        | 4.6:1  | Si     |
| gray-500 sobre white           | 5.0:1  | Si     |
| disclaimer-text sobre disclaimer-bg | 7.1:1 | Si |

### 1.3 Tipografia

```
FAMILIA PRINCIPAL: "Inter" (Google Fonts)
  - Variable font, excelente legibilidad en pantalla
  - Pesos: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

FAMILIA MONOSPACE: "JetBrains Mono" (solo para datos estructurados si se necesitan)

ESCALA TIPOGRAFICA:
  display:    36px / 2.25rem  / line-height 1.2  / bold     -- Hero heading
  h1:         30px / 1.875rem / line-height 1.3  / bold     -- Titulos de seccion
  h2:         24px / 1.5rem   / line-height 1.35 / semibold -- Subtitulos
  h3:         20px / 1.25rem  / line-height 1.4  / semibold -- Terciarios
  body-lg:    18px / 1.125rem / line-height 1.6  / regular  -- Body grande
  body:       16px / 1rem     / line-height 1.6  / regular  -- Body default
  body-sm:    14px / 0.875rem / line-height 1.5  / regular  -- Texto secundario
  caption:    12px / 0.75rem  / line-height 1.5  / medium   -- Labels, timestamps
```

### 1.4 Principios de diseno

1. **Confianza ante todo**: aspecto institucional limpio, nada recargado
2. **Mobile-first**: el 80% de los ciudadanos van a entrar desde el celular
3. **Minimo friccion**: de landing a chatear en 1 click
4. **Inclusivo**: accesible, texto claro, sin jerga tecnica
5. **Transparente**: siempre visible que es IA, no una persona

### 1.5 Espaciado (sistema 8pt)

```
space-1:   4px   (0.25rem)  -- gaps micro
space-2:   8px   (0.5rem)   -- entre elementos internos
space-3:   12px  (0.75rem)  -- padding interno componentes chicos
space-4:   16px  (1rem)     -- padding standard
space-5:   20px  (1.25rem)  -- gap entre componentes
space-6:   24px  (1.5rem)   -- padding de cards
space-8:   32px  (2rem)     -- separacion entre secciones menores
space-12:  48px  (3rem)     -- separacion entre secciones
space-16:  64px  (4rem)     -- padding de pagina vertical
space-20:  80px  (5rem)     -- hero spacing
```

### 1.6 Bordes y sombras

```
BORDER RADIUS:
  sm:   6px   -- badges, chips
  md:   8px   -- inputs, botones
  lg:   12px  -- cards
  xl:   16px  -- burbujas de chat
  full: 9999px -- avatares, pills

SOMBRAS:
  sm:   0 1px 2px rgba(0,0,0,0.05)           -- cards en reposo
  md:   0 4px 6px -1px rgba(0,0,0,0.1)       -- cards hover, dropdowns
  lg:   0 10px 15px -3px rgba(0,0,0,0.1)     -- modales, popovers
```

---

## 2. Personalidad del agente

### 2.1 Nombre y personalidad

**Nombre**: "Muni" (corto, amigable, facil de recordar, funciona para cualquier municipio)

**Personalidad**:
- Vecino informado que trabaja en el municipio y conoce todos los tramites
- Amigable pero no informal en exceso -- tono respetuoso
- Usa "vos" (rioplatense) cuando se dirige al ciudadano
- Empático: entiende que hacer tramites es frustrante
- Honesto: cuando no sabe algo, lo dice y ofrece alternativas
- No hace chistes ni usa emojis excesivos (maximo uno por mensaje cuando corresponda)

### 2.2 Tono de voz

```
SI:
  "Hola, soy Muni, tu asistente virtual de [Municipio]. Estoy para ayudarte."
  "Para ese tramite necesitas presentar..."
  "No tengo esa informacion exacta, pero te puedo orientar."

NO:
  "Hey! Que onda! Soy tu bot amigo!!"
  "Error: informacion no disponible."
  "No se."
```

### 2.3 Ejemplos de mensajes

**Bienvenida (Vicente Lopez)**:
```
Hola, soy Muni, el asistente virtual de Vicente Lopez.

Puedo ayudarte con consultas sobre tramites municipales, horarios,
requisitos y servicios del municipio. Preguntame lo que necesites.

Ten en cuenta que soy una inteligencia artificial y mis respuestas
pueden no estar 100% actualizadas. Para informacion oficial, siempre
podes consultar la web del municipio.
```

**Respuesta normal**:
```
Para renovar la licencia de conducir en Vicente Lopez necesitas:

- DNI (original y copia)
- Licencia anterior
- Certificado de aptitud psicofisica (se hace en el mismo lugar)
- Comprobante de pago de la tasa municipal ($12.500)

Podes sacar turno online en vicentelopez.gov.ar/turnos o
acercarte a la Direccion de Transito en Av. Maipu 4560, de lunes
a viernes de 8 a 14 hs.
```

**Fallback (no tiene la info)**:
```
No tengo informacion especifica sobre ese tema. Te sugiero estas alternativas:

- Llamar al Centro de Atencion Vecinal: 0800-222-8585
- Consultar la web oficial: vicentelopez.gov.ar
- Acercarte a la Mesa de Entrada en Av. Maipu 3200

Si tu consulta es sobre otro tema, con gusto te ayudo.
```

**Cita bajo demanda** (cuando el ciudadano pide la fuente):
```
Esa informacion la obtuve de la Ordenanza Municipal 12.345/2024,
publicada en el Boletin Oficial del municipio el 15 de marzo de 2024.
Podes consultarla en vicentelopez.gov.ar/normativa
```

---

## 3. Wireframes

### 3.1 Landing page -- Desktop (>1024px)

```
+------------------------------------------------------------------+
| HEADER                                                            |
| [Logo MunicipIA]                    Acerca de   Contacto   GitHub |
+------------------------------------------------------------------+
|                                                                    |
|                         HERO SECTION                               |
|                     (fondo primary-50)                             |
|                                                                    |
|              Tu municipio, a un mensaje de distancia               |
|                                                                    |
|        MunicipIA es un asistente de inteligencia artificial        |
|        que te ayuda con tramites y consultas municipales.          |
|        Gratuito, abierto y para todos.                             |
|                                                                    |
|                    [ Elegir mi municipio v ]                       |
|                    (scroll down indicator)                          |
|                                                                    |
+--------------------------------------------------------------------+
|                                                                    |
|                    SELECTOR DE MUNICIPIOS                          |
|                    "Selecciona tu municipio"                       |
|                                                                    |
|  +----------------+  +----------------+  +----------------+        |
|  | [escudo]       |  | [escudo]       |  | [escudo]       |        |
|  | Vicente Lopez  |  | San Isidro     |  | Moron          |        |
|  | Zona Norte     |  | Zona Norte     |  | Zona Oeste     |        |
|  | Chatear ->     |  | Chatear ->     |  | Chatear ->     |        |
|  +----------------+  +----------------+  +----------------+        |
|                                                                    |
|  +----------------+  +----------------+  +----------------+        |
|  | [escudo]       |  | [escudo]       |  | [escudo]       |        |
|  | La Plata       |  | Lanus          |  | Gral Rodriguez |        |
|  | Capital PBA    |  | Zona Sur       |  | Zona Oeste     |        |
|  | Chatear ->     |  | Chatear ->     |  | Chatear ->     |        |
|  +----------------+  +----------------+  +----------------+        |
|                                                                    |
|  +----------------+  +----------------+                            |
|  | [escudo]       |  | [escudo]       |                            |
|  | Ameghino       |  | Tigre          |                            |
|  | Interior PBA   |  | Zona Norte     |                            |
|  | Chatear ->     |  | Chatear ->     |                            |
|  +----------------+  +----------------+                            |
|                                                                    |
+--------------------------------------------------------------------+
|                                                                    |
|                      ACERCA DE                                     |
|                                                                    |
|  MunicipIA es un proyecto de responsabilidad social empresaria     |
|  de Streambe, 100% open source y gratuito.                         |
|                                                                    |
|  +-------------------+ +-------------------+ +------------------+  |
|  | [icon]            | | [icon]            | | [icon]           |  |
|  | Open Source        | | Gratuito          | | Impacto Social   |  |
|  | Codigo abierto     | | Sin costos para   | | Acercamos el     |  |
|  | para que cualquier | | municipios ni     | | gobierno digital |  |
|  | municipio pueda    | | ciudadanos        | | a todos los      |  |
|  | sumarse            | |                   | | vecinos          |  |
|  +-------------------+ +-------------------+ +------------------+  |
|                                                                    |
|                      [Ver en GitHub ->]                            |
|                                                                    |
+--------------------------------------------------------------------+
|                                                                    |
|  FOOTER                                                            |
|                                                                    |
|  MunicipIA              Legal                    Proyecto          |
|  Streambe RSE           Politica de privacidad   GitHub            |
|  municipia.org.ar       Terminos de uso          Contacto          |
|                                                                    |
|  -----------------------------------------------------------      |
|  Disclaimer: MunicipIA utiliza inteligencia artificial. Las        |
|  respuestas son orientativas y pueden contener errores. Para       |
|  informacion oficial, consulta la web de tu municipio.             |
|                                                                    |
|  (c) 2026 Streambe. Proyecto open source bajo licencia MIT.       |
|                                                                    |
+--------------------------------------------------------------------+
```

### 3.2 Landing page -- Mobile (<768px)

```
+-----------------------------------+
| [=] MunicipIA               [GH]  |
+-----------------------------------+
|                                    |
|  Tu municipio, a un               |
|  mensaje de distancia              |
|                                    |
|  MunicipIA es un asistente de     |
|  inteligencia artificial que te    |
|  ayuda con tramites y consultas    |
|  municipales. Gratuito, abierto    |
|  y para todos.                     |
|                                    |
|  [ Elegir mi municipio v ]         |
|                                    |
+------------------------------------+
|                                    |
|  Selecciona tu municipio           |
|                                    |
|  +------------------------------+  |
|  | [escudo] Vicente Lopez       |  |
|  | Zona Norte          Chatear >|  |
|  +------------------------------+  |
|                                    |
|  +------------------------------+  |
|  | [escudo] San Isidro          |  |
|  | Zona Norte          Chatear >|  |
|  +------------------------------+  |
|                                    |
|  +------------------------------+  |
|  | [escudo] Moron               |  |
|  | Zona Oeste          Chatear >|  |
|  +------------------------------+  |
|                                    |
|  +------------------------------+  |
|  | [escudo] La Plata            |  |
|  | Capital PBA         Chatear >|  |
|  +------------------------------+  |
|                                    |
|  +------------------------------+  |
|  | [escudo] Lanus               |  |
|  | Zona Sur            Chatear >|  |
|  +------------------------------+  |
|                                    |
|  +------------------------------+  |
|  | [escudo] Gral Rodriguez      |  |
|  | Zona Oeste          Chatear >|  |
|  +------------------------------+  |
|                                    |
|  +------------------------------+  |
|  | [escudo] Ameghino            |  |
|  | Interior PBA        Chatear >|  |
|  +------------------------------+  |
|                                    |
|  +------------------------------+  |
|  | [escudo] Tigre               |  |
|  | Zona Norte          Chatear >|  |
|  +------------------------------+  |
|                                    |
+------------------------------------+
|                                    |
|  Acerca de                         |
|                                    |
|  [icon] Open Source                |
|  Codigo abierto para que           |
|  cualquier municipio pueda sumarse |
|                                    |
|  [icon] Gratuito                   |
|  Sin costos para municipios        |
|  ni ciudadanos                     |
|                                    |
|  [icon] Impacto Social             |
|  Acercamos el gobierno digital     |
|  a todos los vecinos               |
|                                    |
|  [ Ver en GitHub -> ]              |
|                                    |
+------------------------------------+
|  FOOTER                            |
|                                    |
|  MunicipIA - Streambe RSE         |
|                                    |
|  Politica de privacidad            |
|  Terminos de uso                   |
|  GitHub | Contacto                 |
|                                    |
|  Disclaimer: MunicipIA utiliza    |
|  inteligencia artificial. Las     |
|  respuestas son orientativas.     |
|  Para info oficial, consulta la   |
|  web de tu municipio.             |
|                                    |
|  (c) 2026 Streambe. MIT License.  |
+------------------------------------+
```

### 3.3 Chat -- Desktop (>1024px)

```
+------------------------------------------------------------------+
| HEADER (fondo blanco, borde inferior gray-200)                    |
| [<- Volver]   [escudo] Vicente Lopez - Muni   [+ Nuevo chat]     |
+------------------------------------------------------------------+
|                                                                    |
|  DISCLAIMER BANNER (fondo disclaimer-bg, borde disclaimer-border) |
|  [icon info] Muni es una IA. Las respuestas son orientativas.     |
|  Para info oficial: vicentelopez.gov.ar                [cerrar X] |
|                                                                    |
+--------------------------------------------------------------------+
|                                                                    |
|                      AREA DE MENSAJES                              |
|              (scroll vertical, mensajes al fondo)                  |
|                                                                    |
|  +--------------------------------------------------+             |
|  | [avatar Muni]                                     |             |
|  |                                                   |             |
|  | Hola, soy Muni, el asistente virtual de           |             |
|  | Vicente Lopez.                                    |             |
|  |                                                   |             |
|  | Puedo ayudarte con consultas sobre tramites       |             |
|  | municipales, horarios, requisitos y servicios.    |             |
|  | Preguntame lo que necesites.                      |             |
|  |                                              14:32|             |
|  +--------------------------------------------------+             |
|                                                                    |
|                                                                    |
|                  +----------------------------------------------+  |
|                  |                                              |  |
|                  | Como renuevo la licencia de conducir?       |  |
|                  |                                        14:33|  |
|                  +----------------------------------------------+  |
|                                                                    |
|  +--------------------------------------------------+             |
|  | [avatar Muni]                                     |             |
|  |                                                   |             |
|  | Para renovar la licencia de conducir en Vicente   |             |
|  | Lopez necesitas:                                  |             |
|  |                                                   |             |
|  | - DNI (original y copia)                          |             |
|  | - Licencia anterior                               |             |
|  | - Certificado de aptitud psicofisica              |             |
|  | - Comprobante de pago ($12.500)                   |             |
|  |                                                   |             |
|  | Podes sacar turno en vicentelopez.gov.ar/turnos   |             |
|  |                                              14:33|             |
|  +--------------------------------------------------+             |
|                                                                    |
+--------------------------------------------------------------------+
|                                                                    |
|  INPUT AREA (fondo blanco, borde superior gray-200)               |
|                                                                    |
|  +------------------------------------------------------+ [->]   |
|  | Escribi tu consulta...                                |         |
|  +------------------------------------------------------+         |
|                                                                    |
+--------------------------------------------------------------------+
```

### 3.4 Chat -- Mobile (<768px)

```
+-----------------------------------+
| [<-]  Vicente Lopez  [+ Nuevo]    |
+-----------------------------------+
| [i] Muni es una IA.         [X]  |
| Info oficial: vicentelopez.gov.ar |
+-----------------------------------+
|                                    |
|  +------------------------------+  |
|  | [M] Hola, soy Muni, el     |  |
|  | asistente virtual de         |  |
|  | Vicente Lopez.               |  |
|  |                              |  |
|  | Puedo ayudarte con           |  |
|  | consultas sobre tramites     |  |
|  | municipales. Preguntame      |  |
|  | lo que necesites.            |  |
|  |                        14:32 |  |
|  +------------------------------+  |
|                                    |
|     +---------------------------+  |
|     | Como renuevo la licencia  |  |
|     | de conducir?              |  |
|     |                     14:33 |  |
|     +---------------------------+  |
|                                    |
|  +------------------------------+  |
|  | [M] Para renovar la         |  |
|  | licencia necesitas:          |  |
|  |                              |  |
|  | - DNI (original y copia)     |  |
|  | - Licencia anterior          |  |
|  | - Certificado psicofisico    |  |
|  | - Comprobante de pago        |  |
|  |   ($12.500)                  |  |
|  |                              |  |
|  | Turno online:                |  |
|  | vicentelopez.gov.ar/turnos   |  |
|  |                        14:33 |  |
|  +------------------------------+  |
|                                    |
+------------------------------------+
| +------------------------------+   |
| | Escribi tu consulta...      |[>]|
| +------------------------------+   |
+------------------------------------+
```

### 3.5 Paginas legales (Politica de privacidad / Terminos de uso)

Estructura identica para ambas. Layout de prosa simple.

```
+------------------------------------------------------------------+
| HEADER (mismo que landing)                                        |
| [Logo MunicipIA]                    Acerca de   Contacto   GitHub |
+------------------------------------------------------------------+
|                                                                    |
|  max-width: 768px, centrado                                       |
|                                                                    |
|  Politica de Privacidad                                           |
|  Ultima actualizacion: 2 de abril de 2026                         |
|                                                                    |
|  1. Informacion que recopilamos                                   |
|  [parrafo de texto]                                               |
|                                                                    |
|  2. Como usamos la informacion                                    |
|  [parrafo de texto]                                               |
|                                                                    |
|  3. Almacenamiento y seguridad                                    |
|  [parrafo de texto]                                               |
|                                                                    |
|  ...                                                              |
|                                                                    |
+--------------------------------------------------------------------+
| FOOTER (mismo que landing)                                        |
+--------------------------------------------------------------------+
```

---

## 4. Componentes UI

Todos los componentes se basan en shadcn/ui y se extienden con los tokens de MunicipIA.

### 4.1 MunicipalityCard

Tarjeta clickeable que representa un municipio en el selector de la landing.

**Props**:
```typescript
interface MunicipalityCardProps {
  name: string;           // "Vicente Lopez"
  region: string;         // "Zona Norte"
  slug: string;           // "vicente-lopez"
  coatOfArmsUrl?: string; // URL del escudo municipal (opcional)
}
```

**Variantes por breakpoint**:
- Desktop/Tablet: card vertical (escudo arriba, nombre abajo). Grid 3 columnas desktop, 2 tablet.
- Mobile: card horizontal (escudo izquierda, nombre+region derecha, flecha al final). Lista full-width.

**Estados**:

| Estado   | Visual                                                    |
|----------|-----------------------------------------------------------|
| Default  | Fondo white, borde gray-200, sombra sm, border-radius lg |
| Hover    | Sombra md, borde primary-300, transicion 150ms ease       |
| Focus    | Ring 2px primary-600 offset 2px                           |
| Active   | Escala 0.98, sombra sm                                    |
| Disabled | No aplica (siempre habilitado)                            |

**Espaciado**:
- Desktop: padding 24px, gap entre cards 16px, escudo 48x48px
- Mobile: padding 16px, escudo 40x40px, altura minima 64px

**Tipografia**:
- Nombre: body (16px), semibold, gray-900
- Region: body-sm (14px), regular, gray-500
- "Chatear": body-sm (14px), medium, primary-600

### 4.2 ChatBubble

Burbuja de mensaje en el chat. Dos variantes: agente y ciudadano.

**Props**:
```typescript
interface ChatBubbleProps {
  role: "agent" | "user";
  content: string;       // Soporta markdown basico (listas, bold, links)
  timestamp: string;     // "14:32"
  isStreaming?: boolean;  // true mientras el agente esta escribiendo
}
```

**Variantes visuales**:

| Propiedad        | Agent                        | User                        |
|------------------|------------------------------|-----------------------------|
| Alineacion       | Izquierda                    | Derecha                     |
| Fondo            | primary-50 (#EFF6FF)         | primary-600 (#2563EB)       |
| Color texto      | gray-900                     | white                       |
| Color links      | primary-700                  | white (underline)           |
| Border radius    | 16px 16px 16px 4px           | 16px 16px 4px 16px          |
| Avatar           | Si (icono Muni, 32x32)      | No                          |
| Max-width        | 75% del contenedor           | 75% del contenedor          |
| Max-width mobile | 85% del contenedor           | 85% del contenedor          |

**Estados**:
- Default: como se describe arriba
- Streaming: texto aparece progresivamente, cursor parpadeante al final (animacion blink 1s)
- Error: borde error (#EF4444), icono de alerta, boton "Reintentar" debajo

**Espaciado**:
- Padding interno: 12px 16px
- Gap entre burbujas: 8px (mismo rol), 16px (cambio de rol)
- Timestamp: caption (12px), gray-400 (agente) o white/70% (usuario), alineado abajo derecha

**Markdown soportado en contenido**:
- Listas con viñetas (ul)
- Negritas
- Links (se abren en nueva pestana)
- Saltos de linea

### 4.3 ChatInput

Campo de texto para escribir mensajes con boton de envio.

**Props**:
```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;     // true mientras el agente esta respondiendo
  placeholder?: string;   // default: "Escribi tu consulta..."
}
```

**Estructura**: textarea auto-expandible (min 1 linea, max 5 lineas) + boton circular de envio.

**Estados**:

| Estado   | Input                                          | Boton enviar                        |
|----------|------------------------------------------------|-------------------------------------|
| Default  | Borde gray-300, fondo white                    | Fondo gray-200, icono gray-400      |
| Focus    | Borde primary-600, ring 2px primary-100        | Sin cambio                          |
| Typing   | Texto gray-900                                 | Fondo primary-600, icono white      |
| Disabled | Fondo gray-50, texto gray-400                  | Fondo gray-200, icono gray-300      |
| Hover btn| --                                              | Fondo primary-700 (si hay texto)    |

**Comportamiento**:
- Enter envia (sin Shift). Shift+Enter nueva linea.
- Boton enviar habilitado solo cuando hay texto (no solo espacios).
- Despues de enviar, el input se limpia y mantiene el foco.
- En mobile: el teclado virtual empuja el input hacia arriba (no lo tapa).

**Espaciado**:
- Contenedor: padding 12px 16px, fondo white, borde-top gray-200
- Input: padding 10px 12px, border-radius md (8px)
- Boton: 40x40px, border-radius full, margin-left 8px
- Mobile: boton 44x44px (touch target minimo)

### 4.4 WelcomeMessage

Mensaje de bienvenida que aparece al iniciar un chat nuevo. Es una ChatBubble agente con estilos especiales.

**Props**:
```typescript
interface WelcomeMessageProps {
  municipalityName: string;  // "Vicente Lopez"
  agentName?: string;        // default: "Muni"
}
```

**Visual**: ChatBubble de agente con:
- Icono de Muni mas grande (40x40 en lugar de 32x32)
- Texto del nombre del agente en semibold arriba del mensaje
- Contenido predefinido por municipio (ver seccion 2.3)

**Espaciado**: margin-bottom 24px para separarlo de la conversacion.

### 4.5 FallbackResponse

No es un componente visual separado, es un patron de contenido dentro de ChatBubble agente. El agente lo genera como markdown con esta estructura:

```
No tengo informacion especifica sobre ese tema.
Te sugiero estas alternativas:

- Llamar al [telefono]
- Consultar [web oficial]
- Acercarte a [mesa de entrada]

Si tu consulta es sobre otro tema, con gusto te ayudo.
```

No requiere componente adicional -- ChatBubble lo renderiza correctamente.

### 4.6 TypingIndicator

Indicador de que el agente esta procesando/escribiendo.

**Visual**: Burbuja de agente con tres puntos animados (bouncing dots).

```
  [M]  *  *  *
       (bounce animation, 600ms staggered por 200ms)
```

**Implementacion**:
- Mismo contenedor que ChatBubble agent
- Tres circulos de 8px, color gray-400, gap 4px
- Animacion: translateY(-4px) con ease-in-out, 600ms, stagger 200ms entre puntos
- Aparece inmediatamente al enviar mensaje, desaparece cuando llega la respuesta

**Espaciado**: mismo que ChatBubble agente.

### 4.7 DisclaimerBanner

Banner persistente que informa que es IA. Aparece arriba del area de mensajes.

**Props**:
```typescript
interface DisclaimerBannerProps {
  municipalityUrl: string;    // "vicentelopez.gov.ar"
  onDismiss?: () => void;     // si se permite cerrar (solo por sesion)
}
```

**Visual**:
- Fondo: disclaimer-bg (#FFFBEB)
- Borde: 1px disclaimer-border (#FDE68A)
- Icono: info circle, color disclaimer-text (#92400E)
- Texto: body-sm (14px), color disclaimer-text
- Boton cerrar: X, 24x24px, hover fondo disclaimer-border/50%
- Border-radius: 0 (full-width dentro del chat)

**Texto**: "Muni es una inteligencia artificial. Las respuestas son orientativas y pueden contener errores. Para informacion oficial: [link municipio]"

**Comportamiento**:
- Visible por defecto al entrar al chat
- Se puede cerrar (X). Se oculta por la sesion actual. Vuelve a aparecer si recarga.
- En mobile: texto puede truncarse a 2 lineas con "ver mas"

**Espaciado**: padding 8px 16px, texto con padding-left 8px del icono.

---

## 5. Responsive breakpoints

### 5.1 Definicion

```
MOBILE:   < 768px    -- 1 columna, nav hamburger, cards horizontales
TABLET:   768-1024px -- 2 columnas, nav visible, cards verticales
DESKTOP:  > 1024px   -- 3 columnas cards, layout expandido
```

### 5.2 Comportamiento por seccion

| Seccion                 | Mobile              | Tablet               | Desktop               |
|-------------------------|---------------------|-----------------------|-----------------------|
| Header nav              | Hamburger menu      | Links visibles        | Links visibles        |
| Hero heading            | 24px (h2)           | 30px (h1)            | 36px (display)        |
| Municipality grid       | 1 col, horizontal   | 2 col, vertical cards | 3 col, vertical cards |
| About features          | 1 col, stacked      | 3 col                | 3 col                 |
| Footer                  | 1 col, stacked      | 3 col                | 3 col                 |
| Chat area               | Full-screen         | Full-screen           | max-width 900px center|
| Chat bubble max-width   | 85%                 | 80%                  | 75%                   |
| Chat input              | Fixed bottom        | Fixed bottom          | Fixed bottom           |
| Legal pages             | padding 16px        | padding 24px         | max-width 768px center|

### 5.3 Max-widths

```
Landing contenido:  max-width 1200px, centrado, padding-x 16px (mobile) / 24px (tablet) / 32px (desktop)
Chat contenedor:    max-width 900px, centrado
Legal contenido:    max-width 768px, centrado
```

---

## 6. Accesibilidad (WCAG 2.1 AA)

### 6.1 Contraste de colores

Todos los pares de colores del sistema cumplen ratio minimo 4.5:1 para texto normal y 3:1 para texto grande / componentes UI. Ver tabla en seccion 1.2.

### 6.2 ARIA labels

```html
<!-- Landing -->
<header role="banner" aria-label="Encabezado MunicipIA">
<nav aria-label="Navegacion principal">
<main role="main">
<section aria-label="Selector de municipios">
<footer role="contentinfo">

<!-- Municipality Card -->
<a href="/chat/vicente-lopez"
   role="link"
   aria-label="Chatear con el asistente de Vicente Lopez">

<!-- Chat -->
<main role="main" aria-label="Conversacion con Muni">
<div role="log" aria-label="Mensajes del chat" aria-live="polite">
<div role="status" aria-label="Muni esta escribiendo">  <!-- TypingIndicator -->

<!-- ChatBubble -->
<div role="article"
     aria-label="Mensaje de Muni, 14:32">  <!-- agente -->
<div role="article"
     aria-label="Tu mensaje, 14:33">       <!-- usuario -->

<!-- ChatInput -->
<textarea aria-label="Escribi tu consulta al asistente municipal"
          aria-describedby="chat-disclaimer">
<button aria-label="Enviar mensaje"
        aria-disabled="true">  <!-- cuando no hay texto -->

<!-- Disclaimer -->
<div role="alert" aria-label="Aviso sobre inteligencia artificial"
     id="chat-disclaimer">

<!-- Nuevo chat -->
<button aria-label="Iniciar nueva conversacion">

<!-- Volver -->
<a aria-label="Volver al selector de municipios">
```

### 6.3 Navegacion por teclado

**Landing page -- Tab order**:
1. Skip to content link (visible on focus)
2. Logo (link a home)
3. Nav links: Acerca de, Contacto, GitHub
4. Boton "Elegir mi municipio" (scroll down)
5. Cards de municipios (una por una, en orden de lectura)
6. Boton "Ver en GitHub"
7. Footer links

**Chat -- Tab order**:
1. Boton Volver
2. Boton Nuevo chat
3. Boton cerrar disclaimer (si visible)
4. Link en disclaimer
5. Area de mensajes (scrollable con flechas)
6. Links dentro de mensajes
7. Textarea de input
8. Boton enviar

**Atajos de teclado en chat**:
- Enter: enviar mensaje
- Shift+Enter: nueva linea
- Escape: si hay menu abierto, cerrarlo

### 6.4 Focus indicators

```css
/* Estilo global de foco */
:focus-visible {
  outline: 2px solid #2563EB;  /* primary-600 */
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip to content */
.skip-link:focus {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 100;
  padding: 8px 16px;
  background: #2563EB;
  color: white;
  border-radius: 8px;
}
```

Nunca se elimina el outline sin reemplazo visible.

### 6.5 Semantica HTML

- Headings en orden (h1 > h2 > h3, sin saltar niveles)
- Listas para conjuntos de items (municipios, features, links footer)
- `<time>` para timestamps en mensajes
- Links descriptivos (no "click aqui")
- Imagenes decorativas con `alt=""`
- Escudos municipales con `alt="Escudo de Vicente Lopez"`

### 6.6 Touch targets

Todo elemento interactivo tiene minimo 44x44px de area tactil en mobile:
- Cards de municipio: minimo 64px de alto
- Boton enviar: 44x44px
- Boton cerrar disclaimer: 44x44px (area tactil, icono visual puede ser 24px)
- Links en footer: padding vertical 12px para ampliar area

### 6.7 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  /* TypingIndicator: puntos estaticos sin bounce */
  /* Transiciones de hover: instantaneas */
  /* Streaming: texto aparece de golpe sin animacion progresiva */
}
```

### 6.8 Screen reader - contenido dinamico

- Area de mensajes usa `aria-live="polite"` para anunciar nuevos mensajes
- TypingIndicator usa `role="status"` para anunciar "Muni esta escribiendo"
- DisclaimerBanner usa `role="alert"` solo en primera aparicion

---

## Anexo: Resumen de tokens de diseno

Referencia rapida para el equipo de desarrollo frontend.

```css
/* Colors */
--color-primary-50: #EFF6FF;
--color-primary-100: #DBEAFE;
--color-primary-300: #93C5FD;
--color-primary-600: #2563EB;
--color-primary-700: #1D4ED8;
--color-secondary-50: #ECFDF5;
--color-secondary-600: #059669;
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-700: #374151;
--color-gray-900: #111827;
--color-success: #22C55E;
--color-warning: #F59E0B;
--color-error: #EF4444;
--color-disclaimer-bg: #FFFBEB;
--color-disclaimer-border: #FDE68A;
--color-disclaimer-text: #92400E;

/* Typography */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Border radius */
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);

/* Transitions */
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;
```
