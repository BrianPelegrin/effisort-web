<template>
  <div class="credit-note-page">
    <!-- Header -->
    <div class="page-header mb-4">
      <div>
        <div class="breadcrumb-line mb-2">
          <span>Facturación</span>
          <i class="bi bi-chevron-right"></i>
          <span>Detalle de factura</span>
          <i class="bi bi-chevron-right"></i>
          <strong>Nueva nota de crédito</strong>
        </div>

        <h1 class="page-title">Nueva nota de crédito</h1>
        <p class="page-subtitle">
          Genera una nota de crédito a partir de una factura emitida.
        </p>
      </div>

      <div class="header-actions">
        <button type="button" class="btn btn-light effi-btn" @click="goBack">
          Cancelar
        </button>

        <button type="button" class="btn btn-outline-primary effi-btn" @click="saveDraft">
          <i class="bi bi-save me-2"></i>
          Guardar borrador
        </button>

        <button type="button" class="btn btn-primary effi-btn-primary" @click="emitCreditNote">
          <i class="bi bi-send me-2"></i>
          Emitir nota de crédito
        </button>
      </div>
    </div>

    <div class="row g-4">
      <!-- Main column -->
      <div class="col-xl-8">
        <!-- Factura afectada -->
        <div class="effi-card mb-4">
          <div class="section-title">
            <span class="section-icon">
              <i class="bi bi-file-earmark-text"></i>
            </span>

            <div>
              <h2>Factura afectada</h2>
              <p>Esta nota de crédito quedará vinculada a la factura original.</p>
            </div>
          </div>

          <div class="affected-invoice-grid">
            <div class="info-item">
              <span class="info-label">Factura original</span>
              <span class="info-value text-primary fw-semibold">
                {{ originalInvoice.number }}
              </span>
            </div>

            <div class="info-item">
              <span class="info-label">e-CF original</span>
              <span class="info-value">
                {{ originalInvoice.ncf }}
              </span>
            </div>

            <div class="info-item">
              <span class="info-label">Cliente</span>
              <span class="info-value">
                {{ originalInvoice.client.name }}
              </span>
            </div>

            <div class="info-item">
              <span class="info-label">Fecha de emisión</span>
              <span class="info-value">
                {{ originalInvoice.issueDate }}
              </span>
            </div>

            <div class="info-item">
              <span class="info-label">Total original</span>
              <span class="info-value">
                {{ formatCurrency(originalInvoice.total) }}
              </span>
            </div>

            <div class="info-item">
              <span class="info-label">Estado actual</span>
              <span class="status-badge status-issued">
                {{ originalInvoice.status }}
              </span>
            </div>
          </div>

          <div class="info-alert mt-3">
            <i class="bi bi-info-circle"></i>
            <span>La nota de crédito se emitirá vinculada a esta factura.</span>
          </div>
        </div>

        <!-- Datos generales -->
        <div class="effi-card mb-4">
          <div class="section-title">
            <span class="section-icon">
              <i class="bi bi-pencil-square"></i>
            </span>

            <div>
              <h2>Datos generales</h2>
              <p>Define el motivo y el alcance de la nota de crédito.</p>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">
                Motivo <span class="required">*</span>
              </label>

              <select v-model="form.reason" class="form-select effi-input">
                <option value="Devolución parcial">Devolución parcial</option>
                <option value="Devolución total">Devolución total</option>
                <option value="Descuento posterior">Descuento posterior</option>
                <option value="Corrección de precio">Corrección de precio</option>
                <option value="Corrección de cantidad">Corrección de cantidad</option>
                <option value="Anulación de factura">Anulación de factura</option>
                <option value="Otro motivo">Otro motivo</option>
              </select>
            </div>

            <div class="col-md-5">
              <label class="form-label">
                Tipo de nota <span class="required">*</span>
              </label>

              <div class="note-type-grid">
                <button
                  type="button"
                  class="note-type-card"
                  :class="{ active: form.type === 'Total' }"
                  @click="selectNoteType('Total')"
                >
                  <span class="radio-dot"></span>

                  <span>
                    <strong>Total</strong>
                    <small>Acredita el total de la factura</small>
                  </span>
                </button>

                <button
                  type="button"
                  class="note-type-card"
                  :class="{ active: form.type === 'Parcial' }"
                  @click="selectNoteType('Parcial')"
                >
                  <span class="radio-dot"></span>

                  <span>
                    <strong>Parcial</strong>
                    <small>Acredita una parte de la factura</small>
                  </span>
                </button>
              </div>
            </div>

            <div class="col-md-3">
              <label class="form-label">
                Fecha de emisión <span class="required">*</span>
              </label>

              <div class="input-icon">
                <input
                  v-model="form.issueDate"
                  type="text"
                  class="form-control effi-input"
                />
                <i class="bi bi-calendar"></i>
              </div>
            </div>

            <div class="col-12">
              <label class="form-label">Comentario o descripción breve</label>

              <textarea
                v-model="form.comment"
                class="form-control effi-input"
                rows="2"
                placeholder="Describe brevemente el motivo de la nota de crédito..."
              ></textarea>
            </div>
          </div>

          <div class="info-alert mt-3">
            <i class="bi bi-info-circle"></i>
            <span>
              El NCF/e-CF de la nota de crédito se generará automáticamente al emitir.
            </span>
          </div>
        </div>

        <!-- Detalle a acreditar -->
        <div class="effi-card mb-4">
          <div class="section-title">
            <span class="section-icon">
              <i class="bi bi-arrow-counterclockwise"></i>
            </span>

            <div>
              <h2>Detalle a acreditar</h2>
              <p>Selecciona las cantidades o montos que serán acreditados.</p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table effi-table align-middle">
              <thead>
                <tr>
                  <th>Producto/Servicio</th>
                  <th class="text-center">Cant. facturada</th>
                  <th class="text-center">Cant. a acreditar</th>
                  <th class="text-end">Precio unitario</th>
                  <th class="text-center">ITBIS</th>
                  <th class="text-end">Importe a acreditar</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="item in creditItems" :key="item.id">
                  <td>
                    <div class="product-name">{{ item.name }}</div>
                    <div class="product-helper">
                      Línea tomada de la factura original
                    </div>
                  </td>

                  <td class="text-center">
                    {{ item.invoicedQuantity.toFixed(2) }}
                  </td>

                  <td class="text-center">
                    <input
                      v-model.number="item.creditQuantity"
                      type="number"
                      min="0"
                      :max="item.invoicedQuantity"
                      step="0.01"
                      class="form-control quantity-input mx-auto"
                      @input="normalizeQuantity(item)"
                    />
                  </td>

                  <td class="text-end">
                    {{ formatCurrency(item.unitPrice) }}
                  </td>

                  <td class="text-center">
                    {{ item.taxRate }}%
                  </td>

                  <td class="text-end fw-semibold">
                    {{ formatCurrency(getLineSubtotal(item)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="info-alert mt-3">
            <i class="bi bi-info-circle"></i>
            <span>
              Solo puedes acreditar cantidades o montos de la factura original.
            </span>
          </div>
        </div>

        <!-- Opciones adicionales -->
        <div class="effi-card optional-card">
          <button
            type="button"
            class="optional-toggle"
            @click="showOptional = !showOptional"
          >
            <span>
              <strong>Opciones adicionales</strong>
              <small>(opcionales)</small>
            </span>

            <i
              class="bi"
              :class="showOptional ? 'bi-chevron-up' : 'bi-chevron-down'"
            ></i>
          </button>

          <p class="optional-description">
            Observaciones internas, referencia, documentos de soporte y más.
          </p>

          <div v-if="showOptional" class="optional-body mt-3">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Referencia interna</label>
                <input
                  v-model="form.internalReference"
                  type="text"
                  class="form-control effi-input"
                  placeholder="Ej. NC-INTERNA-001"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label">Documento de soporte</label>
                <input type="file" class="form-control effi-input" />
              </div>

              <div class="col-12">
                <label class="form-label">Observaciones internas</label>
                <textarea
                  v-model="form.internalNotes"
                  class="form-control effi-input"
                  rows="3"
                  placeholder="Notas internas no visibles para el cliente..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right column -->
      <div class="col-xl-4">
        <div class="sticky-summary">
          <!-- Resumen -->
          <div class="effi-card summary-card mb-4">
            <div class="side-card-title">
              <span class="summary-icon">
                <i class="bi bi-currency-dollar"></i>
              </span>
              <h2>Resumen</h2>
            </div>

            <div class="summary-row">
              <span>Subtotal acreditado</span>
              <strong>{{ formatCurrency(subtotalCredited) }}</strong>
            </div>

            <div class="summary-row">
              <span>ITBIS (18%)</span>
              <strong>{{ formatCurrency(taxCredited) }}</strong>
            </div>

            <div class="summary-row">
              <span>Ajustes</span>
              <strong>{{ formatCurrency(adjustments) }}</strong>
            </div>

            <hr />

            <div class="summary-total">
              <span>Total a acreditar</span>
              <strong>{{ formatCurrency(totalCredited) }}</strong>
            </div>
          </div>

          <!-- Estado -->
          <div class="effi-card mb-4">
            <div class="side-card-title">
              <span class="state-icon">
                <i class="bi bi-check-circle"></i>
              </span>
              <h2>Estado</h2>
            </div>

            <div class="d-flex flex-wrap gap-2 mb-3">
              <span class="status-badge status-draft">
                <i class="bi bi-circle-fill"></i>
                Borrador
              </span>

              <span class="status-badge status-purple">
                Nota de crédito electrónica
              </span>
            </div>

            <div class="info-alert">
              <i class="bi bi-info-circle"></i>
              <span>
                Esta nota de crédito está en borrador. Revísala y emítela cuando estés listo.
              </span>
            </div>
          </div>

          <!-- Validaciones -->
          <div class="effi-card">
            <div class="side-card-title">
              <span class="validation-icon">
                <i class="bi bi-list-check"></i>
              </span>
              <h2>Validaciones mínimas</h2>
            </div>

            <ul class="validation-list">
              <li>
                <i class="bi bi-check-lg"></i>
                Factura original seleccionada
              </li>
              <li>
                <i class="bi bi-check-lg"></i>
                Motivo definido
              </li>
              <li>
                <i class="bi bi-check-lg"></i>
                Tipo de nota seleccionado
              </li>
              <li>
                <i class="bi bi-check-lg"></i>
                Al menos una línea con monto a acreditar
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type CreditNoteType = 'Total' | 'Parcial'

interface InvoiceItem {
  id: number
  name: string
  invoicedQuantity: number
  creditQuantity: number
  unitPrice: number
  taxRate: number
}

const route = useRoute()

const showOptional = ref(false)

const originalInvoice = reactive({
  id: route.params.id,
  number: 'FAC-000128',
  ncf: 'E310000000001',
  issueDate: '30/05/2024',
  status: 'Emitida',
  total: 32450,
  client: {
    name: 'Comercializadora Garza S.R.L.',
    rnc: '130908071',
  },
})

const form = reactive({
  reason: 'Devolución parcial',
  type: 'Parcial' as CreditNoteType,
  issueDate: '01/06/2024',
  comment: 'Devolución parcial de productos y servicios.',
  internalReference: '',
  internalNotes: '',
})

const creditItems = reactive<InvoiceItem[]>([
  {
    id: 1,
    name: 'Consultoría en estrategia de negocio',
    invoicedQuantity: 1,
    creditQuantity: 1,
    unitPrice: 20000,
    taxRate: 18,
  },
  {
    id: 2,
    name: 'Silla ergonómica premium',
    invoicedQuantity: 1,
    creditQuantity: 1,
    unitPrice: 8500,
    taxRate: 18,
  },
  {
    id: 3,
    name: 'Servicio técnico de mantenimiento',
    invoicedQuantity: 1,
    creditQuantity: 0,
    unitPrice: 3000,
    taxRate: 18,
  },
])

const adjustments = ref(0)

const subtotalCredited = computed(() => {
  return creditItems.reduce((total, item) => total + getLineSubtotal(item), 0)
})

const taxCredited = computed(() => {
  return creditItems.reduce((total, item) => {
    const lineSubtotal = getLineSubtotal(item)
    return total + lineSubtotal * (item.taxRate / 100)
  }, 0)
})

const totalCredited = computed(() => {
  return subtotalCredited.value + taxCredited.value + adjustments.value
})

function getLineSubtotal(item: InvoiceItem) {
  return item.creditQuantity * item.unitPrice
}

function normalizeQuantity(item: InvoiceItem) {
  if (item.creditQuantity < 0) {
    item.creditQuantity = 0
  }

  if (item.creditQuantity > item.invoicedQuantity) {
    item.creditQuantity = item.invoicedQuantity
  }
}

function selectNoteType(type: CreditNoteType) {
  form.type = type

  if (type === 'Total') {
    creditItems.forEach((item) => {
      item.creditQuantity = item.invoicedQuantity
    })

    form.reason = 'Devolución total'
    form.comment = 'Acreditación total de la factura original.'
    return
  }

  form.reason = 'Devolución parcial'
  form.comment = 'Devolución parcial de productos y servicios.'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function goBack() {
  navigateTo(`/admin/billing/${route.params.id}`)
}

function saveDraft() {
  console.log('Guardando borrador de nota de crédito', {
    originalInvoice,
    form,
    creditItems,
    subtotalCredited: subtotalCredited.value,
    taxCredited: taxCredited.value,
    totalCredited: totalCredited.value,
  })
}

function emitCreditNote() {
  console.log('Emitiendo nota de crédito', {
    originalInvoice,
    form,
    creditItems,
    totalCredited: totalCredited.value,
  })
}
</script>

<style scoped>
.credit-note-page {
  padding: 1.5rem;
  background: #f5f7fb;
  min-height: 100vh;
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
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
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

.section-title,
.side-card-title {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.25rem;
}

.section-title h2,
.side-card-title h2 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  color: #101828;
}

.section-title p {
  color: #667085;
  font-size: 0.88rem;
  margin: 0.15rem 0 0;
}

.section-icon,
.summary-icon,
.state-icon,
.validation-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.section-icon {
  color: #0d6efd;
  background: #eef5ff;
}

.summary-icon {
  color: #6f42c1;
  background: #f2eafd;
}

.state-icon {
  color: #16a34a;
  background: #eaf8ee;
}

.validation-icon {
  color: #0d6efd;
  background: #eef5ff;
}

.affected-invoice-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.info-item {
  min-width: 0;
}

.info-label {
  display: block;
  color: #667085;
  font-size: 0.82rem;
  margin-bottom: 0.25rem;
}

.info-value {
  display: block;
  color: #101828;
  font-size: 0.95rem;
  font-weight: 500;
  word-break: break-word;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.42rem 0.7rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
}

.status-issued {
  color: #0d6efd;
  background: #e9f2ff;
}

.status-draft {
  color: #b45309;
  background: #fff3d6;
}

.status-draft i {
  font-size: 0.45rem;
}

.status-purple {
  color: #6941c6;
  background: #f0e9ff;
}

.info-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid #d8e7ff;
  border-radius: 10px;
  color: #0d6efd;
  background: #f3f8ff;
  font-size: 0.88rem;
  line-height: 1.4;
}

.info-alert i {
  margin-top: 0.1rem;
}

.required {
  color: #ef4444;
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

.effi-input:focus,
.quantity-input:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.16rem rgba(13, 110, 253, 0.08);
}

.input-icon {
  position: relative;
}

.input-icon i {
  position: absolute;
  right: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #667085;
  pointer-events: none;
}

.note-type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.note-type-card {
  min-height: 58px;
  border: 1px solid #d9e1ec;
  background: #fff;
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  text-align: left;
  transition: 0.2s ease;
}

.note-type-card:hover {
  border-color: #0d6efd;
}

.note-type-card.active {
  border-color: #0d6efd;
  background: #f3f8ff;
}

.note-type-card strong {
  display: block;
  color: #101828;
  font-size: 0.9rem;
}

.note-type-card small {
  display: block;
  color: #667085;
  font-size: 0.76rem;
}

.radio-dot {
  width: 17px;
  height: 17px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  flex: 0 0 17px;
  margin-top: 0.1rem;
}

.note-type-card.active .radio-dot {
  border: 5px solid #0d6efd;
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
  padding: 0.85rem;
  vertical-align: middle;
}

.effi-table tbody tr:last-child td {
  border-bottom: none;
}

.product-name {
  font-weight: 600;
  color: #101828;
}

.product-helper {
  color: #667085;
  font-size: 0.76rem;
  margin-top: 0.15rem;
}

.quantity-input {
  width: 90px;
  min-height: 38px;
  border: 1px solid #d9e1ec;
  border-radius: 9px;
  text-align: center;
  box-shadow: none;
}

.optional-card {
  padding: 0;
}

.optional-toggle {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 1.15rem 1.35rem 0.3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #101828;
}

.optional-toggle strong {
  font-size: 1rem;
}

.optional-toggle small {
  color: #667085;
  margin-left: 0.3rem;
}

.optional-description {
  color: #667085;
  font-size: 0.86rem;
  margin: 0;
  padding: 0 1.35rem 1.15rem;
}

.optional-body {
  border-top: 1px solid #edf0f5;
  padding: 1.25rem 1.35rem 1.35rem;
}

.sticky-summary {
  position: sticky;
  top: 1rem;
}

.summary-card hr {
  border-color: #e5eaf2;
  opacity: 1;
  margin: 1rem 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: #667085;
  font-size: 0.92rem;
  margin-bottom: 0.9rem;
}

.summary-row strong {
  color: #344054;
  font-weight: 700;
  white-space: nowrap;
}

.summary-total {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.summary-total span {
  color: #101828;
  font-weight: 700;
}

.summary-total strong {
  color: #0d6efd;
  font-size: 1.75rem;
  line-height: 1;
  white-space: nowrap;
}

.validation-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.validation-list li {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #344054;
  margin-bottom: 0.75rem;
  font-size: 0.92rem;
}

.validation-list li:last-child {
  margin-bottom: 0;
}

.validation-list i {
  color: #16a34a;
}

@media (max-width: 1199.98px) {
  .sticky-summary {
    position: static;
  }
}

@media (max-width: 991.98px) {
  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .affected-invoice-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 575.98px) {
  .credit-note-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.45rem;
  }

  .header-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .effi-btn,
  .effi-btn-primary {
    width: 100%;
  }

  .affected-invoice-grid {
    grid-template-columns: 1fr;
  }

  .note-type-grid {
    grid-template-columns: 1fr;
  }

  .summary-total {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-total strong {
    font-size: 1.45rem;
  }
}
</style>