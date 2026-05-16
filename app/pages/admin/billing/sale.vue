<template>
  <div class="invoice-page">
    <!-- Header -->
    <div class="page-header mb-4">
      <div>
        <div class="breadcrumb-line mb-2">
          <span>Facturación</span>
          <i class="bi bi-chevron-right"></i>
          <strong>Nueva factura</strong>
        </div>

        <h1 class="page-title">Nueva factura</h1>
        <p class="page-subtitle">
          Crea una factura electrónica de forma rápida y sencilla.
        </p>
      </div>

      <div class="header-actions">
        <button type="button" class="btn btn-light effi-btn" @click="cancelInvoice">
          Cancelar
        </button>

        <button type="button" class="btn btn-outline-primary effi-btn" @click="saveDraft">
          <i class="bi bi-save me-2"></i>
          Guardar borrador
        </button>

        <button type="button" class="btn btn-primary effi-btn-primary" @click="emitInvoice">
          <i class="bi bi-send me-2"></i>
          Emitir factura
        </button>
      </div>
    </div>

    <div class="row g-4">
      <!-- Main column -->
      <div class="col-xl-8">
        <!-- Datos generales -->
        <div class="effi-card mb-4">
          <div class="section-title">
            <span class="section-icon">
              <i class="bi bi-file-earmark-text"></i>
            </span>

            <div>
              <h2>Datos generales</h2>
              <p>Completa la información mínima necesaria para emitir la factura.</p>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">
                Cliente <span class="required">*</span>
              </label>

              <div class="input-icon left">
                <i class="bi bi-search"></i>
                <select
                  v-model="invoice.clientId"
                  class="form-select effi-input input-with-left-icon"
                >
                  <option value="">Buscar cliente...</option>
                  <option v-for="client in clients" :key="client.id" :value="client.id">
                    {{ client.name }} - RNC: {{ client.rnc }}
                  </option>
                </select>
              </div>

              <button type="button" class="link-action mt-2" @click="createClient">
                <i class="bi bi-plus-lg me-1"></i>
                Nuevo cliente
              </button>
            </div>

            <div class="col-md-3">
              <label class="form-label">
                Fecha de emisión <span class="required">*</span>
              </label>

              <div class="input-icon">
                <input
                  v-model="invoice.issueDate"
                  type="date"
                  class="form-control effi-input"
                />
                <i class="bi bi-calendar"></i>
              </div>
            </div>

            <div class="col-md-3">
              <label class="form-label">Vencimiento</label>

              <div class="input-icon">
                <input
                  v-model="invoice.dueDate"
                  type="date"
                  class="form-control effi-input"
                />
                <i class="bi bi-calendar"></i>
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label">
                Tipo de comprobante <span class="required">*</span>
              </label>

              <select v-model="invoice.documentType" class="form-select effi-input">
                <option value="Factura electrónica">Factura electrónica</option>
                <option value="Crédito fiscal">Crédito fiscal</option>
                <option value="Factura de consumo">Factura de consumo</option>
                <option value="Gubernamental">Gubernamental</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">
                Moneda <span class="required">*</span>
              </label>

              <select v-model="invoice.currency" class="form-select effi-input">
                <option value="DOP">DOP - Peso dominicano</option>
                <option value="USD">USD - Dólar estadounidense</option>
              </select>
            </div>
          </div>

          <div class="info-alert mt-3">
            <i class="bi bi-info-circle"></i>
            <span>NCF/e-CF se generará automáticamente al emitir la factura.</span>
          </div>
        </div>

        <!-- Productos o servicios -->
        <div class="effi-card mb-4">
          <div class="section-title">
            <span class="section-icon">
              <i class="bi bi-bag-check"></i>
            </span>

            <div>
              <h2>Productos o servicios</h2>
              <p>Agrega los conceptos que serán facturados al cliente.</p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table effi-table align-middle">
              <thead>
                <tr>
                  <th>Producto/Servicio</th>
                  <th class="text-center">Cantidad</th>
                  <th class="text-end">Precio unitario</th>
                  <th class="text-center">ITBIS</th>
                  <th class="text-end">Importe</th>
                  <th class="text-end">Acción</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="item in invoice.items" :key="item.id">
                  <td>
                    <input
                      v-model="item.description"
                      type="text"
                      class="form-control table-input product-input"
                      placeholder="Descripción del producto o servicio"
                    />
                  </td>

                  <td class="text-center">
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      class="form-control table-input quantity-input mx-auto"
                    />
                  </td>

                  <td class="text-end">
                    <input
                      v-model.number="item.unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      class="form-control table-input price-input ms-auto"
                    />
                  </td>

                  <td class="text-center">
                    <select v-model.number="item.taxRate" class="form-select table-input tax-input mx-auto">
                      <option :value="18">18%</option>
                      <option :value="0">0%</option>
                    </select>
                  </td>

                  <td class="text-end fw-semibold">
                    {{ formatCurrency(getLineSubtotal(item)) }}
                  </td>

                  <td class="text-end">
                    <button
                      type="button"
                      class="action-btn danger"
                      title="Eliminar"
                      :disabled="invoice.items.length === 1"
                      @click="removeItem(item.id)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <button type="button" class="add-line-button mt-3" @click="addItem">
            <i class="bi bi-plus-lg"></i>
            Agregar producto o servicio
          </button>
        </div>

        <!-- Opciones adicionales -->
        <div class="effi-card optional-card">
          <button type="button" class="optional-toggle" @click="showOptional = !showOptional">
            <span>
              <strong>Opciones adicionales</strong>
              <small>(opcionales)</small>
            </span>

            <i class="bi" :class="showOptional ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </button>

          <p class="optional-description">
            Descuento global, observaciones, referencia interna, orden de compra, términos y condiciones y más.
          </p>

          <div v-if="showOptional" class="optional-body mt-3">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Descuento global</label>
                <input
                  v-model.number="invoice.discount"
                  type="number"
                  min="0"
                  step="0.01"
                  class="form-control effi-input"
                  placeholder="0.00"
                />
              </div>

              <div class="col-md-4">
                <label class="form-label">Referencia interna</label>
                <input
                  v-model="invoice.internalReference"
                  type="text"
                  class="form-control effi-input"
                  placeholder="Ej. REF-001"
                />
              </div>

              <div class="col-md-4">
                <label class="form-label">Orden de compra</label>
                <input
                  v-model="invoice.purchaseOrder"
                  type="text"
                  class="form-control effi-input"
                  placeholder="Ej. OC-2024-001"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label">Sucursal / Caja</label>
                <input
                  v-model="invoice.branch"
                  type="text"
                  class="form-control effi-input"
                  placeholder="Ej. Principal / Caja 01"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label">Términos y condiciones</label>
                <input
                  v-model="invoice.terms"
                  type="text"
                  class="form-control effi-input"
                  placeholder="Ej. Pago a 15 días"
                />
              </div>

              <div class="col-12">
                <label class="form-label">Observaciones</label>
                <textarea
                  v-model="invoice.notes"
                  class="form-control effi-input"
                  rows="3"
                  placeholder="Observaciones visibles en la factura..."
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
              <span>Subtotal (sin ITBIS)</span>
              <strong>{{ formatCurrency(subtotal) }}</strong>
            </div>

            <div class="summary-row">
              <span>ITBIS</span>
              <strong>{{ formatCurrency(taxTotal) }}</strong>
            </div>

            <div class="summary-row">
              <span>Descuento global</span>
              <strong class="text-danger">- {{ formatCurrency(invoice.discount || 0) }}</strong>
            </div>

            <hr />

            <div class="summary-total">
              <span>Total a pagar</span>
              <strong>{{ formatCurrency(grandTotal) }}</strong>
            </div>
          </div>

          <!-- Método de pago -->
          <div class="effi-card mb-4">
            <div class="side-card-title">
              <span class="payment-icon">
                <i class="bi bi-credit-card"></i>
              </span>
              <h2>Método de pago</h2>
            </div>

            <select v-model="invoice.paymentMethod" class="form-select effi-input">
              <option value="Transferencia bancaria">Transferencia bancaria</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Crédito">Crédito</option>
            </select>

            <div class="helper-note mt-3">
              <i class="bi bi-info-circle"></i>
              <span>Podrás cambiar o registrar el pago después de emitir.</span>
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
                Factura electrónica
              </span>
            </div>

            <div class="helper-note">
              <i class="bi bi-info-circle"></i>
              <span>Esta factura está en borrador. Revisa la información y emítela cuando estés listo.</span>
            </div>
          </div>

          <!-- Validaciones -->
          <div class="effi-card">
            <div class="side-card-title">
              <span class="validation-icon">
                <i class="bi bi-list-check"></i>
              </span>
              <h2>Campos obligatorios mínimos</h2>
            </div>

            <ul class="validation-list">
              <li :class="{ checked: hasClient }">
                <i class="bi" :class="hasClient ? 'bi-check-lg' : 'bi-circle'"></i>
                Cliente
              </li>
              <li :class="{ checked: !!invoice.issueDate }">
                <i class="bi" :class="invoice.issueDate ? 'bi-check-lg' : 'bi-circle'"></i>
                Fecha de emisión
              </li>
              <li :class="{ checked: !!invoice.documentType }">
                <i class="bi" :class="invoice.documentType ? 'bi-check-lg' : 'bi-circle'"></i>
                Tipo de comprobante
              </li>
              <li :class="{ checked: hasValidItems }">
                <i class="bi" :class="hasValidItems ? 'bi-check-lg' : 'bi-circle'"></i>
                Al menos un producto o servicio
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Client {
  id: number
  name: string
  rnc: string
}

