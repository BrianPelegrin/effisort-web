<script setup lang="ts">
import type { FiscalDocument } from '~/types/ecf'

interface DashboardOption {
  title: string
  description: string
  to: string
  icon: string
  tone: 'blue' | 'violet' | 'green' | 'orange' | 'rose'
  featured?: boolean
}

const auth = useAuthStore()
const { searchAllDocuments } = useFiscalDocumentsApi()

const loadingSales = ref(true)
const salesError = ref('')
const monthlySales = ref(0)
const monthlySalesCount = ref(0)
const today = new Date()

const monthLabel = new Intl.DateTimeFormat('es-DO', {
  month: 'long',
  year: 'numeric',
}).format(today)

const userName = computed(() => {
  const fullName = auth.user?.name || auth.user?.userName || ''
  const firstName = fullName.trim().split(/[\s@]/)[0]
  return firstName || 'bienvenido'
})

const companyName = computed(() => (
  auth.profile?.empresa.nombreComercial
  || auth.profile?.empresa.nombreRazonSocial
  || 'tu negocio'
))

const menuOptions: DashboardOption[] = [
  {
    title: 'Realizar una venta',
    description: 'Crea una factura nueva paso a paso.',
    to: '/admin/billing/sale',
    icon: 'bi bi-cart-check',
    tone: 'blue',
    featured: true,
  },
  {
    title: 'Ver facturas',
    description: 'Consulta tus ventas y documentos emitidos.',
    to: '/admin/billing',
    icon: 'bi bi-receipt',
    tone: 'violet',
  },
  {
    title: 'Clientes',
    description: 'Agrega, busca o actualiza tus clientes.',
    to: '/admin/clients',
    icon: 'bi bi-people',
    tone: 'green',
  },
  {
    title: 'Productos',
    description: 'Organiza tus productos y existencias.',
    to: '/admin/inventory',
    icon: 'bi bi-box-seam',
    tone: 'orange',
  },
  {
    title: 'Notas de crédito',
    description: 'Consulta las correcciones realizadas.',
    to: '/admin/billing/credit-notes',
    icon: 'bi bi-file-earmark-minus',
    tone: 'rose',
  },
]

onMounted(loadMonthlySales)

async function loadMonthlySales() {
  loadingSales.value = true
  salesError.value = ''

  try {
    const documents = await searchAllDocuments()
    const sales = documents.filter(isCurrentMonthSale)

    monthlySalesCount.value = sales.length
    monthlySales.value = sales.reduce((total, document) => total + Number(document.montoTotal || 0), 0)
  } catch (error) {
    monthlySales.value = 0
    monthlySalesCount.value = 0
    salesError.value = error instanceof Error
      ? error.message
      : 'No pudimos consultar las ventas en este momento.'
  } finally {
    loadingSales.value = false
  }
}

function isCurrentMonthSale(document: FiscalDocument) {
  if (document.activo === false || isRejected(document.estadoEncf) || isCreditNote(document.encfTipo)) {
    return false
  }

  const dateParts = getDateParts(document.fechaEmision || document.createdAt)
  if (!dateParts) return false

  return dateParts.year === today.getFullYear() && dateParts.month === today.getMonth() + 1
}

function isRejected(status: string | null) {
  const normalizedStatus = status?.toLocaleLowerCase('es') || ''
  return normalizedStatus.includes('rechazado') || normalizedStatus.includes('no aceptado')
}

function isCreditNote(documentType: string) {
  return documentType.replace(/^e/i, '') === '34'
}

function getDateParts(value: string | null) {
  if (!value) return null

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (isoDate) return { year: Number(isoDate[1]), month: Number(isoDate[2]) }

  const localDate = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(value)
  if (localDate) return { year: Number(localDate[3]), month: Number(localDate[2]) }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return null

  return { year: parsedDate.getFullYear(), month: parsedDate.getMonth() + 1 }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(value)
}
</script>

