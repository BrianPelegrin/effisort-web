# Propuesta de SEO y semántica para el landing de Effisort

## Estado

- Documento de análisis y planificación.
- No implica cambios implementados en el landing.
- Alcance principal: `app/pages/index.vue` y la configuración relacionada con indexación, metadatos y rendimiento.
- Fecha del análisis: 3 de agosto de 2026.

## Objetivo

Mejorar la capacidad del landing para ser rastreado, interpretado e indexado por motores de búsqueda, aumentar su relevancia para búsquedas relacionadas con facturación electrónica en República Dominicana y conservar una estructura accesible y fácil de mantener.

## Diagnóstico general

El landing posee una base semántica adecuada:

- Utiliza un único encabezado `h1`.
- Mantiene una jerarquía coherente entre `h2` y `h3`.
- Utiliza elementos como `main`, `nav`, `footer`, `section` y `article`.
- Conserva anchors descriptivos para sus secciones.
- Los enlaces de navegación utilizan atributos `href` rastreables.
- La imagen principal cuenta con texto alternativo.
- El título y la descripción actuales explican el propósito general del producto.

El principal inconveniente técnico es que la ruta `/` tiene SSR deshabilitado. Además, faltan metadatos importantes, un sitemap, una estrategia explícita para evitar la indexación de rutas privadas y optimizaciones para la imagen principal.

## Resumen de prioridades

| Prioridad | Mejora | Impacto esperado |
| --- | --- | --- |
| Crítica | Activar SSR o prerenderizado para `/` | Mejor acceso al contenido, indexación y velocidad inicial |
| Alta | Excluir autenticación y administración del índice | Evitar páginas privadas o irrelevantes en buscadores |
| Alta | Incorporar idioma, canonical y metadatos sociales | Mejor interpretación, consolidación de URLs y vistas previas |
| Alta | Crear y publicar un sitemap | Mejor descubrimiento de páginas públicas |
| Alta | Optimizar la imagen del hero | Mejora del LCP y la experiencia móvil |
| Media | Reforzar la intención de búsqueda del contenido | Mayor relevancia comercial y geográfica |
| Media | Incorporar datos estructurados | Mejor comprensión de la marca y el producto |
| Media | Refinar listas, iconos y estados ARIA | Mejor semántica y accesibilidad |

## Fase 1: indexación y renderizado

### 1. Prerenderizar el landing

La configuración actual contiene:

```ts
routeRules: {
  '/admin/**': { ssr: false },
  '/': { ssr: false },
}
```

La propuesta es mantener el panel administrativo como aplicación cliente y prerenderizar el landing:

```ts
routeRules: {
  '/': { prerender: true },
  '/admin/**': { ssr: false },
}
```

Antes de aplicar el cambio se debe validar que:

- El HTML generado incluya el contenido principal sin ejecutar JavaScript.
- La navegación, el accordion y el seguimiento de la sección activa continúen funcionando después de la hidratación.
- El build de producción genere correctamente la ruta `/`.

### 2. Evitar la indexación de rutas privadas

Actualmente existe un `robots: index,follow` global y los layouts de autenticación y administración no definen una política diferente.

Se propone agregar en los layouts `auth` y `admin`:

```ts
useSeoMeta({
  robots: 'noindex, nofollow',
})
```

También se debe:

- Excluir `/auth/**` y `/admin/**` del sitemap.
- Mantener respuestas HTTP apropiadas para contenido protegido.
- Evitar bloquear inicialmente estas rutas en `robots.txt` si el buscador necesita rastrearlas para detectar el `noindex`.

## Fase 2: metadatos técnicos

### 3. Declarar idioma y contexto regional

Configurar explícitamente el idioma del documento:

```ts
useHead({
  htmlAttrs: {
    lang: 'es-DO',
  },
})
```

Esto ayuda a identificar que el contenido está dirigido a usuarios hispanohablantes de República Dominicana.

### 4. Incorporar URL canonical

Agregar una única URL canonical absoluta para la página principal:

```ts
useHead({
  link: [
    {
      rel: 'canonical',
      href: `${siteUrl}/`,
    },
  ],
})
```

Antes de implementarlo es obligatorio confirmar el dominio público definitivo del frontend. La URL del backend no debe utilizarse como canonical.

Se recomienda guardar el dominio público en configuración de runtime para reutilizarlo en canonical, Open Graph, sitemap y datos estructurados.

### 5. Completar metadatos SEO y sociales

Utilizar `useSeoMeta` para mantener una configuración tipada y consistente:

