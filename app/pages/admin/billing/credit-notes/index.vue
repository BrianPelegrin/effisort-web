<template>
  <div class="credit-notes-page">
    <!-- Header -->
    <div class="page-header mb-4">
      <div>
        <div class="breadcrumb-line mb-2">
          <span>Facturación</span>
          <i class="bi bi-chevron-right"></i>
          <strong>Notas de crédito</strong>
        </div>

        <h1 class="page-title">Notas de crédito</h1>
        <p class="page-subtitle">
          Consulta y da seguimiento a las notas de crédito emitidas sobre tus facturas.
        </p>
      </div>

      <div class="header-actions">
        <button type="button" class="btn btn-outline-primary effi-btn" @click="exportCreditNotes">
          <i class="bi bi-download me-2"></i>
          Exportar
        </button>

        <button type="button" class="btn btn-primary effi-btn-primary" @click="goToBilling">
          <i class="bi bi-receipt me-2"></i>
          Ver facturas
        </button>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="row g-3 mb-4">
      <div class="col-xl-3 col-md-6">
        <div class="effi-card metric-card">
          <div class="metric-icon metric-blue">
            <i class="bi bi-file-earmark-minus"></i>
          </div>

          <div>
            <span class="metric-label">Notas emitidas</span>
            <strong class="metric-value">42</strong>
            <small class="metric-helper text-success">
              <i class="bi bi-arrow-up-short"></i>
              12% vs. mes anterior
            </small>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="effi-card metric-card">
          <div class="metric-icon metric-warning">
            <i class="bi bi-clock-history"></i>
          </div>

          <div>
            <span class="metric-label">En borrador</span>
            <strong class="metric-value">6</strong>
            <small class="metric-helper text-warning">
              Pendientes de revisión
            </small>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="effi-card metric-card">
          <div class="metric-icon metric-success">
            <i class="bi bi-check-circle"></i>
          </div>

          <div>
            <span class="metric-label">Aceptadas</span>
            <strong class="metric-value">34</strong>
            <small class="metric-helper text-success">
              Procesadas correctamente
            </small>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="effi-card metric-card">
          <div class="metric-icon metric-purple">
            <i class="bi bi-currency-dollar"></i>
          </div>

          <div>
            <span class="metric-label">Monto acreditado</span>
            <strong class="metric-value">{{ formatCurrency(creditedMonthAmount) }}</strong>
            <small class="metric-helper text-muted">
              Total del mes actual
            </small>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="effi-card filters-card mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-xl-4 col-lg-6">
          <label class="form-label">Buscar</label>
          <div class="input-icon left">
            <i class="bi bi-search"></i>
            <input
              v-model="filters.search"
              type="text"
              class="form-control effi-input input-with-left-icon"
              placeholder="Buscar por nota, factura, cliente o RNC..."
            />
          </div>
        </div>

        <div class="col-xl-2 col-lg-3 col-md-6">
          <label class="form-label">Estado</label>
          <select v-model="filters.status" class="form-select effi-input">
            <option value="">Todos</option>
            <option value="Borrador">Borrador</option>
            <option value="Emitida">Emitida</option>
            <option value="Aceptada DGII">Aceptada DGII</option>
            <option value="Rechazada DGII">Rechazada DGII</option>
            <option value="Anulada">Anulada</option>
          </select>
        </div>

        <div class="col-xl-2 col-lg-3 col-md-6">
          <label class="form-label">Tipo</label>
          <select v-model="filters.type" class="form-select effi-input">
            <option value="">Todos</option>
            <option value="Total">Total</option>
            <option value="Parcial">Parcial</option>
          </select>
        </div>

        <div class="col-xl-2 col-lg-6 col-md-6">
          <label class="form-label">Fecha desde</label>
          <input v-model="filters.fromDate" type="date" class="form-control effi-input" />
        </div>

        <div class="col-xl-2 col-lg-6 col-md-6">
          <label class="form-label">Fecha hasta</label>
          <input v-model="filters.toDate" type="date" class="form-control effi-input" />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="effi-card">
      <div class="table-header mb-3">
        <div>
          <h2>Listado de notas de crédito</h2>
          <p>
            Mostrando {{ filteredCreditNotes.length }} de {{ creditNotes.length }} notas registradas.
          </p>
        </div>

        <button type="button" class="btn btn-light effi-btn" @click="clearFilters">
          <i class="bi bi-x-circle me-2"></i>
          Limpiar filtros
        </button>
      </div>

      <div class="table-responsive">
        <table class="table effi-table align-middle">
          <thead>
            <tr>
              <th>No. Nota</th>
              <th>Factura afectada</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Motivo</th>
              <th class="text-end">Total acreditado</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="note in filteredCreditNotes" :key="note.id">
              <td>
                <button type="button" class="link-button" @click="goToCreditNoteDetail(note)">
                  {{ note.number }}
                </button>

                <div class="text-helper">
                  {{ note.ecf }}
                </div>
              </td>

              <td>
                <button type="button" class="link-button" @click="goToInvoiceDetail(note.invoiceId)">
                  {{ note.invoiceNumber }}
                </button>

                <div class="text-helper">
                  {{ note.invoiceEcf }}
                </div>
              </td>

              <td>
                <div class="client-name">{{ note.client.name }}</div>
                <div class="text-helper">RNC: {{ note.client.rnc }}</div>
              </td>

              <td>
                <div class="date-value">{{ note.issueDate }}</div>
                <div class="text-helper">{{ note.time }}</div>
              </td>

              <td>
                <span class="reason-badge" :class="getTypeClass(note.type)">
                  {{ note.type }}
                </span>

                <div class="text-helper mt-1">
                  {{ note.reason }}
                </div>
              </td>

              <td class="text-end fw-semibold">
                {{ formatCurrency(note.total) }}
              </td>

              <td>
                <span class="status-badge" :class="getStatusClass(note.status)">
                  <i v-if="note.status === 'Borrador'" class="bi bi-circle-fill"></i>
                  {{ note.status }}
                </span>
              </td>

              <td class="text-end">
                <div class="action-buttons">
                  <button
                    type="button"
                    class="action-btn"
                    title="Ver detalle"
                    @click="goToCreditNoteDetail(note)"
                  >
                    <i class="bi bi-eye"></i>
                  </button>

                  <button type="button" class="action-btn" title="Descargar PDF" @click="downloadPdf(note)">
                    <i class="bi bi-file-earmark-pdf"></i>
                  </button>

                  <button type="button" class="action-btn" title="Imprimir" @click="printCreditNote(note)">
                    <i class="bi bi-printer"></i>
                  </button>

                  <div class="dropdown d-inline-block">
                    <button
                      type="button"
                      class="action-btn"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      title="Más opciones"
                    >
                      <i class="bi bi-three-dots-vertical"></i>
                    </button>

                    <ul class="dropdown-menu dropdown-menu-end">
                      <li>
                        <button class="dropdown-item" type="button" @click="goToInvoiceDetail(note.invoiceId)">
                          <i class="bi bi-receipt me-2"></i>
                          Ver factura afectada
                        </button>
                      </li>

                      <li>
                        <button class="dropdown-item" type="button" @click="sendEmail(note)">
                          <i class="bi bi-envelope me-2"></i>
                          Enviar por correo
                        </button>
                      </li>

                      <li>
                        <button class="dropdown-item" type="button" @click="duplicateNote(note)">
                          <i class="bi bi-copy me-2"></i>
                          Duplicar como borrador
                        </button>
                      </li>

                      <li><hr class="dropdown-divider" /></li>

                      <li>
                        <button
                          class="dropdown-item text-danger"
                          type="button"
                          :disabled="note.status === 'Anulada'"
                          @click="voidCreditNote(note)"
                        >
                          <i class="bi bi-x-octagon me-2"></i>
                          Anular nota
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </td>
            </tr>

            <tr v-if="filteredCreditNotes.length === 0">
              <td colspan="8">
                <div class="empty-state">
                  <div class="empty-icon">
                    <i class="bi bi-file-earmark-minus"></i>
                  </div>

                  <h3>No se encontraron notas de crédito</h3>
                  <p>Prueba cambiando los filtros o revisando el rango de fechas seleccionado.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer / pagination visual -->
      <div class="table-footer">
        <span>
          Mostrando 1 a {{ filteredCreditNotes.length }} de {{ creditNotes.length }} registros
        </span>

        <div class="pagination-lite">
          <button type="button" class="page-btn" disabled>
            <i class="bi bi-chevron-left"></i>
          </button>

          <button type="button" class="page-btn active">1</button>
          <button type="button" class="page-btn">2</button>
          <button type="button" class="page-btn">3</button>

          <button type="button" class="page-btn">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CreditNoteClient {
  name: string
  rnc: string
}

