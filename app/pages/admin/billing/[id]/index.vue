<template>
  <div class="invoice-detail-page">
    <div class="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
      <div>
        <h3 class="page-title mb-1">Detalle de factura</h3>
        <p class="page-subtitle mb-2">Consulta la informacion completa de la factura electronica emitida.</p>
        <nav aria-label="breadcrumb" class="print-hidden">
          <ol class="breadcrumb mb-0 small">
            <li class="breadcrumb-item">Facturacion</li>
            <li class="breadcrumb-item">Listado de facturas</li>
            <li class="breadcrumb-item active" aria-current="page">Detalle</li>
          </ol>
        </nav>
      </div>

      <div class="action-buttons print-hidden">
        <button type="button" class="btn btn-light border" @click="downloadPdf">
          <i class="bi bi-file-earmark-arrow-down me-2"></i>
          Descargar PDF
        </button>
        <button type="button" class="btn btn-light border" @click="sendEmail">
          <i class="bi bi-envelope me-2"></i>
          Enviar por correo
        </button>
        <button type="button" class="btn btn-primary" @click="goToCreditNote">
          <i class="bi bi-arrow-counterclockwise me-2"></i>
          Generar nota de credito
        </button>
        <button type="button" class="btn btn-primary" @click="printInvoice">
          <i class="bi bi-printer me-2"></i>
          Imprimir
        </button>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-xl-8">
        <section class="effi-card mb-4">
          <div class="d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-file-earmark-text text-primary"></i>
            <h5 class="mb-0 fw-bold">Informacion general</h5>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">No. Factura</div>
              <div class="info-value text-primary fw-semibold">{{ invoice.number }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Estado</div>
              <div class="info-value">
                <span class="badge status-badge">{{ invoice.status }}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Tipo de comprobante</div>
              <div class="info-value">{{ invoice.documentType }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">e-CF / NCF</div>
              <div class="info-value">{{ invoice.ncf }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Fecha de emision</div>
              <div class="info-value">{{ invoice.issueDate }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Vencimiento</div>
              <div class="info-value">{{ invoice.dueDate }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Moneda</div>
              <div class="info-value">{{ invoice.currency }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Metodo de pago</div>
              <div class="info-value">{{ invoice.paymentMethod }}</div>
            </div>
          </div>

          <div class="ncf-note mt-3 mb-0 d-flex align-items-center gap-2">
            <i class="bi bi-info-circle"></i>
            <span>NCF generado automaticamente por el sistema.</span>
          </div>
        </section>

        <section class="effi-card mb-4">
          <div class="d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-person text-primary"></i>
            <h5 class="mb-0 fw-bold">Cliente</h5>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Cliente</div>
              <div class="info-value">{{ invoice.client.name }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">RNC</div>
              <div class="info-value">{{ invoice.client.rnc }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Correo</div>
              <div class="info-value">{{ invoice.client.email }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Telefono</div>
              <div class="info-value">{{ invoice.client.phone }}</div>
            </div>
            <div class="info-item info-item-full">
              <div class="info-label">Direccion</div>
              <div class="info-value">{{ invoice.client.address }}</div>
            </div>
          </div>
        </section>

        <section class="effi-card mb-4">
          <div class="d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-cart3 text-primary"></i>
            <h5 class="mb-0 fw-bold">Productos o servicios</h5>
          </div>

          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Producto/Servicio</th>
                  <th class="text-end">Cantidad</th>
                  <th class="text-end">Precio unitario</th>
                  <th class="text-end">ITBIS</th>
                  <th class="text-end">Importe</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in invoice.items" :key="item.id">
                  <td>{{ item.description }}</td>
                  <td class="text-end">{{ item.quantity.toFixed(2) }}</td>
                  <td class="text-end">{{ formatCurrency(item.unitPrice) }}</td>
                  <td class="text-end">{{ item.taxRate }}%</td>
                  <td class="text-end fw-semibold">{{ formatCurrency(item.lineAmount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="effi-card">
          <div class="d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-journal-text text-primary"></i>
            <h5 class="mb-0 fw-bold">Observaciones</h5>
          </div>
          <p class="mb-0 text-secondary">{{ invoice.notes }}</p>
        </section>
      </div>

      <div class="col-xl-4">
        <section class="effi-card summary-card mb-3">
          <div class="d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-receipt text-primary"></i>
            <h5 class="mb-0 fw-bold">Resumen</h5>
          </div>

          <div class="summary-row">
            <span>Subtotal (sin ITBIS)</span>
            <span>{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="summary-row">
            <span>ITBIS (18%)</span>
            <span>{{ formatCurrency(taxTotal) }}</span>
          </div>
          <div class="summary-row">
            <span>Descuento global</span>
            <span class="text-danger">- {{ formatCurrency(discount) }}</span>
          </div>
          <div class="summary-row">
            <span>Total pagado</span>
            <span>{{ formatCurrency(paidAmount) }}</span>
          </div>
          <div class="summary-row">
            <span>Total pendiente</span>
            <span class="text-warning-emphasis fw-semibold">{{ formatCurrency(pendingAmount) }}</span>
          </div>

          <hr />

          <div class="d-flex justify-content-between align-items-end">
            <span class="fw-bold">Total de la factura</span>
            <span class="summary-total">{{ formatCurrency(grandTotal) }}</span>
          </div>
        </section>

        <section class="effi-card status-card mb-3">
          <div class="d-flex align-items-center gap-2 mb-3">
            <span class="section-icon icon-success-soft">
              <i class="bi bi-check-circle"></i>
            </span>
            <h5 class="mb-0 fw-bold">Estado</h5>
          </div>
          <div class="d-flex flex-wrap gap-2 mb-3">
            <span class="badge status-badge">{{ invoice.status }}</span>
            <span class="badge badge-soft">{{ invoice.documentType }}</span>
          </div>
          <p class="mb-0 text-secondary status-text">
            La factura fue emitida correctamente y esta pendiente de pago.
          </p>
        </section>

        <section class="effi-card timeline-card">
          <div class="d-flex align-items-center gap-2 mb-3">
            <span class="section-icon icon-primary-soft">
              <i class="bi bi-clock"></i>
            </span>
            <h5 class="mb-0 fw-bold">Eventos / historial</h5>
          </div>

          <div class="timeline">
            <div v-for="event in timeline" :key="event.dateTime" class="timeline-item">
              <span class="timeline-dot"></span>
              <div>
                <p class="mb-1 text-secondary small">{{ event.dateTime }}</p>
                <p class="mb-0 fw-semibold">{{ event.title }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'

const route = useRoute()

interface InvoiceItem {
  id: number
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  lineAmount: number
}

const invoice = reactive({
  id: String(route.params.id),
  number: 'FAC-000128',
  status: 'Emitida',
  documentType: 'Factura electronica',
  ncf: 'E310000000001',
  issueDate: '31/05/2024',
  dueDate: '15/06/2024',
  currency: 'DOP - Peso dominicano',
  paymentMethod: 'Transferencia bancaria',
  client: {
    name: 'Distribuidora del Norte SRL',
    rnc: '131203123',
    email: 'facturacion@distribuidoranorte.com',
    phone: '(809) 555-0182',
    address: 'Av. John F. Kennedy, Santo Domingo, Republica Dominicana'
  },
  items: [
    {
      id: 1,
      description: 'Consultoria en estrategia de negocio',
      quantity: 1,
      unitPrice: 20000,
      taxRate: 18,
      lineAmount: 20000
    },
    {
      id: 2,
      description: 'Silla ergonomica premium',
      quantity: 1,
      unitPrice: 8500,
      taxRate: 18,
      lineAmount: 8500
    },
    {
      id: 3,
      description: 'Servicio tecnico de mantenimiento',
      quantity: 1,
      unitPrice: 3000,
      taxRate: 18,
      lineAmount: 3000
    }
  ] as InvoiceItem[],
  notes: 'Factura correspondiente a servicios y productos entregados durante el cierre del mes de mayo.'
})

const timeline = [
  { dateTime: '31/05/2024 10:45 a. m.', title: 'Factura creada' },
  { dateTime: '31/05/2024 10:47 a. m.', title: 'Factura emitida' },
  { dateTime: '31/05/2024 10:48 a. m.', title: 'Correo enviado al cliente' }
]

const subtotal = computed(() => invoice.items.reduce((acc, item) => acc + item.lineAmount, 0))
const taxTotal = computed(() => invoice.items.reduce((acc, item) => acc + item.lineAmount * (item.taxRate / 100), 0))
const discount = computed(() => 0)
const paidAmount = computed(() => 0)
const grandTotal = computed(() => subtotal.value + taxTotal.value - discount.value)
const pendingAmount = computed(() => grandTotal.value - paidAmount.value)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2
  }).format(value || 0)

const printInvoice = () => {
  window.print()
}

const goToCreditNote = () => {
  navigateTo(`/admin/billing/${route.params.id}/credit-note`)
}

const downloadPdf = () => {
  console.log('Descargar PDF de factura', invoice.id)
}

const sendEmail = () => {
  console.log('Enviar factura por correo', invoice.id)
}
</script>

<style scoped>
.invoice-detail-page {
  background: #f5f7fb;
  padding-bottom: 1rem;
}

.page-header {
  padding-top: 0.35rem;
}

.page-title {
  color: #111827;
  font-weight: 700;
}

.page-subtitle {
  color: #667085;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.action-buttons .btn {
  border-radius: 10px;
}

.effi-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: none;
  padding: 1.2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem 1.2rem;
}

.info-item {
  border-bottom: 1px solid #f1f4f9;
  padding-bottom: 0.45rem;
}

.info-item-full {
  grid-column: 1 / -1;
}

.info-label {
  color: #667085;
  font-size: 0.86rem;
  margin-bottom: 0.2rem;
}

.info-value {
  color: #111827;
  font-weight: 500;
}

.status-badge {
  background: rgba(13, 110, 253, 0.14);
  color: #0d6efd;
  border-radius: 999px;
  padding: 0.38rem 0.7rem;
  font-weight: 600;
}

.badge-soft {
  background: rgba(108, 117, 125, 0.15);
  color: #495057;
  border-radius: 999px;
  padding: 0.38rem 0.7rem;
  font-weight: 600;
}

.section-icon {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.icon-success-soft {
  color: #198754;
  background: rgba(25, 135, 84, 0.14);
}

.icon-primary-soft {
  color: #0d6efd;
  background: rgba(13, 110, 253, 0.14);
}

.status-card .badge {
  font-size: 0.85rem;
}

.status-text {
  line-height: 1.45;
}

.summary-card .summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.62rem;
  color: #344054;
}

.summary-total {
  color: #0d6efd;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.timeline {
  position: relative;
  padding-left: 0.2rem;
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 0.7rem;
  padding-bottom: 0.95rem;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 0.32rem;
  top: 0.78rem;
  bottom: -0.1rem;
  width: 1.5px;
  background: #d7e0ef;
}

.timeline-dot {
  width: 0.68rem;
  height: 0.68rem;
  border-radius: 50%;
  background: #0d6efd;
  margin-top: 0.34rem;
  flex-shrink: 0;
}

.table th {
  color: #667085;
  font-size: 0.86rem;
  font-weight: 600;
  border-bottom-width: 1px;
}

.table td {
  color: #1f2937;
}

.ncf-note {
  border: 1px solid #cfe0ff;
  background: #f5f9ff;
  color: #35538a;
  border-radius: 10px;
  padding: 0.62rem 0.8rem;
  font-size: 0.94rem;
}

@media (max-width: 991.98px) {
  .action-buttons {
    width: 100%;
  }

  .action-buttons .btn {
    flex: 1 1 calc(50% - 0.5rem);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .summary-total {
    font-size: 1.7rem;
  }
}

@media print {
  .print-hidden,
  .sidebar,
  .main-header,
  .topbar {
    display: none !important;
  }

  .invoice-detail-page {
    background: #fff !important;
  }

  .effi-card {
    box-shadow: none !important;
    border-color: #e5e7eb !important;
  }
}
</style>

