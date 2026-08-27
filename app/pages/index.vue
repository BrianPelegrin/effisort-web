<template>
  <div class="landing-home">
    <!-- Hero section -->
    <section id="inicio" class="hero-section">
      <div class="hero-glow hero-glow-left"></div>
      <div class="hero-glow hero-glow-right"></div>

      <div class="container hero-container">
        <div class="row align-items-center g-5">
          <div class="col-lg-6 hero-content">
            <span class="eyebrow-badge">
              <i class="bi bi-lightning-charge-fill"></i>
              Solución para e-CF y gestión comercial
            </span>

            <h1>
              Simplifica la facturación electrónica de tu empresa con una plataforma
              <span>ágil, segura y fácil de usar</span>
            </h1>

            <p class="hero-description">
              Effisort te ayuda a emitir comprobantes electrónicos, controlar tus ventas, gestionar clientes y mantener tu operación organizada desde una sola plataforma.
            </p>

            <div class="hero-actions">
              <a href="#planes" class="btn primary-button">
                <i class="bi bi-tags-fill"></i>
                Ver planes
                <i class="bi bi-arrow-right button-arrow"></i>
              </a>
              <a href="#funcionalidades" class="btn secondary-button">
                <i class="bi bi-info-circle"></i>
                Conocer funcionalidades
              </a>
            </div>

            <div class="hero-trust-list">
              <div><i class="bi bi-check-circle-fill"></i><span>Panel intuitivo</span></div>
              <div><i class="bi bi-check-circle-fill"></i><span>Clientes + facturas</span></div>
              <div><i class="bi bi-check-circle-fill"></i><span>Escalable por planes</span></div>
            </div>
          </div>

          <div class="col-lg-6 hero-visual-column">
            <div class="hero-visual">
              <div class="hero-image-frame">
                <img
                  src="/images/hero-image.png"
                  alt="Plataforma de facturación electrónica Effisort"
                  class="hero-image"
                />
              </div>
              <span class="visual-status visual-status-top">
                <i class="bi bi-shield-check"></i>
                Operación segura
              </span>
              <span class="visual-status visual-status-bottom">
                <i class="bi bi-check-circle-fill"></i>
                Comprobante emitido
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits section -->
    <section id="beneficios" class="section-block benefits-section">
      <div class="container">
        <div class="section-heading text-center">
          <span class="section-kicker">Beneficios</span>
          <h2>¿Por qué elegir nuestro sistema?</h2>
          <p>Diseñado para equipos que necesitan velocidad, orden y control en su proceso de facturación.</p>
        </div>

        <div class="row g-4">
          <div v-for="(benefit, index) in benefits" :key="benefit.title" class="col-md-6 col-xl-3">
            <article class="benefit-card h-100" :class="`benefit-card-${index + 1}`">
              <div class="icon-box benefit-icon"><i :class="benefit.icon"></i></div>
              <div>
                <h3>{{ benefit.title }}</h3>
                <p>{{ benefit.description }}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- Features section -->
    <section id="funcionalidades" class="features-section">
      <div class="modules-band">
        <div class="container">
          <div class="platform-label">
            <i class="bi bi-layers"></i>
            <span>Plataforma Effisort</span>
            <small>e-CF</small>
          </div>
          <div class="section-heading section-heading-light">
            <span class="section-kicker">Funcionalidades</span>
            <h2>Todo lo que necesitas para gestionar tu facturación</h2>
            <p>Una solución diseñada para organizar tu facturación, clientes y operación comercial.</p>
          </div>

          <div class="row g-4">
            <div class="col-md-6 col-xl-3">
              <article class="module-card h-100">
                <div class="icon-box module-icon"><i class="bi bi-file-earmark-text"></i></div>
                <h3>Facturación electrónica</h3>
                <p>Emite y organiza comprobantes electrónicos e-CF de forma simple.</p>
              </article>
            </div>
            <div class="col-md-6 col-xl-3">
              <article class="module-card h-100">
                <div class="icon-box module-icon module-icon-purple"><i class="bi bi-briefcase-fill"></i></div>
                <h3>Gestión comercial</h3>
                <p>Administra clientes, ventas, productos y documentos desde un solo lugar.</p>
              </article>
            </div>
            <div class="col-md-6 col-xl-3">
              <article class="module-card h-100">
                <div class="icon-box module-icon module-icon-green"><i class="bi bi-cash-coin"></i></div>
                <h3>Control financiero</h3>
                <p>Gestiona cuentas por cobrar y cuentas por pagar con mayor visibilidad.</p>
              </article>
            </div>
            <div class="col-md-6 col-xl-3">
              <article class="module-card h-100">
                <div class="icon-box module-icon module-icon-orange"><i class="bi bi-graph-up-arrow"></i></div>
                <h3>Reportes e integraciones</h3>
                <p>Consulta información clave y conecta Effisort con otros sistemas.</p>
              </article>
            </div>
          </div>

          <div class="platform-flow">
            <span>Configura</span><i class="bi bi-arrow-right"></i>
            <span>Emite</span><i class="bi bi-arrow-right"></i>
            <span>Envía</span><i class="bi bi-arrow-right"></i>
            <span>Controla</span>
          </div>
        </div>
      </div>

      <div class="feature-details section-block">
        <div class="container">
          <div class="row g-5 align-items-center">
            <div class="col-lg-5">
              <span class="section-kicker">Gestión centralizada</span>
              <h2>Todo lo que necesitas para gestionar tu empresa</h2>
              <p class="feature-intro">
                Desde la creación de facturas hasta el control de clientes y reportes, con una experiencia visual clara y orientada a productividad.
              </p>

              <div class="feature-highlight-list">
                <div v-for="item in featureHighlights" :key="item" class="feature-highlight">
                  <i class="bi bi-check-circle-fill"></i>
                  <span>{{ item }}</span>
                </div>
              </div>
            </div>

            <div class="col-lg-7">
              <div class="row g-4">
                <div v-for="(feature, index) in features" :key="feature.title" class="col-md-6">
                  <article class="feature-card h-100" :class="{ 'feature-card-wide': index === features.length - 1 }">
                    <div class="icon-box feature-icon"><i :class="feature.icon"></i></div>
                    <h3>{{ feature.title }}</h3>
                    <p>{{ feature.description }}</p>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Audience section -->
    <section id="ideal-para" class="section-block audience-section">
      <div class="container">
        <div class="section-heading text-center">
          <span class="section-kicker">Ideal para</span>
          <h2>Ideal para negocios que necesitan facturar con más control</h2>
          <p>Effisort se adapta a empresas que buscan simplificar su facturación electrónica, organizar sus procesos comerciales y tener mayor visibilidad de su operación.</p>
        </div>

        <div class="audience-grid">
          <article v-for="(item, index) in idealFor" :key="item.title" class="audience-card">
            <div class="icon-box audience-icon" :class="`audience-icon-${(index % 4) + 1}`">
              <i :class="item.icon"></i>
            </div>
            <h3>{{ item.title }}</h3>
          </article>
        </div>
      </div>
    </section>

    <!-- Steps section -->
    <section class="section-block steps-section">
      <div class="container">
        <div class="section-heading text-center">
          <span class="section-kicker">Proceso simple</span>
          <h2>Cómo funciona</h2>
          <p>Un flujo simple para que tu equipo empiece a facturar en poco tiempo.</p>
        </div>

        <div class="steps-grid">
          <article v-for="(step, index) in steps" :key="step.title" class="step-card">
            <div class="step-number">{{ index + 1 }}</div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Pricing section -->
    <section id="planes" class="section-block pricing-section">
      <div class="container">
        <div class="section-heading text-center">
          <span class="section-kicker">Planes</span>
          <h2>Planes para cada etapa de tu negocio</h2>
          <p>Elige el plan que mejor se adapte a tu volumen de facturación y necesidades operativas.</p>
        </div>

        <div class="row g-4 align-items-stretch justify-content-center pricing-grid">
          <div v-for="plan in plans" :key="plan.name" class="col-lg-5">
            <article class="pricing-card h-100" :class="{ 'pricing-card-featured': plan.featured }">
              <span v-if="plan.featured" class="popular-badge">Más popular</span>

              <div class="pricing-header">
                <h3>{{ plan.name }}</h3>
                <p>{{ plan.tagline }}</p>
              </div>

              <div class="pricing-amount">
                <span>{{ plan.price }}</span>
                <small>/ mes</small>
              </div>
              <p class="pricing-note">{{ plan.note }}</p>

              <ul>
                <li v-for="feature in plan.features" :key="feature">
                  <i class="bi bi-check-lg"></i>
                  <span>{{ feature }}</span>
                </li>
              </ul>

              <a href="#cta" class="btn pricing-button" :class="{ 'pricing-button-featured': plan.featured }">
                {{ plan.cta }}
                <i class="bi bi-arrow-right"></i>
              </a>
            </article>
          </div>
        </div>

        <p class="pricing-disclaimer">* Puedes solicitar una propuesta personalizada para volúmenes altos o requerimientos especiales.</p>
      </div>
    </section>

    <!-- Call to action section -->
    <section id="cta" class="cta-section">
      <div class="container">
        <div class="cta-card">
          <div class="cta-decoration cta-decoration-left"></div>
          <div class="cta-decoration cta-decoration-right"></div>
          <div class="row align-items-center g-4 position-relative">
            <div class="col-lg-8">
              <span class="cta-kicker">Da el siguiente paso</span>
              <h2>¿Listo para modernizar tu facturación?</h2>
              <p>Empieza con una experiencia de facturación más clara, rápida y profesional.</p>
            </div>
            <div class="col-lg-4">
              <div class="cta-actions">
                <a href="#planes" class="btn cta-secondary-button">Ver planes</a>
                <NuxtLink to="/auth/login" class="btn cta-primary-button">
                  <i class="bi bi-box-arrow-in-right"></i>
                  Ir al login
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ section -->
    <section id="faq" class="section-block faq-section">
      <div class="container">
        <div class="section-heading text-center">
          <span class="section-kicker">FAQ</span>
          <h2>Preguntas frecuentes</h2>
          <p>Respuestas rápidas para ayudarte a decidir.</p>
        </div>

        <div class="row justify-content-center">
          <div class="col-lg-9">
            <div id="faqAccordion" class="accordion custom-accordion">
              <div v-for="(faq, index) in faqs" :key="faq.q" class="accordion-item">
                <h3 class="accordion-header">
                  <button
                    class="accordion-button"
                    :class="{ collapsed: index !== 0 }"
                    type="button"
                    data-bs-toggle="collapse"
                    :data-bs-target="`#faq-${index}`"
                    :aria-expanded="index === 0 ? 'true' : 'false'"
                    :aria-controls="`faq-${index}`"
                  >
                    {{ faq.q }}
                  </button>
                </h3>

                <div
                  :id="`faq-${index}`"
                  class="accordion-collapse collapse"
                  :class="{ show: index === 0 }"
                  data-bs-parent="#faqAccordion"
                >
                  <div class="accordion-body">{{ faq.a }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Facturación electrónica y gestión comercial | Effisort',
  meta: [
    {
      name: 'description',
      content: 'Plataforma de facturación electrónica y gestión comercial con planes escalables para organizar y hacer crecer tu negocio.',
    },
    { name: 'robots', content: 'index,follow' },
  ],
})

