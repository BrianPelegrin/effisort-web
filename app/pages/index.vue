<template>
  <!-- Hero -->
  <section class="hero-section py-5 py-lg-6">
    <div class="container">
      <div class="row align-items-center g-4">
        <div class="col-lg-6">
          <span class="badge text-bg-light border mb-3">
            <i class="fas fa-bolt text-warning me-1"></i>
            Facturación electrónica simple y profesional
          </span>

          <h1 class="display-5 fw-bold mb-3">
            Simplifica la facturación electrónica de tu empresa con una plataforma ágil, segura y fácil de usar
          </h1>

          <p class="lead text-muted mb-4">
            Gestiona clientes, productos, impuestos y comprobantes desde una plataforma moderna.
            Ideal para empresas que buscan eficiencia, trazabilidad y una operación más ordenada.
          </p>

          <div class="d-flex flex-wrap gap-2 mb-4">
            <a href="#planes" class="btn btn-primary btn-lg">
              <i class="fas fa-tags me-2"></i>Ver planes
            </a>
            <a href="#funcionalidades" class="btn btn-outline-secondary btn-lg">
              <i class="fas fa-circle-info me-2"></i>Conocer funcionalidades
            </a>
          </div>

          <div class="d-flex flex-wrap gap-3 small text-muted">
            <div class="d-flex align-items-center gap-2">
              <i class="fas fa-circle-check text-success"></i><span>Panel intuitivo</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <i class="fas fa-circle-check text-success"></i><span>Clientes + facturas</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <i class="fas fa-circle-check text-success"></i><span>Escalable por planes</span>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="hero-card card border-0 shadow-lg">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 class="mb-1">Resumen de facturación</h5>
                  <small class="text-muted">Vista de ejemplo del sistema</small>
                </div>
                <span class="badge text-bg-success">Online</span>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-6">
                  <div class="mini-stat">
                    <div class="text-muted small">Facturas del mes</div>
                    <div class="fs-4 fw-bold">1,284</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="mini-stat">
                    <div class="text-muted small">Ingresos facturados</div>
                    <div class="fs-4 fw-bold">RD$2.4M</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="mini-stat">
                    <div class="text-muted small">Clientes activos</div>
                    <div class="fs-4 fw-bold">326</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="mini-stat">
                    <div class="text-muted small">Pendientes</div>
                    <div class="fs-4 fw-bold text-warning">24</div>
                  </div>
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Factura</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>FAC-001245</td>
                      <td>Empresa Atlas SRL</td>
                      <td>RD$18,290</td>
                      <td><span class="badge text-bg-success">Generada</span></td>
                    </tr>
                    <tr>
                      <td>FAC-001246</td>
                      <td>Comercial Nova</td>
                      <td>RD$7,850</td>
                      <td><span class="badge text-bg-warning">Pendiente</span></td>
                    </tr>
                    <tr>
                      <td>FAC-001247</td>
                      <td>Servicios Delta</td>
                      <td>RD$32,400</td>
                      <td><span class="badge text-bg-info">En proceso</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-3 d-flex justify-content-between align-items-center">
                <small class="text-muted">Interfaz moderna, rápida y fácil de usar</small>
                <span class="text-primary fw-semibold">e-CF Ready</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- Beneficios -->
  <section id="beneficios" class="py-5 bg-light-subtle">
    <div class="container">
      <div class="text-center mb-4">
        <h2 class="fw-bold mb-2">¿Por qué elegir nuestro sistema?</h2>
        <p class="text-muted mb-0">
          Diseñado para equipos que necesitan velocidad, orden y control en su proceso de facturación.
        </p>
      </div>

      <div class="row g-4">
        <div class="col-md-6 col-xl-3" v-for="b in benefits" :key="b.title">
          <div class="card h-100 border-0 shadow-sm benefit-card">
            <div class="card-body p-4">
              <div class="icon-box mb-3">
                <i :class="b.icon"></i>
              </div>
              <h5 class="fw-semibold">{{ b.title }}</h5>
              <p class="text-muted mb-0">{{ b.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Funcionalidades -->
  <section id="funcionalidades" class="py-5">
    <div class="container">
      <div class="row g-4 align-items-start">
        <div class="col-lg-5">
          <span class="badge text-bg-primary-subtle text-primary border mb-3">Funcionalidades</span>
          <h2 class="fw-bold mb-3">Todo lo que necesitas para gestionar tu facturación</h2>
          <p class="text-muted">
            Desde la creación de facturas hasta el control de clientes y reportes, con una experiencia
            visual clara y orientada a productividad.
          </p>

          <div class="d-grid gap-2 mt-4">
            <div class="feature-inline" v-for="item in featureHighlights" :key="item">
              <i class="fas fa-circle-check text-success"></i>
              <span>{{ item }}</span>
            </div>
          </div>
        </div>

        <div class="col-lg-7">
          <div class="row g-3">
            <div class="col-md-6" v-for="f in features" :key="f.title">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-body p-4">
                  <div class="icon-box mb-3 soft">
                    <i :class="f.icon"></i>
                  </div>
                  <h5 class="fw-semibold">{{ f.title }}</h5>
                  <p class="text-muted mb-0">{{ f.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- Cómo funciona -->
  <section class="py-5 bg-light-subtle">
    <div class="container">
      <div class="text-center mb-4">
        <h2 class="fw-bold mb-2">Cómo funciona</h2>
        <p class="text-muted mb-0">Un flujo simple para que tu equipo empiece a facturar en poco tiempo.</p>
      </div>

      <div class="row g-4">
        <div class="col-md-4" v-for="(s, idx) in steps" :key="s.title">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4">
              <div class="step-number mb-3">{{ idx + 1 }}</div>
              <h5 class="fw-semibold">{{ s.title }}</h5>
              <p class="text-muted mb-0">{{ s.description }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- Planes -->
  <section id="planes" class="py-5">
    <div class="container">
      <div class="text-center mb-4">
        <span class="badge text-bg-light border mb-2">Planes</span>
        <h2 class="fw-bold mb-2">Planes para cada etapa de tu negocio</h2>
        <p class="text-muted mb-0">
          Elige el plan que mejor se adapte a tu volumen de facturación y necesidades operativas.
        </p>
      </div>

      <div class="row g-4 align-items-stretch">
        <div class="col-lg-4" v-for="p in plans" :key="p.name">
          <div class="card h-100 border-0 shadow-sm pricing-card" :class="{ 'pricing-card-featured': p.featured }">
            <div class="card-body p-4 d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h4 class="fw-bold mb-1">{{ p.name }}</h4>
                  <p class="text-muted mb-0 small">{{ p.tagline }}</p>
                </div>
                <span v-if="p.featured" class="badge text-bg-primary">Más popular</span>
              </div>

              <div class="mb-3">
                <div class="d-flex align-items-end gap-1">
                  <span class="display-6 fw-bold lh-1">{{ p.price }}</span>
                  <span class="text-muted mb-1">/ mes</span>
                </div>
                <small class="text-muted">{{ p.note }}</small>
              </div>

              <ul class="list-unstyled mb-4 flex-grow-1">
                <li class="d-flex align-items-start gap-2 mb-2" v-for="x in p.features" :key="x">
                  <i class="fas fa-check text-success mt-1"></i>
                  <span>{{ x }}</span>
                </li>
              </ul>

              <a href="#cta" class="btn w-100" :class="p.featured ? 'btn-primary' : 'btn-outline-primary'">
                {{ p.cta }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <p class="text-center text-muted small mt-3 mb-0">
        * Puedes solicitar una propuesta personalizada para volúmenes altos o requerimientos especiales.
      </p>
    </div>
  </section>

  <!-- CTA -->
  <section id="cta" class="py-5">
    <div class="container">
      <div class="cta-box p-4 p-lg-5">
        <div class="row align-items-center g-4">
          <div class="col-lg-8">
            <h3 class="fw-bold mb-2">¿Listo para modernizar tu facturación?</h3>
            <p class="text-muted mb-0">
              Empieza con una experiencia de facturación más clara, rápida y profesional.
            </p>
          </div>

          <div class="col-lg-4 text-lg-end">
            <div class="d-flex flex-wrap justify-content-lg-end gap-2">
              <a href="#planes" class="btn btn-outline-secondary">Ver planes</a>
              <NuxtLink to="/auth/login" class="btn btn-primary">
                <i class="fas fa-right-to-bracket me-2"></i>Ir al login
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section id="faq" class="py-5 bg-light-subtle">
    <div class="container">
      <div class="text-center mb-4">
        <h2 class="fw-bold mb-2">Preguntas frecuentes</h2>
        <p class="text-muted mb-0">Respuestas rápidas para ayudarte a decidir.</p>
      </div>

      <div class="row justify-content-center">
        <div class="col-lg-9">
          <div class="accordion custom-accordion" id="faqAccordion">
            <div class="accordion-item border-0 shadow-sm mb-3 rounded-4" v-for="(faq, i) in faqs" :key="faq.q">
              <h2 class="accordion-header">
                <button
                  class="accordion-button rounded-4"
                  :class="{ collapsed: i !== 0 }"
                  type="button"
                  data-bs-toggle="collapse"
                  :data-bs-target="`#faq-${i}`"
                  :aria-expanded="i === 0 ? 'true' : 'false'"
                  :aria-controls="`faq-${i}`"
                >
                  {{ faq.q }}
                </button>
              </h2>

              <div
                :id="`faq-${i}`"
                class="accordion-collapse collapse"
                :class="{ show: i === 0 }"
                data-bs-parent="#faqAccordion"
              >
                <div class="accordion-body text-muted">
                  {{ faq.a }}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">

useHead({
  title: 'Facturación electrónica | Effisort',
  meta: [
    { name: 'description', content: 'Sistema de facturación electrónica con planes escalables para tu negocio.' },
    { name: 'robots', content: 'index,follow' }
  ]
})

const benefits = [
  { icon: 'fas fa-gauge-high', title: 'Rápido y sencillo', description: 'Interfaz intuitiva para emitir facturas en pocos pasos y reducir errores operativos.' },
  { icon: 'fas fa-users', title: 'Gestión de clientes', description: 'Busca, selecciona y administra clientes con datos fiscales y de contacto centralizados.' },
  { icon: 'fas fa-chart-line', title: 'Control de ingresos', description: 'Visualiza actividad de facturación y obtén una mejor visión de tu operación comercial.' },
  { icon: 'fas fa-shield-halved', title: 'Operación confiable', description: 'Flujos organizados y trazabilidad para equipos que necesitan consistencia y control.' }
]

const featureHighlights = [
  'Creación de facturas con cálculo automático de impuestos',
  'Catálogo de clientes y productos',
  'Panel de resumen con estados y montos',
  'Diseño responsive para escritorio y tablet',
  'Experiencia moderna basada en dashboard admin'
]

const features = [
  { icon: 'fas fa-file-circle-plus', title: 'Generación de facturas', description: 'Crea facturas con líneas de detalle, cantidades, precios e impuestos de forma rápida.' },
  { icon: 'fas fa-address-book', title: 'Clientes y datos fiscales', description: 'Asocia clientes con RNC/Cédula, correo, teléfono y dirección desde un flujo práctico.' },
  { icon: 'fas fa-receipt', title: 'Resumen y totales', description: 'Obtén subtotales, impuestos y total general con una visualización clara del comprobante.' },
  { icon: 'fas fa-layer-group', title: 'Planes escalables', description: 'Elige funcionalidades y capacidad según el tamaño y crecimiento de tu negocio.' }
]

const steps = [
  { title: 'Configura tu cuenta', description: 'Define datos del negocio, usuarios y parámetros básicos de facturación.' },
  { title: 'Registra clientes y conceptos', description: 'Carga tus clientes y productos/servicios para emitir facturas más rápido.' },
  { title: 'Genera y gestiona facturas', description: 'Emite comprobantes y administra tu operación desde un solo lugar.' }
]

const plans = [
  {
    name: 'Starter',
    tagline: 'Ideal para emprendedores y negocios pequeños',
    price: 'RD$1,490',
    note: 'Hasta 300 facturas/mes',
    featured: false,
    cta: 'Elegir Starter',
    features: ['1 usuario', 'Facturación electrónica básica', 'Catálogo de clientes', 'Productos/servicios', 'Soporte por correo']
  },
  {
    name: 'Business',
    tagline: 'Para empresas en crecimiento con mayor volumen',
    price: 'RD$3,990',
    note: 'Hasta 2,500 facturas/mes',
    featured: true,
    cta: 'Elegir Business',
    features: ['5 usuarios', 'Facturación electrónica avanzada', 'Roles y permisos básicos', 'Reportes operativos', 'Soporte prioritario']
  },
  {
    name: 'Enterprise',
    tagline: 'Para operaciones exigentes y personalización',
    price: 'Cotización',
    note: 'Volumen y alcance a medida',
    featured: false,
    cta: 'Solicitar propuesta',
    features: ['Usuarios según acuerdo', 'Integraciones personalizadas', 'Ambientes dedicados (opcional)', 'Acompañamiento', 'SLA / soporte especializado']
  }
]

const faqs = [
  { q: '¿Puedo comenzar con un plan y luego cambiar a otro?', a: 'Sí. Puedes iniciar con un plan básico y migrar a uno superior cuando crezca tu volumen o tus necesidades.' },
  { q: '¿El sistema funciona en computadoras y tablets?', a: 'Sí. La interfaz está diseñada para ser responsive y ofrecer una buena experiencia en escritorio y tablets.' },
  { q: '¿Se pueden gestionar varios usuarios?', a: 'Sí. Dependiendo del plan, puedes crear múltiples usuarios y gestionar accesos para tu equipo.' },
  { q: '¿El plan Enterprise se puede personalizar?', a: 'Sí. Está pensado para requerimientos especiales, integraciones y capacidades adaptadas a tu operación.' }
]
</script>