```ts
useSeoMeta({
  title: 'Facturación electrónica e-CF para empresas | Effisort',
  description: 'Emite comprobantes electrónicos e-CF y gestiona clientes, inventario, ventas y cuentas por cobrar desde una plataforma preparada para la DGII.',
  robots: 'index, follow',
  ogTitle: 'Facturación electrónica e-CF para empresas | Effisort',
  ogDescription: 'Emite comprobantes electrónicos e-CF y administra tu operación comercial desde Effisort.',
  ogType: 'website',
  ogLocale: 'es_DO',
  ogUrl: `${siteUrl}/`,
  ogImage: `${siteUrl}/images/effisort-social-cover.webp`,
  twitterCard: 'summary_large_image',
  twitterTitle: 'Facturación electrónica e-CF para empresas | Effisort',
  twitterDescription: 'Facturación electrónica y gestión comercial para empresas dominicanas.',
  twitterImage: `${siteUrl}/images/effisort-social-cover.webp`,
})
```

Los textos son propuestas iniciales y deben validarse comercialmente antes de implementarse.

También se debe corregir o eliminar la descripción global que menciona tres planes si no coincide con la oferta visible actual. La información global no debe contradecir el contenido de la página.

### 6. Crear una imagen social dedicada

Preparar una imagen para compartir el landing:

- Relación de aspecto recomendada: `1.91:1`.
- Tamaño objetivo: `1200 × 630 px`.
- Formato optimizado: WebP o JPG.
- Contenido: marca Effisort, propuesta de valor legible y composición sencilla.
- URL absoluta y pública en los metadatos Open Graph y Twitter.

## Fase 3: sitemap y rastreo

### 7. Generar `sitemap.xml`

El sitemap debe incluir solamente páginas públicas, canónicas e indexables. Como mínimo:

```text
https://dominio-publico.com/
```

Se podrán agregar otras rutas públicas cuando se confirme que poseen contenido definitivo.

El archivo `robots.txt` deberá referenciarlo:

```text
User-agent: *
Disallow:

Sitemap: https://dominio-publico.com/sitemap.xml
```

Después del despliegue se debe registrar el sitemap en Google Search Console y comprobar la URL principal con la herramienta de inspección.

## Fase 4: contenido e intención de búsqueda

### 8. Reforzar el enfoque geográfico y fiscal

El contenido ya incluye conceptos relacionados con facturación y gestión comercial, pero se recomienda introducir de manera natural, cuando corresponda:

- República Dominicana.
- DGII.
- Facturación electrónica e-CF.
- Comprobantes fiscales electrónicos.
- Software de facturación para empresas.
- Gestión de clientes, inventario y cuentas por cobrar.

Estas expresiones deben formar parte de textos útiles para el usuario. No deben repetirse artificialmente ni incorporarse como listas de palabras clave.

### 9. Revisar el título y la descripción

Propuesta de título:

```text
Facturación electrónica e-CF para empresas | Effisort
```

Propuesta de descripción:

```text
Emite comprobantes electrónicos e-CF y gestiona clientes, inventario, ventas y cuentas por cobrar desde una plataforma preparada para la DGII.
```

La versión final debe:

- Representar fielmente las funcionalidades disponibles.
- Evitar promesas que el sistema todavía no pueda cumplir.
- Priorizar claridad y utilidad antes que densidad de palabras clave.

### 10. Crear páginas públicas especializadas a largo plazo

Los anchors del landing ayudan a navegar, pero no son páginas independientes que puedan posicionarse para intenciones distintas.

En una etapa posterior se pueden evaluar rutas públicas prerenderizadas como:

- `/facturacion-electronica`
- `/gestion-de-clientes`
- `/inventario`
- `/cuentas-por-cobrar`
- `/planes`
- `/preguntas-frecuentes`

Cada ruta deberá aportar contenido propio y no repetir simplemente el landing. Las rutas definitivas dependerán de las funcionalidades y de la estrategia comercial aprobada.

## Fase 5: rendimiento y experiencia de página

### 11. Optimizar la imagen principal

La imagen actual `public/images/hero-image.png` pesa aproximadamente 2.3 MB y puede convertirse en el elemento LCP de escritorio.

Se propone:

- Generar versiones WebP o AVIF.
- Ajustar sus dimensiones al tamaño máximo real de renderizado.
- Declarar `width` y `height` para reservar espacio y reducir cambios de layout.
- Utilizar imágenes responsivas cuando existan tamaños diferentes.
- Evaluar `fetchpriority="high"` si la imagen continúa siendo el elemento LCP.
- Comprobar si el navegador descarga la imagen en móvil aunque CSS la oculte.
- Mantener un texto alternativo descriptivo mientras la imagen comunique información.