const benefits = [
  { icon: 'bi bi-lightning-charge-fill', title: 'Facturación más rápida', description: 'Emite comprobantes electrónicos en pocos pasos, reduciendo errores y tiempo operativo.' },
  { icon: 'bi bi-graph-up-arrow', title: 'Mayor control del negocio', description: 'Visualiza ventas, clientes, saldos pendientes y reportes desde un solo panel.' },
  { icon: 'bi bi-layers-fill', title: 'Operación más organizada', description: 'Centraliza la información comercial de tu empresa y facilita el seguimiento de cada transacción.' },
  { icon: 'bi bi-rocket-takeoff-fill', title: 'Listo para crecer', description: 'Escala tu operación con usuarios, inventario, sucursales, integraciones y funcionalidades avanzadas.' },
]

const featureHighlights = [
  'Creación de facturas con cálculo automático de impuestos',
  'Catálogo de clientes y productos',
  'Panel de resumen con estados y montos',
  'Diseño responsive para escritorio y tablet',
  'Experiencia moderna basada en dashboard admin',
]

const features = [
  { icon: 'bi bi-file-earmark-plus', title: 'Generación de facturas', description: 'Crea facturas con líneas de detalle, cantidades, precios e impuestos de forma rápida.' },
  { icon: 'bi bi-person-vcard', title: 'Clientes y datos fiscales', description: 'Asocia clientes con RNC/Cédula, correo, teléfono y dirección desde un flujo práctico.' },
  { icon: 'bi bi-receipt', title: 'Resumen y totales', description: 'Obtén subtotales, impuestos y total general con una visualización clara del comprobante.' },
  { icon: 'bi bi-cash-coin', title: 'Control financiero integrado', description: 'Administra cuentas por cobrar y cuentas por pagar, visualiza saldos pendientes y mejora el control del flujo de efectivo de tu negocio.' },
  { icon: 'bi bi-layers-fill', title: 'Planes escalables', description: 'Elige funcionalidades y capacidad según el tamaño y crecimiento de tu negocio.' },
]