interface InvoiceItem {
  id: number
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

const showOptional = ref(false)

const clients = ref<Client[]>([
  {
    id: 1,
    name: 'Distribuidora del Norte SRL',
    rnc: '131203123',
  },
  {
    id: 2,
    name: 'Comercializadora Garza SRL',
    rnc: '130908071',
  },
  {
    id: 3,
    name: 'Tecnología Avanzada SRL',
    rnc: '130801012',
  },
])

const invoice = reactive({
  clientId: 1,
  issueDate: '2024-05-31',
  dueDate: '2024-06-15',
  documentType: 'Factura electrónica',
  currency: 'DOP',
  paymentMethod: 'Transferencia bancaria',
  discount: 0,
  internalReference: '',
  purchaseOrder: '',
  branch: '',
  terms: '',
  notes: '',
  items: [
    {
      id: 1,
      description: 'Consultoría en estrategia de negocio',
      quantity: 1,
      unitPrice: 20000,
      taxRate: 18,
    },
    {
      id: 2,
      description: 'Silla ergonómica premium',
      quantity: 1,
      unitPrice: 8500,
      taxRate: 18,
    },
    {
      id: 3,
      description: 'Servicio técnico de mantenimiento',
      quantity: 1,
      unitPrice: 3000,
      taxRate: 18,
    },
  ] as InvoiceItem[],
})

const hasClient = computed(() => !!invoice.clientId)

const hasValidItems = computed(() => {
  return invoice.items.some((item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0)
})

const subtotal = computed(() => {
  return invoice.items.reduce((total, item) => total + getLineSubtotal(item), 0)
})

const taxTotal = computed(() => {
  return invoice.items.reduce((total, item) => {
    const lineSubtotal = getLineSubtotal(item)
    return total + lineSubtotal * (item.taxRate / 100)
  }, 0)
})

const grandTotal = computed(() => {
  return Math.max(subtotal.value + taxTotal.value - (invoice.discount || 0), 0)
})

function getLineSubtotal(item: InvoiceItem) {
  return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)
}

function addItem() {
  const nextId = Math.max(...invoice.items.map((item) => item.id), 0) + 1

  invoice.items.push({
    id: nextId,
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 18,
  })
}

function removeItem(id: number) {
  if (invoice.items.length === 1) return

  const index = invoice.items.findIndex((item) => item.id === id)

  if (index !== -1) {
    invoice.items.splice(index, 1)
  }
}

function createClient() {
  console.log('Crear nuevo cliente')
}

function saveDraft() {
  console.log('Guardar borrador', invoice)
}

function emitInvoice() {
  console.log('Emitir factura', {
    invoice,
    subtotal: subtotal.value,
    taxTotal: taxTotal.value,
    grandTotal: grandTotal.value,
  })
}

function cancelInvoice() {
  navigateTo('/admin/billing')
}
</script>

<style scoped>
.invoice-page {
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
.payment-icon,
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

.payment-icon {
  color: #0d6efd;
  background: #eef5ff;
}

.state-icon {
  color: #16a34a;
  background: #eaf8ee;
}

.validation-icon {
  color: #0d6efd;
  background: #eef5ff;
}

.form-label {
  color: #344054;
  font-weight: 600;
  font-size: 0.84rem;
  margin-bottom: 0.45rem;
}

.required {
  color: #ef4444;
}

.effi-input {
  border: 1px solid #d9e1ec;
  border-radius: 10px;
  min-height: 44px;
  color: #101828;
  box-shadow: none;
}

.effi-input:focus,
.table-input:focus {
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
  z-index: 2;
}

.input-icon:not(.left) i {
  position: absolute;
  right: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #667085;
  pointer-events: none;
}

.input-with-left-icon {
  padding-left: 2.45rem;
}

.link-action {
  border: 0;
  background: transparent;
  padding: 0;
  color: #0d6efd;
  font-size: 0.84rem;
  font-weight: 600;
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

.table-input {
  border: 1px solid #d9e1ec;
  border-radius: 9px;
  min-height: 38px;
  box-shadow: none;
}

.product-input {
  min-width: 260px;
}

.quantity-input {
  width: 90px;
  text-align: center;
}

.price-input {
  width: 150px;
  text-align: right;
}

.tax-input {
  width: 90px;
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

.action-btn:hover:not(:disabled) {
  color: #dc2626;
  border-color: #fecaca;
  background: #fff5f5;
}

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.add-line-button {
  width: 100%;
  min-height: 48px;
  border: 1px dashed #b9d3ff;
  border-radius: 12px;
  background: #f8fbff;
  color: #0d6efd;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.add-line-button:hover {
  background: #eef5ff;
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

.helper-note {
  display: flex;
  gap: 0.55rem;
  color: #667085;
  font-size: 0.86rem;
  line-height: 1.4;
}

.helper-note i {
  color: #0d6efd;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.42rem 0.7rem;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1;
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

.validation-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.validation-list li {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #667085;
  margin-bottom: 0.75rem;
  font-size: 0.92rem;
}

.validation-list li:last-child {
  margin-bottom: 0;
}

.validation-list li.checked {
  color: #344054;
}

.validation-list li.checked i {
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
}

@media (max-width: 575.98px) {
  .invoice-page {
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

  .summary-total {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-total strong {
    font-size: 1.45rem;
  }
}
</style>