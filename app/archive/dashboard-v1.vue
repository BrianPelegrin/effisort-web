<template>
  <div class="dashboard-page">
    <!-- Header -->
    <div class="page-header mb-4">
      <div>
        <div class="breadcrumb-line mb-2">
          <span>Inicio</span>
          <i class="bi bi-chevron-right"></i>
          <strong>Dashboard</strong>
        </div>

        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">
          Resumen general de tu operación y facturación electrónica.
        </p>
      </div>

      <div class="header-actions">
        <button type="button" class="btn btn-primary effi-btn-primary" @click="goToCreateInvoice">
          <i class="bi bi-plus-lg me-2"></i>
          Nueva factura
        </button>

        <button type="button" class="btn btn-outline-primary effi-btn" @click="goToInventory">
          <i class="bi bi-plus-lg me-2"></i>
          Agregar producto
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="row g-3 mb-4">
      <div class="col-xl-3 col-md-6">
        <div class="effi-card metric-card">
          <div class="metric-icon metric-blue">
            <i class="bi bi-currency-dollar"></i>
          </div>

          <div>
            <span class="metric-label">Ventas del mes</span>
            <strong class="metric-value">{{ formatCurrency(165230.5) }}</strong>
            <small class="metric-helper text-success">
              <i class="bi bi-arrow-up-short"></i>
              22% vs. mes anterior
            </small>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="effi-card metric-card">
          <div class="metric-icon metric-blue-soft">
            <i class="bi bi-receipt"></i>
          </div>

          <div>
            <span class="metric-label">Facturas emitidas</span>
            <strong class="metric-value">128</strong>
            <small class="metric-helper text-success">
              <i class="bi bi-arrow-up-short"></i>
              18% vs. mes anterior
            </small>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="effi-card metric-card">
          <div class="metric-icon metric-success">
            <i class="bi bi-wallet2"></i>
          </div>

          <div>
            <span class="metric-label">Cobros recibidos</span>
            <strong class="metric-value">{{ formatCurrency(156780.5) }}</strong>
            <small class="metric-helper text-success">
              <i class="bi bi-arrow-up-short"></i>
              21% vs. mes anterior
            </small>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="effi-card metric-card">
          <div class="metric-icon metric-warning">
            <i class="bi bi-exclamation-triangle"></i>
          </div>

          <div>
            <span class="metric-label">Productos con bajo stock</span>
            <strong class="metric-value">12</strong>
            <small class="metric-helper text-danger">
              <i class="bi bi-arrow-down-short"></i>
              2 vs. semana anterior
            </small>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="row g-4 mb-4">
      <div class="col-xl-8">
        <div class="effi-card chart-card">
          <div class="card-header-clean">
            <div>
              <h2>Facturación mensual</h2>
              <p>Comparativa de facturación acumulada durante el año.</p>
            </div>

            <select v-model="selectedYear" class="form-select effi-select">
              <option value="2024">Este año</option>
              <option value="2023">Año anterior</option>
            </select>
          </div>

          <div class="chart-container chart-container-large">
            <canvas ref="billingChartRef"></canvas>
          </div>
        </div>
      </div>

      <div class="col-xl-4">
        <div class="effi-card chart-card h-100">
          <div class="card-header-clean">
            <div>
              <h2>Estado de facturas</h2>
              <p>Distribución actual de las facturas del período.</p>
            </div>
          </div>

          <div class="invoice-status-wrap">
            <div class="chart-container chart-container-donut">
              <canvas ref="invoiceStatusChartRef"></canvas>
            </div>

            <div class="status-list">
              <div
                v-for="item in invoiceStatus"
                :key="item.label"
                class="status-list-item"
              >
                <span>
                  <i :class="item.dotClass"></i>
                  {{ item.label }}
                </span>

                <strong>{{ item.value }} ({{ item.percent }}%)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tables / Activity -->
    <div class="row g-4 mb-4">
      <div class="col-xl-5">
        <div class="effi-card h-100">
          <div class="card-header-clean">
            <div>
              <h2>Últimas facturas</h2>
              <p>Facturas recientes generadas en la plataforma.</p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table effi-table align-middle">
              <thead>
                <tr>
                  <th>No. Factura</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th class="text-end">Total</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="invoice in latestInvoices" :key="invoice.id">
                  <td>
                    <button type="button" class="link-button" @click="goToInvoiceDetail(invoice.id)">
                      {{ invoice.number }}
                    </button>
                  </td>

                  <td>
                    <div class="client-name">{{ invoice.client }}</div>
                  </td>

                  <td>{{ invoice.date }}</td>

                  <td class="text-end fw-semibold">
                    {{ formatCurrency(invoice.total) }}
                  </td>

                  <td>
                    <span class="status-badge" :class="getInvoiceStatusClass(invoice.status)">
                      {{ invoice.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <button type="button" class="section-link mt-3" @click="goToBilling">
            Ver todas las facturas
            <i class="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>

      <div class="col-xl-3">
        <div class="effi-card h-100">
          <div class="card-header-clean">
            <div>
              <h2>Productos con stock bajo</h2>
              <p>Productos que requieren atención.</p>
            </div>
          </div>

          <div class="stock-list">
            <div
              v-for="product in lowStockProducts"
              :key="product.id"
              class="stock-item"
            >
              <div class="stock-product">
                <span class="stock-icon">
                  <i class="bi bi-box-seam"></i>
                </span>

                <div>
                  <strong>{{ product.name }}</strong>
                  <small>Stock actual: {{ product.stock }}</small>
                </div>
              </div>

              <span
                class="stock-badge"
                :class="product.status === 'Crítico' ? 'stock-critical' : 'stock-low'"
              >
                {{ product.status }}
              </span>
            </div>
          </div>

          <button type="button" class="section-link mt-3" @click="goToInventory">
            Ver inventario completo
            <i class="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>

      <div class="col-xl-4">
        <div class="effi-card h-100">
          <div class="card-header-clean">
            <div>
              <h2>Actividad reciente</h2>
              <p>Últimos movimientos registrados.</p>
            </div>
          </div>

          <div class="activity-list">
            <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="activity-item"
            >
              <span class="activity-icon" :class="activity.iconClass">
                <i :class="activity.icon"></i>
              </span>

              <div class="activity-content">
                <strong>{{ activity.title }}</strong>
                <small>{{ activity.description }}</small>
              </div>

              <span class="activity-time">{{ activity.time }}</span>
            </div>
          </div>

          <button type="button" class="section-link mt-3">
            Ver toda la actividad
            <i class="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="effi-card quick-actions-card">
      <button
        v-for="action in quickActions"
        :key="action.label"
        type="button"
        class="quick-action"
        @click="action.handler"
      >
        <span :class="action.iconClass">
          <i :class="action.icon"></i>
        </span>

        {{ action.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
type InvoiceStatus = 'Emitida' | 'Pendiente' | 'Pagada' | 'Anulada'

interface DashboardInvoice {
  id: number
  number: string
  client: string
  date: string
  total: number
  status: InvoiceStatus
}

interface WindowWithChart extends Window {
  Chart?: any
}

useHead({
  script: [
    {
      src: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js',
      defer: true,
    },
  ],
})

const selectedYear = ref('2024')

const billingChartRef = ref<HTMLCanvasElement | null>(null)
const invoiceStatusChartRef = ref<HTMLCanvasElement | null>(null)

let billingChartInstance: any = null
let invoiceStatusChartInstance: any = null
let chartLoaderInterval: ReturnType<typeof setInterval> | null = null

const invoiceStatus = ref([
  {
    label: 'Emitidas',
    value: 60,
    percent: 46.9,
    dotClass: 'status-dot dot-blue',
  },
  {
    label: 'Pendientes',
    value: 24,
    percent: 18.8,
    dotClass: 'status-dot dot-orange',
  },
  {
    label: 'Pagadas',
    value: 36,
    percent: 28.1,
    dotClass: 'status-dot dot-green',
  },
  {
    label: 'Anuladas',
    value: 8,
    percent: 6.2,
    dotClass: 'status-dot dot-red',
  },
])

const latestInvoices = ref<DashboardInvoice[]>([
  {
    id: 128,
    number: 'FAC-000128',
    client: 'Distribuidora del Norte SRL',
    date: '31/05/2024',
    total: 18560,
    status: 'Emitida',
  },
  {
    id: 127,
    number: 'FAC-000127',
    client: 'Comercializadora Garza SRL',
    date: '30/05/2024',
    total: 9850,
    status: 'Pendiente',
  },
  {
    id: 126,
    number: 'FAC-000126',
    client: 'Servicios Integrales MX SRL',
    date: '29/05/2024',
    total: 32400,
    status: 'Pagada',
  },
  {
    id: 125,
    number: 'FAC-000125',
    client: 'Constructora Horizonte SRL',
    date: '28/05/2024',
    total: 25760,
    status: 'Pagada',
  },
  {
    id: 124,
    number: 'FAC-000124',
    client: 'Importaciones del Caribe SRL',
    date: '27/05/2024',
    total: 12300,
    status: 'Pendiente',
  },
])

const lowStockProducts = ref([
  {
    id: 1,
    name: 'Tornillo Hexagonal 1/2',
    stock: 5,
    status: 'Crítico',
  },
  {
    id: 2,
    name: 'Filtro de Aire FA-1020',
    stock: 7,
    status: 'Crítico',
  },
  {
    id: 3,
    name: 'Aceite Motor 5W-30',
    stock: 9,
    status: 'Bajo',
  },
  {
    id: 4,
    name: 'Bujía Iridium IX',
    stock: 12,
    status: 'Bajo',
  },
  {
    id: 5,
    name: 'Freno de Disco 320mm',
    stock: 15,
    status: 'Bajo',
  },
])

const recentActivity = ref([
  {
    id: 1,
    title: 'Factura FAC-000128 creada',
    description: 'Cliente: Distribuidora del Norte SRL',
    time: 'Hace 15 min',
    icon: 'bi bi-receipt',
    iconClass: 'activity-blue',
  },
  {
    id: 2,
    title: 'Nota de crédito NC-000045 emitida',
    description: 'Cliente: Comercializadora Garza SRL',
    time: 'Hace 1 h',
    icon: 'bi bi-file-earmark-minus',
    iconClass: 'activity-orange',
  },
  {
    id: 3,
    title: 'Producto Aceite Motor 5W-30 agregado',
    description: 'SKU: ACE-5W30-1L',
    time: 'Hace 2 h',
    icon: 'bi bi-box-seam',
    iconClass: 'activity-green',
  },
  {
    id: 4,
    title: 'Pago recibido por RD$ 18,560.00',
    description: 'Factura: FAC-000128',
    time: 'Hace 3 h',
    icon: 'bi bi-wallet2',
    iconClass: 'activity-green',
  },
])

const quickActions = [
  {
    label: 'Registrar cobro',
    icon: 'bi bi-credit-card',
    iconClass: 'quick-blue',
    handler: () => console.log('Registrar cobro'),
  },
  {
    label: 'Ver inventario',
    icon: 'bi bi-box-seam',
    iconClass: 'quick-blue',
    handler: () => goToInventory(),
  },
  {
    label: 'Crear cliente',
    icon: 'bi bi-person-plus',
    iconClass: 'quick-blue',
    handler: () => console.log('Crear cliente'),
  },
  {
    label: 'Nueva nota de crédito',
    icon: 'bi bi-file-earmark-minus',
    iconClass: 'quick-orange',
    handler: () => navigateTo('/admin/billing/credit-notes'),
  },
  {
    label: 'Cargar XML',
    icon: 'bi bi-filetype-xml',
    iconClass: 'quick-green',
    handler: () => console.log('Cargar XML'),
  },
  {
    label: 'Exportar reportes',
    icon: 'bi bi-file-earmark-bar-graph',
    iconClass: 'quick-purple',
    handler: () => console.log('Exportar reportes'),
  },
]

onMounted(() => {
  chartLoaderInterval = setInterval(() => {
    const currentWindow = window as WindowWithChart

    if (!currentWindow.Chart) return

    if (chartLoaderInterval) {
      clearInterval(chartLoaderInterval)
      chartLoaderInterval = null
    }

    renderBillingChart()
    renderInvoiceStatusChart()
  }, 100)
})

onBeforeUnmount(() => {
  if (chartLoaderInterval) {
    clearInterval(chartLoaderInterval)
  }

  billingChartInstance?.destroy()
  invoiceStatusChartInstance?.destroy()
})

watch(selectedYear, () => {
  renderBillingChart()
})

function renderBillingChart() {
  const currentWindow = window as WindowWithChart

  if (!billingChartRef.value || !currentWindow.Chart) return

  const ctx = billingChartRef.value.getContext('2d')

  if (!ctx) return

  billingChartInstance?.destroy()

  const billingData =
    selectedYear.value === '2024'
      ? [72000, 83000, 105000, 118000, 98000, 128000, 132000, 145000, 158000, 138000, 168000, 185000]
      : [60000, 74000, 88000, 92000, 85000, 102000, 115000, 121000, 130000, 118000, 142000, 154000]

  const targetData =
    selectedYear.value === '2024'
      ? [78000, 90000, 122000, 128000, 108000, 140000, 144000, 158000, 166000, 156000, 183000, 195000]
      : [65000, 79000, 96000, 100000, 94000, 111000, 124000, 132000, 140000, 128000, 151000, 165000]

  billingChartInstance = new currentWindow.Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      datasets: [
        {
          type: 'bar',
          label: 'Facturación',
          data: billingData,
          backgroundColor: '#0d6efd',
          borderRadius: 8,
          maxBarThickness: 34,
        },
        {
          type: 'line',
          label: 'Meta mensual',
          data: targetData,
          borderColor: '#0d6efd',
          backgroundColor: '#0d6efd',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 4,
          pointHoverRadius: 5,
          tension: 0.35,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 14,
            boxHeight: 8,
            color: '#667085',
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label(context: any) {
              const value = Number(context.raw || 0)

              return `${context.dataset.label}: ${formatCurrency(value)}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#667085',
          },
          border: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#edf0f5',
          },
          ticks: {
            color: '#667085',
            callback(value: number) {
              return `RD$ ${value / 1000}k`
            },
          },
          border: {
            display: false,
          },
        },
      },
    },
  })
}

function renderInvoiceStatusChart() {
  const currentWindow = window as WindowWithChart

  if (!invoiceStatusChartRef.value || !currentWindow.Chart) return

  const ctx = invoiceStatusChartRef.value.getContext('2d')

  if (!ctx) return

  invoiceStatusChartInstance?.destroy()

  invoiceStatusChartInstance = new currentWindow.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Emitidas', 'Pendientes', 'Pagadas', 'Anuladas'],
      datasets: [
        {
          data: [60, 24, 36, 8],
          backgroundColor: ['#0d6efd', '#f97316', '#22c55e', '#ef4444'],
          borderColor: '#ffffff',
          borderWidth: 4,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label(context: any) {
              const value = Number(context.raw || 0)
              const total = context.dataset.data.reduce((sum: number, current: number) => sum + current, 0)
              const percent = ((value / total) * 100).toFixed(1)

              return `${context.label}: ${value} (${percent}%)`
            },
          },
        },
      },
    },
  })
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function getInvoiceStatusClass(status: InvoiceStatus) {
  const classes: Record<InvoiceStatus, string> = {
    Emitida: 'status-issued',
    Pendiente: 'status-pending',
    Pagada: 'status-success',
    Anulada: 'status-void',
  }

  return classes[status]
}

function goToCreateInvoice() {
  navigateTo('/admin/billing/sale')
}

function goToBilling() {
  navigateTo('/admin/billing')
}

function goToInventory() {
  navigateTo('/admin/inventory')
}

function goToInvoiceDetail(id: number) {
  navigateTo(`/admin/billing/${id}`)
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding: 1.5rem;
  background: #f5f7fb;
  color: #111827;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
}

.breadcrumb-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #667085;
  font-size: 0.84rem;
}

.breadcrumb-line i {
  font-size: 0.72rem;
  color: #98a2b3;
}

.page-title {
  font-size: 1.8rem;
  line-height: 1.2;
  font-weight: 700;
  color: #101828;
  margin-bottom: 0.35rem;
}

.page-subtitle {
  color: #667085;
  margin-bottom: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.effi-btn,
.effi-btn-primary {
  min-height: 44px;
  border-radius: 10px;
  padding-inline: 1rem;
  font-weight: 600;
  box-shadow: none;
}

.effi-card {
  background: #fff;
  border: 1px solid #e5eaf2;
  border-radius: 16px;
  box-shadow: none;
  padding: 1.35rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 118px;
}

.metric-icon {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
}

.metric-blue,
.metric-blue-soft {
  color: #0d6efd;
  background: #eef5ff;
}

.metric-success {
  color: #16a34a;
  background: #eaf8ee;
}

.metric-warning {
  color: #f97316;
  background: #fff3e6;
}

.metric-label {
  display: block;
  color: #667085;
  font-size: 0.84rem;
  margin-bottom: 0.15rem;
}

.metric-value {
  display: block;
  color: #101828;
  font-size: 1.35rem;
  font-weight: 750;
  line-height: 1.2;
}

.metric-helper {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.78rem;
}

.card-header-clean {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.card-header-clean h2 {
  color: #101828;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.card-header-clean p {
  color: #667085;
  font-size: 0.86rem;
  margin-bottom: 0;
}

.effi-select {
  width: auto;
  min-width: 120px;
  border: 1px solid #d9e1ec;
  border-radius: 10px;
  min-height: 40px;
  box-shadow: none;
  font-size: 0.86rem;
}

.chart-card {
  min-height: 305px;
}

.chart-container {
  position: relative;
  width: 100%;
}

.chart-container-large {
  height: 260px;
}

.chart-container-donut {
  width: 190px;
  height: 190px;
  margin: 0 auto;
}

.invoice-status-wrap {
  display: grid;
  grid-template-columns: 210px 1fr;
  gap: 1.5rem;
  align-items: center;
}

.status-list {
  display: grid;
  gap: 0.85rem;
}

.status-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  color: #344054;
  font-size: 0.86rem;
}

.status-list-item span {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.status-list-item strong {
  font-weight: 700;
  white-space: nowrap;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}

.dot-blue {
  background: #0d6efd;
}

.dot-orange {
  background: #f97316;
}

.dot-green {
  background: #22c55e;
}

.dot-red {
  background: #ef4444;
}

.effi-table {
  margin-bottom: 0;
}

.effi-table thead th {
  background: #f8fafc;
  color: #667085;
  font-size: 0.76rem;
  font-weight: 700;
  border-bottom: 1px solid #e5eaf2;
  padding: 0.8rem;
  white-space: nowrap;
}

.effi-table tbody td {
  color: #101828;
  font-size: 0.82rem;
  border-bottom: 1px solid #edf0f5;
  padding: 0.82rem 0.8rem;
  vertical-align: middle;
}

.effi-table tbody tr:last-child td {
  border-bottom: none;
}

.link-button {
  border: 0;
  padding: 0;
  background: transparent;
  color: #0d6efd;
  font-weight: 700;
  text-align: left;
}

.link-button:hover {
  text-decoration: underline;
}

.client-name {
  max-width: 180px;
  color: #344054;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.38rem 0.65rem;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.status-issued {
  color: #0d6efd;
  background: #e9f2ff;
}

.status-pending {
  color: #b45309;
  background: #fff3d6;
}

.status-success {
  color: #16a34a;
  background: #eaf8ee;
}

.status-void {
  color: #667085;
  background: #f2f4f7;
}

.section-link {
  border: 0;
  background: transparent;
  color: #0d6efd;
  font-weight: 700;
  font-size: 0.86rem;
  padding: 0;
}

.stock-list,
.activity-list {
  display: grid;
  gap: 0.85rem;
}

.stock-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid #edf0f5;
}

.stock-item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.stock-product {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.stock-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  color: #667085;
  background: #f8fafc;
  border: 1px solid #edf0f5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.stock-product strong {
  display: block;
  color: #101828;
  font-size: 0.84rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-product small {
  display: block;
  color: #667085;
  font-size: 0.74rem;
}

.stock-badge {
  padding: 0.35rem 0.55rem;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.stock-critical {
  color: #dc2626;
  background: #fee2e2;
}

.stock-low {
  color: #b45309;
  background: #fff3d6;
}

.activity-item {
  display: grid;
  grid-template-columns: 38px 1fr auto;
  align-items: start;
  gap: 0.75rem;
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.activity-blue {
  color: #0d6efd;
  background: #eef5ff;
}

.activity-orange {
  color: #f97316;
  background: #fff3e6;
}

.activity-green {
  color: #16a34a;
  background: #eaf8ee;
}

.activity-content strong {
  display: block;
  color: #101828;
  font-size: 0.84rem;
}

.activity-content small {
  display: block;
  color: #667085;
  font-size: 0.76rem;
  margin-top: 0.15rem;
}

.activity-time {
  color: #667085;
  font-size: 0.74rem;
  white-space: nowrap;
}

.quick-actions-card {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.9rem;
}

.quick-action {
  min-height: 48px;
  border: 1px solid #d9e1ec;
  border-radius: 12px;
  background: #fff;
  color: #344054;
  font-weight: 700;
  font-size: 0.86rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  transition: 0.18s ease;
}

.quick-action:hover {
  color: #0d6efd;
  border-color: #b9d3ff;
  background: #f3f8ff;
}

.quick-action span {
  font-size: 1.05rem;
}

.quick-blue {
  color: #0d6efd;
}

.quick-orange {
  color: #f97316;
}

.quick-green {
  color: #16a34a;
}

.quick-purple {
  color: #6941c6;
}

@media (max-width: 1199.98px) {
  .invoice-status-wrap {
    grid-template-columns: 1fr;
  }

  .chart-container-donut {
    margin: 0 auto;
  }

  .quick-actions-card {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 991.98px) {
  .page-header,
  .card-header-clean {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 575.98px) {
  .dashboard-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.45rem;
  }

  .header-actions {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
  }

  .effi-btn,
  .effi-btn-primary {
    width: 100%;
  }

  .quick-actions-card {
    grid-template-columns: 1fr;
  }

  .chart-container-large {
    height: 230px;
  }

  .chart-container-donut {
    width: 170px;
    height: 170px;
  }
}
</style>