<template>
  <main class="simple-dashboard">
    <div class="dashboard-container">
      <header class="welcome-header">
        <div>
          <span class="eyebrow">Panel principal</span>
          <h1>Hola, {{ userName }}</h1>
          <p>Todo lo que necesitas para gestionar {{ companyName }}.</p>
        </div>

        <div class="current-month" aria-label="Período de ventas mostrado">
          <i class="bi bi-calendar3" aria-hidden="true" />
          <span>{{ monthLabel }}</span>
        </div>
      </header>

      <section class="sales-card" aria-labelledby="monthly-sales-title">
        <div class="sales-content">
          <span class="sales-icon" aria-hidden="true">
            <i class="bi bi-graph-up-arrow" />
          </span>

          <div class="sales-copy">
            <p id="monthly-sales-title">Ventas del mes</p>

            <div class="sales-value" aria-live="polite">
              <span v-if="loadingSales" class="loading-line" aria-label="Consultando ventas" />
              <strong v-else-if="!salesError">{{ formatCurrency(monthlySales) }}</strong>
              <strong v-else class="unavailable-value">No disponible</strong>
            </div>

            <span v-if="loadingSales" class="sales-helper">Estamos sumando tus ventas...</span>
            <span v-else-if="!salesError" class="sales-helper">
              {{ monthlySalesCount }} {{ monthlySalesCount === 1 ? 'venta registrada' : 'ventas registradas' }} en {{ monthLabel }}
            </span>
            <span v-else class="sales-helper">No pudimos actualizar este valor.</span>
          </div>
        </div>

        <div class="sales-actions">
          <button
            v-if="salesError"
            type="button"
            class="retry-button"
            :disabled="loadingSales"
            @click="loadMonthlySales"
          >
            <i class="bi bi-arrow-clockwise" aria-hidden="true" />
            Intentar de nuevo
          </button>

          <NuxtLink v-else to="/admin/billing" class="sales-link">
            Ver detalle
            <i class="bi bi-arrow-right" aria-hidden="true" />
          </NuxtLink>
        </div>
      </section>

      <section class="menu-section" aria-labelledby="menu-title">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Accesos rápidos</span>
            <h2 id="menu-title">¿Qué deseas hacer?</h2>
          </div>
          <p>Selecciona una opción para comenzar.</p>
        </div>

        <nav class="option-grid" aria-label="Opciones principales">
          <NuxtLink
            v-for="option in menuOptions"
            :key="option.to"
            :to="option.to"
            class="option-card"
            :class="[`option-${option.tone}`, { 'option-featured': option.featured }]"
          >
            <span class="option-icon" aria-hidden="true">
              <i :class="option.icon" />
            </span>

            <span class="option-copy">
              <span v-if="option.featured" class="recommended-label">Más utilizada</span>
              <strong>{{ option.title }}</strong>
              <small>{{ option.description }}</small>
            </span>

            <span class="option-arrow" aria-hidden="true">
              <i class="bi bi-arrow-right" />
            </span>
          </NuxtLink>
        </nav>
      </section>

      <aside class="help-note">
        <span class="help-icon" aria-hidden="true"><i class="bi bi-lightbulb" /></span>
        <div>
          <strong>¿No sabes por dónde empezar?</strong>
          <p>Usa <b>Realizar una venta</b> para crear una factura. El sistema te guiará paso a paso.</p>
        </div>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.simple-dashboard {
  min-height: calc(100vh - 70px);
  padding: 2rem;
  background:
    radial-gradient(circle at 95% 3%, rgba(53, 112, 255, 0.08), transparent 24rem),
    #f6f8fc;
  color: #172033;
}

.dashboard-container {
  width: min(100%, 1180px);
  margin: 0 auto;
}

.welcome-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.eyebrow {
  display: block;
  margin-bottom: 0.35rem;
  color: #65728b;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.welcome-header h1 {
  margin: 0 0 0.35rem;
  color: #172033;
  font-size: clamp(1.7rem, 3vw, 2.25rem);
  font-weight: 750;
  letter-spacing: -0.035em;
}

.welcome-header p,
.section-heading p {
  margin: 0;
  color: #65728b;
  font-size: 0.98rem;
}

.current-month {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.6rem;
  min-height: 44px;
  padding: 0.65rem 0.95rem;
  border: 1px solid #e0e6f0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  color: #42506a;
  font-size: 0.86rem;
  font-weight: 700;
  text-transform: capitalize;
}

.current-month i {
  color: #2864dc;
  font-size: 1rem;
}

.sales-card {
  position: relative;
  display: flex;
  min-height: 190px;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  overflow: hidden;
  margin-bottom: 2.25rem;
  padding: clamp(1.5rem, 4vw, 2.3rem);
  border-radius: 24px;
  background: linear-gradient(125deg, #182c56 0%, #1e4a9d 58%, #2864dc 100%);
  box-shadow: 0 18px 42px rgba(30, 74, 157, 0.2);
  color: #fff;
}

.sales-card::after {
  position: absolute;
  top: -75px;
  right: -45px;
  width: 255px;
  height: 255px;
  border: 48px solid rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  content: '';
}

.sales-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 1.3rem;
}

.sales-icon {
  display: grid;
  flex: 0 0 68px;
  width: 68px;
  height: 68px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 19px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 1.8rem;
}