const idealFor = [
  { icon: 'bi bi-person-badge', title: 'Emprendedores y pequeños negocios' },
  { icon: 'bi bi-shop', title: 'Tiendas y comercios' },
  { icon: 'bi bi-briefcase-fill', title: 'Empresas de servicios' },
  { icon: 'bi bi-diagram-3', title: 'Negocios con varias sucursales' },
  { icon: 'bi bi-graph-up-arrow', title: 'Empresas que necesitan reportes e integraciones' },
]

const steps = [
  { title: 'Configura tu empresa', description: 'Registra los datos de tu negocio, usuarios, clientes y parámetros básicos de facturación.' },
  { title: 'Emite tus comprobantes', description: 'Genera facturas electrónicas, notas de crédito o débito desde un panel fácil de utilizar.' },
  { title: 'Controla tu operación', description: 'Consulta reportes, ventas, cuentas pendientes, inventario y métricas importantes para tu negocio.' },
]

const plans = [
  {
    name: 'Plan Básico Effisort',
    tagline: 'Ideal para emprendedores y pequeños negocios. Facturación electrónica simple y cumplimiento DGII al mejor precio.',
    price: 'RD$990',
    note: 'RD$9,900/año · 1 mes gratis',
    featured: false,
    cta: 'Comenzar con Básico',
    features: [
      'Emisión de facturas electrónicas (e-CF)',
      'Notas de crédito y débito',
      'Gestión básica de clientes',
      'Reportes de ventas',
      'Envío automático por email',
      'Cumplimiento DGII',
      'Hasta 100 facturas electrónicas al mes',
      '1 usuario incluido',
      'Soporte por email y WhatsApp',
    ],
  },
  {
    name: 'Plan Avanzado Effisort',
    tagline: 'Ideal para negocios en crecimiento. Herramientas avanzadas para llevar tu facturación al siguiente nivel.',
    price: 'RD$2,990',
    note: 'RD$29,900/año · 2 meses gratis',
    featured: true,
    cta: 'Elegir Plan Avanzado',
    features: [
      'Todo lo incluido en el Plan Básico',
      'Facturación electrónica ilimitada (e-CF)',
      'Hasta 5 usuarios simultáneos',
      'Control de inventario completo',
      'Gestión de cuentas por cobrar y cuentas por pagar',
      'Reportes avanzados',
      'Dashboard de ventas',
      'Facturación recurrente',
      'Gestión multi-sucursal',
      'API para integraciones',
      'Soporte prioritario',
      'Usuarios adicionales disponibles con cargo adicional',
    ],
  },
]