### 12. Optimizar el logo y los estilos globales

El logo del navbar pesa aproximadamente 251 KB. Se debe revisar si puede reemplazarse por una versión vectorial u otro formato optimizado sin perder calidad.

Además, el landing carga globalmente estilos administrativos como:

- `plugins.min.css`
- `kaiadmin.min.css`

Se propone mover los estilos exclusivos del panel al layout administrativo y mantener en el landing únicamente los recursos que realmente utiliza. La separación debe probarse cuidadosamente para evitar regresiones visuales.

## Fase 6: datos estructurados

### 13. Incorporar JSON-LD

Agregar datos estructurados basados únicamente en información verificable.

Tipos inicialmente recomendados:

- `Organization`
- `WebSite`

Se puede evaluar `SoftwareApplication` cuando estén definidos con precisión el producto, la oferta y los datos requeridos.

No se deben inventar:

- Reseñas.
- Puntuaciones.
- Cantidad de clientes.
- Premios.
- Canales sociales inexistentes.

La implementación debe validarse con Rich Results Test y Schema Markup Validator.

### 14. No priorizar `FAQPage`

Aunque el landing contiene preguntas frecuentes, los resultados enriquecidos de FAQ de Google están limitados principalmente a sitios gubernamentales y de salud. El accordion debe conservarse por su utilidad para el usuario, pero el schema `FAQPage` no representa una prioridad de implementación.

## Fase 7: refinamientos semánticos y de accesibilidad

### 15. Utilizar listas para contenido agrupado

Convertir estructuras que representan listas conceptuales a `ul` y `li`, por ejemplo:

- La lista `.hero-trust-list`.
- Grupos de beneficios breves.
- Colecciones de características cuando no correspondan a artículos independientes.

Los estilos actuales pueden conservarse con clases para evitar cambios visuales.

### 16. Ajustar el estado activo del navbar

Para anchors que señalan la ubicación actual dentro de la misma página, utilizar:

```html
aria-current="location"
```

en lugar de `aria-current="page"`.

### 17. Identificar iconos decorativos

Agregar `aria-hidden="true"` a iconos que no transmiten información adicional:

```html
<i class="bi bi-check-circle" aria-hidden="true"></i>
```

Los controles que solo muestran un icono deben conservar un nombre accesible mediante texto visible o `aria-label`.

## Orden recomendado de implementación

1. Confirmar el dominio público definitivo del frontend.
2. Prerenderizar `/` y verificar el HTML generado.
3. Aplicar `noindex, nofollow` a los layouts privados.
4. Definir `lang="es-DO"`, canonical y metadatos completos.
5. Crear el sitemap y actualizar `robots.txt`.
6. Optimizar el hero, el logo y la carga de CSS.
7. Incorporar datos estructurados verificables.
8. Aplicar refinamientos semánticos y ARIA.
9. Registrar el sitio en Search Console y medir resultados.
10. Evaluar páginas públicas especializadas según datos de búsqueda.

## Validaciones posteriores

Después de implementar los cambios se debe comprobar:

- Build de producción sin errores.
- HTML inicial con `h1`, contenido, canonical y metadatos.
- Ausencia de `index, follow` en autenticación y administración.
- Sitemap accesible y compuesto únicamente por URLs canónicas públicas.
- `robots.txt` accesible.
- Open Graph con URLs absolutas y una imagen pública.
- JSON-LD válido y sin datos inventados.
- Navegación, accordion y anchors funcionales después del prerenderizado.
- Lighthouse o PageSpeed Insights en móvil y escritorio.
- LCP, CLS e INP antes y después de optimizar recursos.
- Inspección de la URL mediante Google Search Console después del despliegue.

## Dependencias y decisiones pendientes

- Confirmar el dominio público del frontend.
- Confirmar si Effisort opera exclusivamente en República Dominicana.
- Aprobar el título y la descripción comerciales definitivos.
- Definir qué rutas públicas adicionales deben indexarse.
- Proporcionar enlaces sociales reales si se incluirán en `Organization`.
- Crear o aprobar la imagen social de `1200 × 630 px`.

## Referencias

- [Google: conceptos básicos de SEO para sitios con JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Nuxt: renderizado híbrido y route rules](https://nuxt.com/docs/4.x/getting-started/server)
- [Nuxt: useSeoMeta](https://nuxt.com/docs/4.x/api/composables/use-seo-meta)
- [Google: crear y enviar un sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: snippets y metadescripciones](https://developers.google.com/search/docs/appearance/snippet)
- [web.dev: optimización del LCP](https://web.dev/articles/optimize-lcp)
- [Google: cambios en resultados enriquecidos de FAQ](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