.sales-copy p {
  margin: 0 0 0.25rem;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.sales-value {
  min-height: 52px;
}

.sales-value strong {
  display: block;
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 750;
  letter-spacing: -0.045em;
  line-height: 1.1;
}

.sales-value .unavailable-value {
  font-size: clamp(1.65rem, 4vw, 2.35rem);
}

.sales-helper {
  display: block;
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.82rem;
}

.loading-line {
  display: block;
  width: min(350px, 55vw);
  height: 42px;
  margin: 0.35rem 0;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.09));
  background-size: 200% 100%;
  animation: loading 1.3s ease-in-out infinite;
}

.sales-actions {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
}

.sales-link,
.retry-button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.7rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 750;
  text-decoration: none;
  transition: background 0.2s ease, transform 0.2s ease;
}

.retry-button {
  cursor: pointer;
}

.sales-link:hover,
.retry-button:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  transform: translateY(-2px);
}

.menu-section {
  margin-bottom: 1.5rem;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.15rem;
}

.section-heading h2 {
  margin: 0;
  color: #172033;
  font-size: 1.45rem;
  font-weight: 750;
  letter-spacing: -0.025em;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.option-card {
  --option-color: #2864dc;
  --option-soft: #eaf1ff;
  position: relative;
  display: flex;
  min-height: 150px;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  border: 1px solid #e1e7f0;
  border-radius: 18px;
  background: #fff;
  color: #172033;
  text-decoration: none;
  box-shadow: 0 5px 18px rgba(36, 52, 83, 0.045);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.option-card:hover {
  border-color: var(--option-color);
  color: #172033;
  box-shadow: 0 14px 28px rgba(36, 52, 83, 0.11);
  transform: translateY(-3px);
}

.option-card:focus-visible,
.sales-link:focus-visible,
.retry-button:focus-visible {
  outline: 3px solid rgba(61, 124, 255, 0.36);
  outline-offset: 3px;
}

.option-icon {
  display: grid;
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  place-items: center;
  border-radius: 15px;
  background: var(--option-soft);
  color: var(--option-color);
  font-size: 1.35rem;
}

.option-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding-top: 0.15rem;
}

.option-copy strong {
  margin-bottom: 0.4rem;
  font-size: 1rem;
  font-weight: 750;
}

.option-copy small {
  color: #69758c;
  font-size: 0.8rem;
  line-height: 1.5;
}

.recommended-label {
  margin: -0.1rem 0 0.35rem;
  color: var(--option-color);
  font-size: 0.66rem;
  font-weight: 850;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.option-arrow {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  color: var(--option-color);
  font-size: 0.9rem;
  transition: transform 0.2s ease;
}

.option-card:hover .option-arrow {
  transform: translateX(3px);
}

.option-featured {
  border-color: rgba(40, 100, 220, 0.28);
  background: linear-gradient(145deg, #fff, #f5f8ff);
}

.option-violet { --option-color: #7653d6; --option-soft: #f1edff; }
.option-green { --option-color: #17845b; --option-soft: #e7f7f0; }
.option-orange { --option-color: #c66a18; --option-soft: #fff1e3; }
.option-rose { --option-color: #c34666; --option-soft: #ffedf2; }

.help-note {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1rem 1.15rem;
  border: 1px solid #e4e8ef;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.68);
}

.help-icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 11px;
  background: #fff3ce;
  color: #9a6b00;
  font-size: 1.05rem;
}

.help-note strong {
  color: #344057;
  font-size: 0.86rem;
}

.help-note p {
  margin: 0.18rem 0 0;
  color: #707b8e;
  font-size: 0.78rem;
  line-height: 1.5;
}

@keyframes loading {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

@media (max-width: 991.98px) {
  .simple-dashboard {
    padding: 1.5rem;
  }

  .option-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767.98px) {
  .simple-dashboard {
    min-height: calc(100dvh - 70px);
    padding: 1.1rem;
  }

  .welcome-header,
  .sales-card,
  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .welcome-header {
    gap: 1rem;
  }

  .current-month {
    align-self: flex-start;
  }

  .sales-card {
    gap: 1.35rem;
    border-radius: 20px;
  }

  .sales-content {
    align-items: flex-start;
  }

  .sales-icon {
    flex-basis: 56px;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    font-size: 1.45rem;
  }

  .sales-actions,
  .sales-link,
  .retry-button {
    width: 100%;
  }

  .section-heading {
    gap: 0.3rem;
  }

  .section-heading p {
    font-size: 0.86rem;
  }

  .option-grid {
    grid-template-columns: 1fr;
  }

  .option-card {
    min-height: 132px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-line,
  .option-card,
  .option-arrow,
  .sales-link,
  .retry-button {
    animation: none;
    transition: none;
  }
}
</style>