const faqs = [
  { q: '¿Puedo comenzar con un plan y luego cambiar a otro?', a: 'Sí. Puedes iniciar con un plan básico y migrar a uno superior cuando crezca tu volumen o tus necesidades.' },
  { q: '¿El sistema funciona en computadoras y tablets?', a: 'Sí. La interfaz está diseñada para ser responsive y ofrecer una buena experiencia en escritorio y tablets.' },
  { q: '¿Se pueden gestionar varios usuarios?', a: 'Sí. Dependiendo del plan, puedes crear múltiples usuarios y gestionar accesos para tu equipo.' },
  { q: '¿El plan Enterprise se puede personalizar?', a: 'Sí. Está pensado para requerimientos especiales, integraciones y capacidades adaptadas a tu operación.' },
]
</script>

<style scoped>
.landing-home {
  --effisort-navy: #031b45;
  --effisort-navy-light: #082c64;
  --effisort-primary: #0878ff;
  --effisort-primary-dark: #0062d8;
  --effisort-background: #f4f8fd;
  --effisort-surface: #ffffff;
  --effisort-text: #071d41;
  --effisort-muted: #68758d;
  --effisort-border: #e1e9f3;
  --effisort-success: #16ad69;
  --effisort-purple: #6d43f5;
  --effisort-orange: #ff7917;
  overflow: hidden;
  color: var(--effisort-text);
  background: var(--effisort-surface);
}