type CreditNoteStatus = 'Borrador' | 'Emitida' | 'Aceptada DGII' | 'Rechazada DGII' | 'Anulada'
type CreditNoteType = 'Total' | 'Parcial'

interface CreditNote {
  id: number
  number: string
  ecf: string
  invoiceId: number
  invoiceNumber: string
  invoiceEcf: string
  client: CreditNoteClient
  issueDate: string
  dateValue: string
  time: string
  reason: string
  type: CreditNoteType
  total: number
  status: CreditNoteStatus
}

const filters = reactive({
  search: '',
  status: '',
  type: '',
  fromDate: '',
  toDate: '',
})

const creditNotes = ref<CreditNote[]>([
  {
    id: 1,
    number: 'NC-000042',
    ecf: 'E340000000042',
    invoiceId: 128,
    invoiceNumber: 'FAC-000128',
    invoiceEcf: 'E310000000001',
    client: {
      name: 'Distribuidora del Norte SRL',
      rnc: '131203123',
    },
    issueDate: '03/06/2024',
    dateValue: '2024-06-03',
    time: '10:35 a. m.',
    reason: 'Devolución parcial',
    type: 'Parcial',
    total: 33630,
    status: 'Aceptada DGII',
  },
  {
    id: 2,
    number: 'NC-000041',
    ecf: 'E340000000041',
    invoiceId: 127,
    invoiceNumber: 'FAC-000127',
    invoiceEcf: 'E310000000002',
    client: {
      name: 'Comercializadora Garza SRL',
      rnc: '130908071',
    },
    issueDate: '02/06/2024',
    dateValue: '2024-06-02',
    time: '04:18 p. m.',
    reason: 'Corrección de precio',
    type: 'Parcial',
    total: 5850,
    status: 'Emitida',
  },
  {
    id: 3,
    number: 'NC-000040',
    ecf: 'E340000000040',
    invoiceId: 126,
    invoiceNumber: 'FAC-000126',
    invoiceEcf: 'E310000000003',
    client: {
      name: 'Servicios Integrales MX SRL',
      rnc: '131102035',
    },
    issueDate: '01/06/2024',
    dateValue: '2024-06-01',
    time: '09:20 a. m.',
    reason: 'Anulación de factura',
    type: 'Total',
    total: 38232,
    status: 'Aceptada DGII',
  },
  {
    id: 4,
    number: 'NC-000039',
    ecf: 'E340000000039',
    invoiceId: 125,
    invoiceNumber: 'FAC-000125',
    invoiceEcf: 'E310000000004',
    client: {
      name: 'Constructora Horizonte SRL',
      rnc: '130614922',
    },
    issueDate: '31/05/2024',
    dateValue: '2024-05-31',
    time: '11:05 a. m.',
    reason: 'Descuento posterior',
    type: 'Parcial',
    total: 4720,
    status: 'Borrador',
  },
  {
    id: 5,
    number: 'NC-000038',
    ecf: 'E340000000038',
    invoiceId: 124,
    invoiceNumber: 'FAC-000124',
    invoiceEcf: 'E310000000005',
    client: {
      name: 'Importaciones del Caribe SRL',
      rnc: '130709152',
    },
    issueDate: '30/05/2024',
    dateValue: '2024-05-30',
    time: '02:42 p. m.',
    reason: 'Corrección de cantidad',
    type: 'Parcial',
    total: 14514,
    status: 'Rechazada DGII',
  },
  {
    id: 6,
    number: 'NC-000037',
    ecf: 'E340000000037',
    invoiceId: 123,
    invoiceNumber: 'FAC-000123',
    invoiceEcf: 'E310000000006',
    client: {
      name: 'Tecnología Avanzada SRL',
      rnc: '130801012',
    },
    issueDate: '29/05/2024',
    dateValue: '2024-05-29',
    time: '08:50 a. m.',
    reason: 'Devolución total',
    type: 'Total',
    total: 54162.59,
    status: 'Anulada',
  },
  {
    id: 7,
    number: 'NC-000036',
    ecf: 'E340000000036',
    invoiceId: 122,
    invoiceNumber: 'FAC-000122',
    invoiceEcf: 'E310000000007',
    client: {
      name: 'Soluciones Empresariales SRL',
      rnc: '131605097',
    },
    issueDate: '28/05/2024',
    dateValue: '2024-05-28',
    time: '03:15 p. m.',
    reason: 'Devolución parcial',
    type: 'Parcial',
    total: 8555,
    status: 'Aceptada DGII',
  },
])