.landing-home :is(h1, h2, h3, p) {
  overflow-wrap: anywhere;
}

.landing-home section[id] {
  scroll-margin-top: 72px;
}

.section-block {
  padding: 6.5rem 0;
}

.section-heading {
  max-width: 760px;
  margin: 0 auto 3rem;
}

.section-heading-light {
  max-width: 680px;
  margin: 0 0 2.75rem;
}

.section-kicker,
.cta-kicker {
  display: inline-block;
  margin-bottom: 0.8rem;
  color: var(--effisort-primary);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-heading h2,
.feature-details h2 {
  margin-bottom: 0.85rem;
  color: var(--effisort-text);
  font-size: clamp(2rem, 3.5vw, 2.85rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.12;
}

.section-heading p,
.feature-intro {
  margin: 0;
  color: var(--effisort-muted);
  font-size: 1.05rem;
  line-height: 1.75;
}

.hero-section {
  position: relative;
  min-height: 690px;
  margin-top: 0.75rem;
  background:
    linear-gradient(105deg, rgba(244, 248, 253, 0.97) 0%, rgba(244, 248, 253, 0.92) 48%, rgba(231, 240, 252, 0.72) 100%);
}

.hero-container {
  position: relative;
  z-index: 2;
  padding-top: 5.25rem;
  padding-bottom: 5.25rem;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(6px);
  pointer-events: none;
}

.hero-glow-left {
  top: -180px;
  left: -180px;
  width: 480px;
  height: 480px;
  background: rgba(8, 120, 255, 0.12);
}

.hero-glow-right {
  right: -180px;
  bottom: -260px;
  width: 620px;
  height: 620px;
  background: rgba(109, 67, 245, 0.08);
}

.eyebrow-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 1.3rem;
  padding: 0.55rem 0.95rem;
  border: 1px solid rgba(8, 120, 255, 0.28);
  border-radius: 999px;
  color: var(--effisort-navy);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 8px 24px rgba(8, 44, 100, 0.06);
  font-size: 0.82rem;
  font-weight: 700;
}

.eyebrow-badge i {
  color: var(--effisort-primary);
}

.hero-content h1 {
  max-width: 690px;
  margin: 0 0 1.25rem;
  color: var(--effisort-navy);
  font-size: clamp(2.7rem, 4.2vw, 4.15rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 1.08;
}

.hero-content h1 span {
  color: var(--effisort-primary);
}

.hero-description {
  max-width: 650px;
  margin: 0 0 1.8rem;
  color: #52627d;
  font-size: 1.08rem;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-bottom: 1.65rem;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 0.8rem 1.3rem;
  border-radius: 10px;
  font-size: 0.93rem;
  font-weight: 750;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.primary-button {
  border-color: var(--effisort-primary);
  color: #fff;
  background: linear-gradient(135deg, var(--effisort-primary), #0566e8);
  box-shadow: 0 12px 26px rgba(8, 120, 255, 0.24);
}

.primary-button:hover {
  border-color: var(--effisort-primary-dark);
  color: #fff;
  background: var(--effisort-primary-dark);
  transform: translateY(-2px);
}

.button-arrow {
  margin-left: 0.35rem;
  font-size: 0.78rem;
}

.secondary-button {
  border: 1px solid #c9d6e8;
  color: var(--effisort-navy);
  background: rgba(255, 255, 255, 0.68);
}

.secondary-button:hover {
  border-color: var(--effisort-primary);
  color: var(--effisort-primary);
  background: #fff;
  transform: translateY(-2px);
}

.hero-trust-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.4rem;
  color: #52627d;
  font-size: 0.82rem;
  font-weight: 600;
}

.hero-trust-list div {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.hero-trust-list i {
  color: var(--effisort-success);
}

.hero-visual {
  position: relative;
  margin-right: -5rem;
}

.hero-image-frame {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 34px;
  box-shadow: 0 30px 70px rgba(3, 27, 69, 0.22);
}

.hero-image {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
}

.visual-status {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(225, 233, 243, 0.9);
  border-radius: 12px;
  color: var(--effisort-navy);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 35px rgba(3, 27, 69, 0.16);
  backdrop-filter: blur(10px);
  font-size: 0.8rem;
  font-weight: 750;
}

.visual-status i {
  color: var(--effisort-primary);
}

.visual-status-top {
  top: 12%;
  left: -5%;
}

.visual-status-bottom {
  right: 2%;
  bottom: 10%;
}

.visual-status-bottom i {
  color: var(--effisort-success);
}

.benefits-section {
  position: relative;
  background: #fff;
}

.benefit-card,
.feature-card,
.audience-card,
.pricing-card,
.module-card {
  border: 1px solid var(--effisort-border);
  border-radius: 18px;
  background: var(--effisort-surface);
  box-shadow: 0 14px 35px rgba(3, 27, 69, 0.07);
}

.benefit-card {
  display: flex;
  gap: 1rem;
  padding: 1.65rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.benefit-card:hover,
.feature-card:hover,
.audience-card:hover {
  box-shadow: 0 20px 42px rgba(3, 27, 69, 0.11);
  transform: translateY(-5px);
}

.icon-box {
  display: inline-flex;
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 1.05rem;
}

.benefit-icon {
  color: #fff;
  background: var(--effisort-primary);
  box-shadow: 0 10px 20px rgba(8, 120, 255, 0.2);
}

.benefit-card-2 .benefit-icon {
  background: var(--effisort-success);
  box-shadow: 0 10px 20px rgba(22, 173, 105, 0.2);
}

.benefit-card-3 .benefit-icon {
  background: var(--effisort-purple);
  box-shadow: 0 10px 20px rgba(109, 67, 245, 0.2);
}

.benefit-card-4 .benefit-icon {
  background: var(--effisort-orange);
  box-shadow: 0 10px 20px rgba(255, 121, 23, 0.2);
}

.benefit-card h3,
.module-card h3,
.feature-card h3,
.audience-card h3,
.step-card h3 {
  margin-bottom: 0.5rem;
  color: var(--effisort-text);
  font-size: 1rem;
  font-weight: 750;
  line-height: 1.35;
}

.benefit-card p,
.module-card p,
.feature-card p,
.step-card p {
  margin: 0;
  color: var(--effisort-muted);
  font-size: 0.88rem;
  line-height: 1.7;
}

.modules-band {
  padding: 6rem 0;
  background:
    radial-gradient(circle at 80% 0%, rgba(8, 120, 255, 0.34), transparent 38%),
    linear-gradient(135deg, #021634, var(--effisort-navy-light));
}

.platform-label {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.86rem;
  font-weight: 750;
}

.platform-label i {
  color: #68aaff;
}

.platform-label small {
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  color: #fff;
  background: var(--effisort-primary);
  font-size: 0.68rem;
}

.section-heading-light .section-kicker {
  color: #68aaff;
}

.section-heading-light h2 {
  color: #fff;
}

.section-heading-light p {
  color: rgba(255, 255, 255, 0.68);
}

.module-card {
  padding: 1.55rem;
  border-color: rgba(255, 255, 255, 0.13);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.18);
}

.module-icon,
.feature-icon,
.audience-icon {
  margin-bottom: 1rem;
  color: var(--effisort-primary);
  background: rgba(8, 120, 255, 0.1);
}

.module-icon-purple,
.audience-icon-3 {
  color: var(--effisort-purple);
  background: rgba(109, 67, 245, 0.1);
}

.module-icon-green,
.audience-icon-2 {
  color: var(--effisort-success);
  background: rgba(22, 173, 105, 0.1);
}

.module-icon-orange,
.audience-icon-4 {
  color: var(--effisort-orange);
  background: rgba(255, 121, 23, 0.1);
}

.platform-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 2.25rem;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.8rem;
  font-weight: 700;
}

.platform-flow span {
  padding: 0.5rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}

.platform-flow i {
  color: #68aaff;
  font-size: 0.7rem;
}

.feature-details {
  background: var(--effisort-background);
}

.feature-highlight-list {
  display: grid;
  gap: 0.8rem;
  margin-top: 2rem;
}

.feature-highlight {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--effisort-border);
  border-radius: 12px;
  color: #33445f;
  background: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 650;
}

.feature-highlight i {
  margin-top: 0.2rem;
  color: var(--effisort-success);
}

.feature-card {
  padding: 1.6rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.audience-section {
  background: #fff;
}

.audience-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;
}

.audience-card {
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.audience-card h3 {
  margin: 0;
}

.steps-section {
  background: var(--effisort-background);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2rem;
}

.step-card {
  position: relative;
  text-align: center;
}

.step-number {
  position: relative;
  z-index: 2;
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.2rem;
  border: 6px solid #dfeeff;
  border-radius: 50%;
  color: #fff;
  background: var(--effisort-primary);
  box-shadow: 0 10px 20px rgba(8, 120, 255, 0.2);
  font-weight: 800;
}

.pricing-section {
  background: #fff;
}

.pricing-grid {
  max-width: 1100px;
  margin-right: auto;
  margin-left: auto;
}

.pricing-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 2.25rem;
}

.pricing-card-featured {
  border: 2px solid var(--effisort-primary);
  box-shadow: 0 24px 60px rgba(8, 120, 255, 0.16);
}

.popular-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  color: #fff;
  background: var(--effisort-primary);
  font-size: 0.72rem;
  font-weight: 750;
}

.pricing-header {
  padding-right: 5rem;
}

.pricing-header h3 {
  margin-bottom: 0.6rem;
  color: var(--effisort-text);
  font-size: 1.35rem;
  font-weight: 800;
}

.pricing-header p,
.pricing-note {
  color: var(--effisort-muted);
  font-size: 0.87rem;
  line-height: 1.65;
}

.pricing-amount {
  display: flex;
  align-items: flex-end;
  gap: 0.45rem;
  margin-top: 1.4rem;
}

.pricing-amount span {
  color: var(--effisort-navy);
  font-size: 2.8rem;
  font-weight: 850;
  letter-spacing: -0.045em;
  line-height: 1;
}

.pricing-amount small {
  margin-bottom: 0.25rem;
  color: var(--effisort-muted);
}

.pricing-note {
  margin: 0.6rem 0 1.5rem;
}

.pricing-card ul {
  flex: 1;
  margin: 0 0 1.8rem;
  padding: 1.5rem 0 0;
  border-top: 1px solid var(--effisort-border);
  list-style: none;
}

.pricing-card li {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  margin-bottom: 0.75rem;
  color: #3f4f68;
  font-size: 0.87rem;
}

.pricing-card li i {
  margin-top: 0.2rem;
  color: var(--effisort-success);
}

.pricing-button {
  display: inline-flex;
  min-height: 50px;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  border: 1px solid var(--effisort-primary);
  border-radius: 10px;
  color: var(--effisort-primary);
  font-weight: 750;
}

.pricing-button:hover,
.pricing-button-featured {
  color: #fff;
  background: var(--effisort-primary);
}

.pricing-button-featured:hover {
  background: var(--effisort-primary-dark);
}

.pricing-disclaimer {
  margin: 1.5rem 0 0;
  color: var(--effisort-muted);
  font-size: 0.8rem;
  text-align: center;
}

.cta-section {
  padding: 1rem 0 6.5rem;
  background: #fff;
}

.cta-card {
  position: relative;
  overflow: hidden;
  padding: 3.5rem;
  border-radius: 24px;
  color: #fff;
  background: linear-gradient(125deg, #021634, #073b86 68%, #0878ff);
  box-shadow: 0 24px 60px rgba(3, 27, 69, 0.18);
}

.cta-decoration {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.cta-decoration-left {
  bottom: -130px;
  left: -80px;
  width: 280px;
  height: 280px;
}

.cta-decoration-right {
  top: -170px;
  right: -100px;
  width: 360px;
  height: 360px;
}

.cta-kicker {
  color: #76b3ff;
}

.cta-card h2 {
  margin-bottom: 0.65rem;
  color: #fff;
  font-size: clamp(2rem, 3vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.cta-card p {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 1rem;
}

.cta-actions {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
  gap: 0.8rem;
}

.cta-primary-button,
.cta-secondary-button {
  display: inline-flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.75rem 1.15rem;
  border-radius: 10px;
  font-weight: 750;
}

.cta-primary-button {
  color: var(--effisort-primary);
  background: #fff;
}

.cta-primary-button:hover {
  color: var(--effisort-primary-dark);
  background: #eef6ff;
}

.cta-secondary-button {
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.cta-secondary-button:hover {
  border-color: #fff;
  color: #fff;
  background: rgba(255, 255, 255, 0.14);
}

.faq-section {
  background: var(--effisort-background);
}

.custom-accordion {
  display: grid;
  gap: 1rem;
}

.custom-accordion .accordion-item {
  overflow: hidden;
  border: 1px solid var(--effisort-border);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(3, 27, 69, 0.06);
}

.custom-accordion .accordion-button {
  padding: 1.25rem 1.4rem;
  color: var(--effisort-text);
  background: #fff;
  box-shadow: none;
  font-size: 0.98rem;
  font-weight: 750;
}

.custom-accordion .accordion-button:not(.collapsed) {
  color: var(--effisort-primary);
  background: #f8fbff;
}

.custom-accordion .accordion-button::after {
  border-radius: 50%;
}

.custom-accordion .accordion-body {
  padding: 0 1.4rem 1.35rem;
  color: var(--effisort-muted);
  line-height: 1.7;
}

@media (min-width: 992px) {
  .feature-card-wide {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1199.98px) {
  .hero-visual {
    margin-right: 0;
  }

  .audience-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 991.98px) {
  .section-block {
    padding: 5rem 0;
  }

  .hero-section {
    min-height: auto;
  }

  .hero-container {
    padding-top: 4rem;
    padding-bottom: 4.5rem;
  }

  .hero-content {
    text-align: center;
  }

  .hero-description {
    margin-right: auto;
    margin-left: auto;
  }

  .hero-actions,
  .hero-trust-list {
    justify-content: center;
  }

  .hero-visual {
    max-width: 760px;
    margin: 0 auto;
  }

  .steps-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

}

@media (max-width: 767.98px) {
  .landing-home .container {
    width: calc(100% - 2rem);
    padding-right: 0;
    padding-left: 0;
  }

  .hero-trust-list,
  .hero-visual-column {
    display: none;
  }

  .section-heading {
    margin-bottom: 2.25rem;
  }

  .hero-content h1 {
    font-size: clamp(2.35rem, 11vw, 3.15rem);
  }

  .hero-image-frame {
    border-radius: 22px;
    box-shadow: 0 20px 45px rgba(3, 27, 69, 0.17);
  }

  .hero-image {
    aspect-ratio: 4 / 3;
    object-position: center;
  }

  .visual-status {
    display: none;
  }

  .benefit-card {
    display: block;
  }

  .benefit-icon {
    margin-bottom: 1rem;
  }

  .audience-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cta-card {
    padding: 2.25rem 1.5rem;
  }
}

@media (max-width: 575.98px) {
  .hero-section {
    margin-top: 0.5rem;
  }

  .section-block,
  .modules-band {
    padding-top: 4rem;
    padding-bottom: 4rem;
  }

  .hero-container {
    padding-top: 3.25rem;
    padding-bottom: 3.75rem;
  }

  .hero-visual {
    width: calc(100% - 0.5rem);
    margin-right: auto;
    margin-left: auto;
    padding: 0.35rem;
    border: 1px solid rgba(8, 120, 255, 0.1);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.5);
  }

  .hero-image-frame {
    border-radius: 16px;
  }

  .hero-actions {
    display: grid;
  }

  .hero-actions .btn {
    width: 100%;
  }

  .platform-flow i {
    display: none;
  }

  .audience-grid {
    grid-template-columns: 1fr;
  }

  .pricing-card {
    padding: 1.6rem;
  }

  .pricing-header {
    padding-right: 0;
    padding-top: 2rem;
  }

  .pricing-amount span {
    font-size: 2.35rem;
  }

}
</style>