const creditedMonthAmount = computed(() => {
  return creditNotes.value
    .filter((note) => note.status !== 'Anulada')
    .reduce((total, note) => total + note.total, 0)
})

const filteredCreditNotes = computed(() => {
  const search = filters.search.trim().toLowerCase()

  return creditNotes.value.filter((note) => {
    const matchesSearch =
      !search ||
      note.number.toLowerCase().includes(search) ||
      note.ecf.toLowerCase().includes(search) ||
      note.invoiceNumber.toLowerCase().includes(search) ||
      note.invoiceEcf.toLowerCase().includes(search) ||
      note.client.name.toLowerCase().includes(search) ||
      note.client.rnc.toLowerCase().includes(search)

    const matchesStatus = !filters.status || note.status === filters.status
    const matchesType = !filters.type || note.type === filters.type

    const matchesFromDate = !filters.fromDate || note.dateValue >= filters.fromDate
    const matchesToDate = !filters.toDate || note.dateValue <= filters.toDate

    return matchesSearch && matchesStatus && matchesType && matchesFromDate && matchesToDate
  })
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function getStatusClass(status: CreditNoteStatus) {
  const classes: Record<CreditNoteStatus, string> = {
    Borrador: 'status-draft',
    Emitida: 'status-issued',
    'Aceptada DGII': 'status-success',
    'Rechazada DGII': 'status-danger',
    Anulada: 'status-void',
  }

  return classes[status]
}

function getTypeClass(type: CreditNoteType) {
  return type === 'Total' ? 'reason-total' : 'reason-partial'
}

function clearFilters() {
  filters.search = ''
  filters.status = ''
  filters.type = ''
  filters.fromDate = ''
  filters.toDate = ''
}

function goToBilling() {
  navigateTo('/admin/billing')
}

function goToInvoiceDetail(invoiceId: number) {
  navigateTo(`/admin/billing/${invoiceId}`)
}

function goToCreditNoteDetail(note: CreditNote) {
  console.log('Ver detalle de nota de crédito', note)
}

function exportCreditNotes() {
  console.log('Exportando notas de crédito', filteredCreditNotes.value)
}

function downloadPdf(note: CreditNote) {
  console.log('Descargar PDF', note)
}

function printCreditNote(note: CreditNote) {
  console.log('Imprimir nota de crédito', note)
  window.print()
}

function sendEmail(note: CreditNote) {
  console.log('Enviar nota por correo', note)
}

function duplicateNote(note: CreditNote) {
  console.log('Duplicar nota de crédito como borrador', note)
}

function voidCreditNote(note: CreditNote) {
  console.log('Anular nota de crédito', note)
}
</script>

<style scoped>
.credit-notes-page {
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
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.metric-blue {
  color: #0d6efd;
  background: #eef5ff;
}

.metric-warning {
  color: #b45309;
  background: #fff3d6;
}

.metric-success {
  color: #16a34a;
  background: #eaf8ee;
}

.metric-purple {
  color: #6941c6;
  background: #f0e9ff;
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

.form-label {
  color: #344054;
  font-weight: 600;
  font-size: 0.84rem;
  margin-bottom: 0.45rem;
}

.effi-input {
  border: 1px solid #d9e1ec;
  border-radius: 10px;
  min-height: 44px;
  color: #101828;
  box-shadow: none;
}

.effi-input:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.16rem rgba(13, 110, 253, 0.08);
}

.input-icon {
  position: relative;
}

.input-icon.left i {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #667085;
  pointer-events: none;
}

.input-with-left-icon {
  padding-left: 2.45rem;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.table-header h2 {
  color: #101828;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.table-header p {
  color: #667085;
  font-size: 0.86rem;
  margin-bottom: 0;
}

.effi-table {
  margin-bottom: 0;
}

.effi-table thead th {
  background: #f8fafc;
  color: #667085;
  font-size: 0.78rem;
  font-weight: 700;
  border-bottom: 1px solid #e5eaf2;
  padding: 0.85rem;
  white-space: nowrap;
}

.effi-table tbody td {
  color: #101828;
  font-size: 0.88rem;
  border-bottom: 1px solid #edf0f5;
  padding: 0.9rem 0.85rem;
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

.text-helper {
  color: #667085;
  font-size: 0.76rem;
  margin-top: 0.15rem;
}

.client-name,
.date-value {
  color: #101828;
  font-weight: 600;
}

.status-badge,
.reason-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.42rem 0.7rem;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.status-badge i {
  font-size: 0.45rem;
}

.status-draft {
  color: #b45309;
  background: #fff3d6;
}

.status-issued {
  color: #0d6efd;
  background: #e9f2ff;
}

.status-success {
  color: #16a34a;
  background: #eaf8ee;
}

.status-danger {
  color: #dc2626;
  background: #fee2e2;
}

.status-void {
  color: #667085;
  background: #f2f4f7;
}

.reason-partial {
  color: #0d6efd;
  background: #eef5ff;
}

.reason-total {
  color: #6941c6;
  background: #f0e9ff;
}

.action-buttons {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.action-btn {
  width: 34px;
  height: 34px;
  border: 1px solid #d9e1ec;
  border-radius: 9px;
  background: #fff;
  color: #667085;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: 0.18s ease;
}

.action-btn:hover {
  color: #0d6efd;
  border-color: #b9d3ff;
  background: #f3f8ff;
}

.dropdown-menu {
  border: 1px solid #e5eaf2;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(16, 24, 40, 0.08);
  padding: 0.45rem;
}

.dropdown-item {
  border-radius: 8px;
  font-size: 0.88rem;
}

.empty-state {
  padding: 3rem 1rem;
  text-align: center;
}

.empty-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 1rem;
  border-radius: 16px;
  color: #0d6efd;
  background: #eef5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.empty-state h3 {
  font-size: 1rem;
  color: #101828;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.empty-state p {
  color: #667085;
  margin-bottom: 0;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #edf0f5;
  color: #667085;
  font-size: 0.84rem;
}

.pagination-lite {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.page-btn {
  min-width: 34px;
  height: 34px;
  border: 1px solid #d9e1ec;
  border-radius: 9px;
  background: #fff;
  color: #344054;
  font-weight: 600;
}

.page-btn.active {
  color: #fff;
  background: #0d6efd;
  border-color: #0d6efd;
}

.page-btn:disabled {
  color: #98a2b3;
  background: #f8fafc;
}

@media (max-width: 991.98px) {
  .page-header,
  .table-header,
  .table-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 575.98px) {
  .credit-notes-page {
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

  .metric-card {
    min-height: auto;
  }

  .pagination-lite {
    flex-wrap: wrap;
  }
}
</style>