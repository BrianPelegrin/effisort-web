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
          <i class="bi bi-clipboard-check me-2"></i>
          Revisar factura
        </button>
      </div>
    </div>

    <div v-if="clientError" class="alert alert-danger d-flex align-items-center justify-content-between gap-3" role="alert">
      <span><i class="bi bi-exclamation-triangle me-2" />{{ clientError }}</span>
      <button type="button" class="btn btn-sm btn-outline-danger" @click="loadClients">Reintentar clientes</button>
    </div>
    <div v-if="articleError" class="alert alert-danger d-flex align-items-center justify-content-between gap-3" role="alert">
      <span><i class="bi bi-exclamation-triangle me-2" />{{ articleError }}</span>
      <button type="button" class="btn btn-sm btn-outline-danger" @click="loadArticles">Reintentar inventario</button>
    </div>
    <div v-if="catalogError" class="alert alert-danger d-flex align-items-center justify-content-between gap-3" role="alert">
      <span><i class="bi bi-exclamation-triangle me-2" />{{ catalogError }}</span>
      <button type="button" class="btn btn-sm btn-outline-danger" @click="loadBillingCatalogs">Reintentar catálogos</button>
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

              <button
                ref="clientSelectorButton"
                type="button"
                class="client-selector"
                :class="{ selected: selectedClient }"
                :disabled="loadingClients"
                aria-haspopup="dialog"
                :aria-expanded="showClientModal"
                @click="openClientModal"
              >
                <span class="client-selector-icon"><i class="bi" :class="selectedClient ? 'bi-person-check' : 'bi-search'" /></span>
                <span class="client-selector-content">
                  <strong>{{ selectedClient?.razonSocialComprador || (loadingClients ? 'Cargando clientes...' : 'Buscar y seleccionar cliente') }}</strong>
                  <small v-if="selectedClient">{{ clientIdentification(selectedClient) }}</small>
                  <small v-else>Consulta el listado de clientes activos</small>
                </span>
                <i class="bi bi-chevron-right client-selector-arrow" />
              </button>

              <button type="button" class="link-action mt-2" @click="createClient">
                <i class="bi bi-plus-lg me-1"></i>
                Nuevo cliente
              </button>
            </div>

            <div class="col-md-3">
              <label class="form-label">
                Fecha de emisión <span class="required">*</span>
              </label>

              <div>
                <input
                  v-model="invoice.issueDate"
                  type="date"
                  class="form-control effi-input"
                  @change="normalizeDates"
                />
              </div>
            </div>

            <div class="col-md-3">
              <label class="form-label">Vencimiento <span v-if="requiresDueDate" class="required">*</span></label>

              <div>
                <input
                  v-model="invoice.dueDate"
                  type="date"
                  :min="invoice.issueDate"
                  class="form-control effi-input"
                  @change="normalizeDates"
                />
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label">
                Tipo de comprobante <span class="required">*</span>
              </label>

              <select v-model="invoice.documentType" class="form-select effi-input" :disabled="loadingCatalogs">
                <option value="">Seleccione un tipo...</option>
                <option v-for="receiptType in receiptTypes" :key="receiptType.id" :value="String(receiptType.tipo)">
                  {{ receiptType.tipo }} - {{ receiptType.ecf }}
                </option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">
                Moneda <span class="required">*</span>
              </label>

              <select v-model="invoice.currency" class="form-select effi-input" :disabled="loadingCatalogs">
                <option value="">Seleccione una moneda...</option>
                <option v-for="currency in currencies" :key="currency.id" :value="currency.codigo">
                  {{ currency.codigo }} - {{ currency.descripcion }}
                </option>
              </select>
            </div>

            <div v-if="requiresExchangeRate" class="col-md-6">
              <label class="form-label">Tasa de cambio a DOP <span class="required">*</span></label>
              <input
                v-model.number="invoice.exchangeRate"
                type="number"
                min="0.0001"
                step="0.0001"
                class="form-control effi-input"
                placeholder="Ej. 60.2500"
                @change="normalizeExchangeRate"
              />
              <small class="field-helper">Cantidad de pesos dominicanos por cada {{ invoice.currency }}.</small>
            </div>
          </div>

          <div class="info-alert mt-3">
            <i class="bi bi-info-circle"></i>
            <span>Modo de preparación: por el momento esta factura no se enviará al backend ni generará un NCF/e-CF.</span>
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
                <tr v-if="!invoice.items.length">
                  <td colspan="6">
                    <div class="products-empty-state">
                      <i class="bi bi-bag-plus"></i>
                      <strong>No has agregado productos o servicios</strong>
                      <span>Utiliza el botón inferior para buscar en el inventario.</span>
                    </div>
                  </td>
                </tr>
                <tr v-for="item in invoice.items" :key="item.id">
                  <td>
                    <strong class="line-product-name">{{ item.description }}</strong>
                    <small class="line-product-code">{{ articleForItem(item)?.codigo || 'Sin código' }}</small>
                  </td>

                  <td class="text-center">
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      :min="quantityStep(item)"
                      :step="quantityStep(item)"
                      class="form-control table-input quantity-input mx-auto"
                      @change="normalizeQuantity(item)"
                    />
                    <small class="quantity-helper">{{ quantityStep(item) === 1 ? 'Unidades enteras' : 'Permite decimales' }}</small>
                  </td>

                  <td class="text-end">
                    <strong class="line-unit-price">{{ formatCurrency(item.unitPrice) }}</strong>
                  </td>

                  <td class="text-center">
                    <span class="tax-badge">{{ taxRateForItem(item) }}%</span>
                  </td>

                  <td class="text-end fw-semibold">
                    {{ formatCurrency(getLineSubtotal(item)) }}
                  </td>

                  <td class="text-end">
                    <button
                      type="button"
                      class="action-btn danger"
                      title="Eliminar"
                      @click="removeItem(item.id)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <button ref="productSelectorButton" type="button" class="add-line-button mt-3" :disabled="loadingArticles" aria-haspopup="dialog" :aria-expanded="showProductModal" @click="openProductModal">
            <i class="bi bi-plus-lg"></i>
            {{ loadingArticles ? 'Cargando productos...' : 'Agregar producto o servicio' }}
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
                  :max="grossTotal"
                  step="0.01"
                  class="form-control effi-input"
                  placeholder="0.00"
                  @change="normalizeDiscount"
                />
                <small class="field-helper">Máximo disponible: {{ formatCurrency(grossTotal) }}</small>
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

            <div v-if="requiresExchangeRate && hasValidExchangeRate" class="summary-exchange mt-3">
              <span>Equivalente en DOP</span>
              <strong>{{ formatDop(grandTotal * invoice.exchangeRate) }}</strong>
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

            <select v-model="invoice.paymentMethod" class="form-select effi-input" :disabled="loadingCatalogs">
              <option value="">Seleccione una forma...</option>
              <option v-for="paymentMethod in paymentMethods" :key="paymentMethod.id" :value="paymentMethod.codigo">
                {{ paymentMethod.codigo }} - {{ paymentMethod.descripcion }}
              </option>
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
                {{ selectedReceiptType?.ecf || 'Comprobante pendiente' }}
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
              <li :class="{ checked: hasValidDates }">
                <i class="bi" :class="hasValidDates ? 'bi-check-lg' : 'bi-circle'"></i>
                Fechas válidas
              </li>
              <li :class="{ checked: hasValidReceiptType }">
                <i class="bi" :class="hasValidReceiptType ? 'bi-check-lg' : 'bi-circle'"></i>
                Tipo de comprobante
              </li>
              <li :class="{ checked: hasValidCurrency }">
                <i class="bi" :class="hasValidCurrency ? 'bi-check-lg' : 'bi-circle'"></i>
                Moneda
              </li>
              <li :class="{ checked: hasValidPaymentMethod }">
                <i class="bi" :class="hasValidPaymentMethod ? 'bi-check-lg' : 'bi-circle'"></i>
                Forma de pago
              </li>
              <li :class="{ checked: hasValidItems }">
                <i class="bi" :class="hasValidItems ? 'bi-check-lg' : 'bi-circle'"></i>
                Al menos un producto o servicio
              </li>
              <li v-if="requiresExchangeRate" :class="{ checked: hasValidExchangeRate }">
                <i class="bi" :class="hasValidExchangeRate ? 'bi-check-lg' : 'bi-circle'"></i>
                Tasa de cambio
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        id="client-selection-modal"
        ref="clientModalElement"
        class="modal fade"
        tabindex="-1"
        aria-labelledby="client-modal-title"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content catalog-bootstrap-modal">
            <div class="modal-header product-modal-header">
              <div>
                <span class="product-modal-eyebrow">Directorio de clientes</span>
                <h2 id="client-modal-title">Seleccionar cliente</h2>
                <p>Busca y selecciona el cliente al que se emitirá la factura.</p>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar" />
            </div>

            <div class="modal-body product-modal-body">
              <div class="product-search-wrap">
                <i class="bi bi-search"></i>
                <input
                  ref="clientSearchInput"
                  v-model="clientSearch"
                  type="search"
                  class="form-control"
                  placeholder="Buscar por nombre, RNC, identificación, código o correo..."
                >
                <button v-if="clientSearch" type="button" class="btn btn-outline-secondary" @click="clientSearch = ''">Limpiar</button>
              </div>

              <div class="product-results-summary">
                <span>{{ filteredClients.length }} {{ filteredClients.length === 1 ? 'resultado' : 'resultados' }}</span>
                <small>Solo se muestran clientes activos.</small>
              </div>

              <div v-if="filteredClients.length" class="table-responsive product-results client-results">
                <table class="table align-middle mb-0">
                  <thead><tr><th>Cliente</th><th>Identificación</th><th>Contacto</th><th class="text-end">Acción</th></tr></thead>
                  <tbody>
                    <tr v-for="client in filteredClients" :key="client.id" :class="{ 'selected-client-row': client.id === invoice.clientId }">
                      <td><strong>{{ client.razonSocialComprador }}</strong><small>{{ client.codigoInternoComprador || 'Sin código interno' }}</small></td>
                      <td><strong>{{ clientIdentification(client) }}</strong><small>{{ client.paisComprador || 'República Dominicana' }}</small></td>
                      <td><strong>{{ client.contactoComprador || 'Sin contacto' }}</strong><small>{{ client.correoComprador || 'Sin correo' }}</small></td>
                      <td class="text-end">
                        <button type="button" class="btn btn-sm btn-primary select-product-button" @click="selectClient(client)">
                          <i class="bi me-1" :class="client.id === invoice.clientId ? 'bi-check-circle' : 'bi-person-check'" />
                          {{ client.id === invoice.clientId ? 'Seleccionado' : 'Seleccionar' }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="product-modal-empty">
                <i class="bi bi-search"></i>
                <strong>No encontramos clientes</strong>
                <span>Prueba con otro nombre, identificación, código o correo.</span>
              </div>
            </div>

            <div class="modal-footer product-modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        id="product-selection-modal"
        ref="productModalElement"
        class="modal fade"
        tabindex="-1"
        aria-labelledby="product-modal-title"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content catalog-bootstrap-modal">
            <div class="modal-header product-modal-header">
              <div>
                <span class="product-modal-eyebrow">Catálogo de inventario</span>
                <h2 id="product-modal-title">Agregar producto o servicio</h2>
                <p>Busca y selecciona el artículo que deseas incluir en la factura.</p>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar" />
            </div>

            <div class="modal-body product-modal-body">
              <div class="product-search-wrap">
                <i class="bi bi-search"></i>
                <input
                  ref="productSearchInput"
                  v-model="productSearch"
                  type="search"
                  class="form-control"
                  placeholder="Buscar por nombre, código o descripción..."
                >
                <button v-if="productSearch" type="button" class="btn btn-outline-secondary" @click="productSearch = ''">Limpiar</button>
              </div>

              <div class="product-results-summary">
                <span>{{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'resultado' : 'resultados' }}</span>
                <small>Solo se muestran artículos activos.</small>
              </div>

              <div v-if="filteredProducts.length" class="table-responsive product-results">
                <table class="table align-middle mb-0">
                  <thead><tr><th>Producto/Servicio</th><th>Tipo</th><th class="text-end">Precio</th><th class="text-center">Existencia</th><th class="text-end">Acción</th></tr></thead>
                  <tbody>
                    <tr v-for="article in filteredProducts" :key="article.id">
                      <td>
                        <strong>{{ article.nombreItem }}</strong>
                        <small>{{ article.codigo || 'Sin código' }}<template v-if="article.descripcionItem"> · {{ article.descripcionItem }}</template></small>
                      </td>
                      <td><span class="product-type-badge">{{ article.indicadorBienoServicio === 2 ? 'Servicio' : 'Bien' }}</span></td>
                      <td class="text-end"><strong>{{ formatCurrency(article.precioUnitarioItem) }}</strong><small>{{ taxLabel(article.indicadorFacturacion) }}</small></td>
                      <td class="text-center">{{ article.indicadorBienoServicio === 2 ? 'No aplica' : article.existencia }}</td>
                      <td class="text-end">
                        <button type="button" class="btn btn-sm btn-primary select-product-button" @click="selectProduct(article)">
                          <i class="bi me-1" :class="selectedProductQuantity(article.id) ? 'bi-check-circle' : 'bi-plus-circle'"></i>
                          {{ selectedProductQuantity(article.id) ? `Agregar otro (${selectedProductQuantity(article.id)})` : 'Seleccionar' }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="product-modal-empty">
                <i class="bi bi-search"></i>
                <strong>No encontramos productos</strong>
                <span>Prueba con otro nombre, código o descripción.</span>
              </div>
            </div>

            <div class="modal-footer product-modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Article, BillingIndicator } from '~/types/article'
import type { Currency, PaymentMethod, ReceiptType } from '~/types/billing'
import type { Client } from '~/types/client'

interface InvoiceItem {
  id: number
  articleId: string
  description: string
  quantity: number
  unitPrice: number
  billingIndicator: number
}

interface TemplateNotify {
  notify?: (
    content: { icon: string, title: string, message: string },
    options: Record<string, unknown>,
  ) => unknown
}

interface BootstrapModalInstance {
  show: () => void
  hide: () => void
  dispose: () => void
}

interface BootstrapModalConstructor {
  getOrCreateInstance: (
    element: HTMLElement,
    options?: { backdrop?: boolean | 'static', keyboard?: boolean, focus?: boolean },
  ) => BootstrapModalInstance
}

const DECIMAL_UNIT_CODES = new Set([
  8, 12, 15, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29, 30,
  33, 37, 39, 41, 42, 51, 52, 53, 55, 56, 58, 59, 60, 61, 62,
])
const SALE_RECEIPT_TYPES = new Set([31, 32, 44, 45, 46])
const PENDING_INVOICE_KEY = 'effisort_invoice_pending_client'
const DRAFT_INVOICE_KEY = 'effisort_invoice_draft'

const { getClients } = useClientsApi()
const { getArticles } = useArticlesApi()
const { getPaymentMethods, getCurrencies, getReceiptTypes, getBillingIndicators } = useBillingCatalogsApi()
const showOptional = ref(false)
const showClientModal = ref(false)
const clientSearch = ref('')
const clientSearchInput = ref<HTMLInputElement | null>(null)
const clientSelectorButton = ref<HTMLButtonElement | null>(null)
const clientModalElement = ref<HTMLElement | null>(null)
let clientModalInstance: BootstrapModalInstance | null = null
const showProductModal = ref(false)
const productSearch = ref('')
const productSearchInput = ref<HTMLInputElement | null>(null)
const productSelectorButton = ref<HTMLButtonElement | null>(null)
const productModalElement = ref<HTMLElement | null>(null)
let productModalInstance: BootstrapModalInstance | null = null
const loadingClients = ref(true)
const loadingArticles = ref(true)
const loadingCatalogs = ref(true)
const clientError = ref('')
const articleError = ref('')
const catalogError = ref('')
const clients = ref<Client[]>([])
const articles = ref<Article[]>([])
const paymentMethods = ref<PaymentMethod[]>([])
const currencies = ref<Currency[]>([])
const receiptTypes = ref<ReceiptType[]>([])
const billingIndicators = ref<BillingIndicator[]>([])

const invoice = reactive({
  clientId: '',
  issueDate: currentDate(),
  dueDate: dateAfterDays(15),
  documentType: '',
  currency: 'DOP',
  exchangeRate: 1,
  paymentMethod: '',
  discount: 0,
  internalReference: '',
  purchaseOrder: '',
  branch: '',
  terms: '',
  notes: '',
  items: [] as InvoiceItem[],
})

onMounted(async () => {
  restorePendingInvoice()
  clientModalElement.value?.addEventListener('shown.bs.modal', handleClientModalShown)
  clientModalElement.value?.addEventListener('hidden.bs.modal', handleClientModalHidden)
  productModalElement.value?.addEventListener('shown.bs.modal', handleProductModalShown)
  productModalElement.value?.addEventListener('hidden.bs.modal', handleProductModalHidden)
  await loadReferenceData()
})

onBeforeUnmount(() => {
  clientModalElement.value?.removeEventListener('shown.bs.modal', handleClientModalShown)
  clientModalElement.value?.removeEventListener('hidden.bs.modal', handleClientModalHidden)
  productModalElement.value?.removeEventListener('shown.bs.modal', handleProductModalShown)
  productModalElement.value?.removeEventListener('hidden.bs.modal', handleProductModalHidden)
  clientModalInstance?.dispose()
  clientModalInstance = null
  productModalInstance?.dispose()
  productModalInstance = null
})

const selectedClient = computed(() => clients.value.find(client => client.id === invoice.clientId))
const selectedReceiptType = computed(() => receiptTypes.value.find(item => String(item.tipo) === invoice.documentType))

const hasClient = computed(() => !!invoice.clientId)
const hasValidReceiptType = computed(() => receiptTypes.value.some(item => String(item.tipo) === invoice.documentType))
const hasValidCurrency = computed(() => currencies.value.some(item => item.codigo === invoice.currency))
const hasValidPaymentMethod = computed(() => paymentMethods.value.some(item => item.codigo === invoice.paymentMethod))
const requiresDueDate = computed(() => invoice.paymentMethod === '4')
const hasValidDates = computed(() => Boolean(
  invoice.issueDate
  && (!requiresDueDate.value || invoice.dueDate)
  && (!invoice.dueDate || invoice.dueDate >= invoice.issueDate),
))
const requiresExchangeRate = computed(() => Boolean(invoice.currency && invoice.currency !== 'DOP'))
const hasValidExchangeRate = computed(() => !requiresExchangeRate.value
  || (Number.isFinite(Number(invoice.exchangeRate)) && Number(invoice.exchangeRate) > 0))

const hasValidItems = computed(() => {
  return invoice.items.length > 0 && invoice.items.every(isValidItem)
})

const filteredClients = computed(() => {
  const activeClients = clients.value.filter(client => client.activo !== false)
  const normalizedSearch = clientSearch.value.trim().toLocaleLowerCase('es')
  if (!normalizedSearch) return activeClients

  return activeClients.filter(client => [
    client.razonSocialComprador,
    client.rncComprador,
    client.identificadorExtranjero,
    client.codigoInternoComprador,
    client.contactoComprador,
    client.correoComprador,
    client.telefonoAdicional,
  ].some(value => value?.toLocaleLowerCase('es').includes(normalizedSearch)))
})

const filteredProducts = computed(() => {
  const normalizedSearch = productSearch.value.trim().toLocaleLowerCase('es')
  if (!normalizedSearch) return articles.value

  return articles.value.filter(article => [
    article.nombreItem,
    article.codigo,
    article.tipoCodigo,
    article.descripcionItem,
  ].some(value => value?.toLocaleLowerCase('es').includes(normalizedSearch)))
})

const subtotal = computed(() => {
  return invoice.items.reduce((total, item) => total + getLineSubtotal(item), 0)
})

const taxTotal = computed(() => {
  return invoice.items.reduce((total, item) => {
    const lineSubtotal = getLineSubtotal(item)
    return total + lineSubtotal * (taxRateForItem(item) / 100)
  }, 0)
})

const grossTotal = computed(() => subtotal.value + taxTotal.value)
const hasValidDiscount = computed(() => Number.isFinite(Number(invoice.discount))
  && Number(invoice.discount) >= 0
  && Number(invoice.discount) <= grossTotal.value)

const grandTotal = computed(() => {
  return Math.max(grossTotal.value - (Number(invoice.discount) || 0), 0)
})

const isInvoiceReady = computed(() => Boolean(
  hasClient.value
  && hasValidDates.value
  && hasValidReceiptType.value
  && hasValidCurrency.value
  && hasValidPaymentMethod.value
  && hasValidItems.value
  && hasValidDiscount.value
  && hasValidExchangeRate.value,
))

function getLineSubtotal(item: InvoiceItem) {
  return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
}

function formatCurrency(value: number) {
  const selectedCurrency = /^[A-Z]{3}$/.test(invoice.currency) ? invoice.currency : 'DOP'
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: selectedCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)
}

function formatDop(value: number) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)
}

function removeItem(id: number) {
  const index = invoice.items.findIndex((item) => item.id === id)

  if (index !== -1) {
    invoice.items.splice(index, 1)
  }
}

function createClient() {
  sessionStorage.setItem(PENDING_INVOICE_KEY, JSON.stringify(invoice))
  navigateTo({
    path: '/admin/clients',
    query: { create: '1', returnTo: '/admin/billing/sale' },
  })
}

async function openClientModal() {
  clientSearch.value = ''
  showClientModal.value = true
  await nextTick()
  const modal = getClientModal()
  if (!modal) {
    showClientModal.value = false
    showNotification('Modal no disponible', 'No pudimos inicializar el componente de Bootstrap.', 'danger')
    return
  }
  modal.show()
}

function closeClientModal() {
  getClientModal()?.hide()
}

function getClientModal() {
  if (clientModalInstance) return clientModalInstance
  const bootstrap = getBootstrapModalConstructor()
  if (!clientModalElement.value || !bootstrap) return null

  clientModalInstance = bootstrap.getOrCreateInstance(clientModalElement.value, {
    backdrop: true,
    keyboard: true,
    focus: true,
  })
  return clientModalInstance
}

function handleClientModalShown() {
  showClientModal.value = true
  clientSearchInput.value?.focus()
}

function handleClientModalHidden() {
  showClientModal.value = false
  clientSearch.value = ''
  clientSelectorButton.value?.focus()
}

function selectClient(client: Client) {
  invoice.clientId = client.id
  closeClientModal()
}

function clientIdentification(client: Client) {
  if (client.rncComprador) return `RNC: ${client.rncComprador}`
  if (client.identificadorExtranjero) return `ID extranjero: ${client.identificadorExtranjero}`
  return 'Sin identificación registrada'
}

function saveDraft() {
  localStorage.setItem(DRAFT_INVOICE_KEY, JSON.stringify(invoice))
  showNotification('Borrador guardado', 'La factura se guardó únicamente en este navegador.', 'success')
}

function emitInvoice() {
  normalizeDates()
  normalizeDiscount()
  normalizeExchangeRate()
  invoice.items.forEach(normalizeQuantity)

  if (!isInvoiceReady.value) {
    showNotification('Factura incompleta', 'Completa los campos obligatorios antes de continuar.', 'danger')
    return
  }

  showNotification(
    'Modo de preparación',
    `La factura está lista para revisión por un total de ${formatCurrency(grandTotal.value)}. No fue enviada al backend.`,
    'info',
  )
}

function cancelInvoice() {
  navigateTo('/admin/billing')
}

async function loadReferenceData() {
  await Promise.all([loadClients(), loadArticles(), loadBillingCatalogs()])
}

async function loadClients() {
  loadingClients.value = true
  clientError.value = ''
  try {
    const response = await getClients(false)
    clients.value = Array.isArray(response) ? response : []
  } catch (caughtError: unknown) {
    if (getErrorStatus(caughtError) !== 401) clientError.value = 'No pudimos cargar los clientes disponibles.'
  } finally {
    loadingClients.value = false
  }
}

async function loadArticles() {
  loadingArticles.value = true
  articleError.value = ''
  try {
    const response = await getArticles(false)
    articles.value = Array.isArray(response) ? response : []
  } catch (caughtError: unknown) {
    if (getErrorStatus(caughtError) !== 401) articleError.value = 'No pudimos cargar los artículos disponibles.'
  } finally {
    loadingArticles.value = false
  }
}

async function loadBillingCatalogs() {
  loadingCatalogs.value = true
  catalogError.value = ''
  const results = await Promise.allSettled([
    getPaymentMethods(),
    getCurrencies(),
    getReceiptTypes(),
    getBillingIndicators(),
  ])

  const [paymentResult, currencyResult, receiptResult, indicatorResult] = results
  if (paymentResult.status === 'fulfilled') {
    paymentMethods.value = activeCatalog(paymentResult.value).sort((a, b) => Number(a.codigo) - Number(b.codigo))
  }
  if (currencyResult.status === 'fulfilled') {
    currencies.value = activeCatalog(currencyResult.value).sort((a, b) => {
      if (a.codigo === 'DOP') return -1
      if (b.codigo === 'DOP') return 1
      return a.codigo.localeCompare(b.codigo)
    })
  }
  if (receiptResult.status === 'fulfilled') {
    receiptTypes.value = activeCatalog(receiptResult.value)
      .filter(item => SALE_RECEIPT_TYPES.has(item.tipo))
      .sort((a, b) => a.tipo - b.tipo)
  }
  if (indicatorResult.status === 'fulfilled') {
    billingIndicators.value = activeCatalog(indicatorResult.value).sort((a, b) => a.codigo - b.codigo)
  }

  const failedCatalogs = [
    paymentResult.status === 'rejected' && 'formas de pago',
    currencyResult.status === 'rejected' && 'monedas',
    receiptResult.status === 'rejected' && 'tipos de comprobante',
    indicatorResult.status === 'rejected' && 'indicadores de facturación',
  ].filter(Boolean)

  if (failedCatalogs.length) catalogError.value = `No pudimos cargar: ${failedCatalogs.join(', ')}.`
  selectCatalogDefaults()
  loadingCatalogs.value = false
}

async function openProductModal() {
  productSearch.value = ''
  showProductModal.value = true
  await nextTick()
  const modal = getProductModal()
  if (!modal) {
    showProductModal.value = false
    showNotification('Modal no disponible', 'No pudimos inicializar el componente de Bootstrap.', 'danger')
    return
  }
  modal.show()
}

function closeProductModal() {
  getProductModal()?.hide()
}

function getProductModal() {
  if (productModalInstance) return productModalInstance
  const bootstrap = getBootstrapModalConstructor()
  if (!productModalElement.value || !bootstrap) return null

  productModalInstance = bootstrap.getOrCreateInstance(productModalElement.value, {
    backdrop: true,
    keyboard: true,
    focus: true,
  })
  return productModalInstance
}

function getBootstrapModalConstructor() {
  return (window as unknown as { bootstrap?: { Modal?: BootstrapModalConstructor } }).bootstrap?.Modal ?? null
}

function handleProductModalShown() {
  showProductModal.value = true
  productSearchInput.value?.focus()
}

function handleProductModalHidden() {
  showProductModal.value = false
  productSearch.value = ''
  productSelectorButton.value?.focus()
}

function selectedProductQuantity(articleId: string) {
  return invoice.items.find(item => item.articleId === articleId)?.quantity || 0
}

function selectProduct(article: Article) {
  const existingItem = invoice.items.find(item => item.articleId === article.id)
  if (existingItem) {
    existingItem.quantity = Number(existingItem.quantity || 0) + 1
    showNotification('Cantidad actualizada', `${article.nombreItem} ya estaba agregado; aumentamos su cantidad.`, 'info')
  } else {
    const nextId = Math.max(...invoice.items.map(item => item.id), 0) + 1
    invoice.items.push({
      id: nextId,
      articleId: article.id,
      description: article.nombreItem,
      quantity: 1,
      unitPrice: Number(article.precioUnitarioItem),
      billingIndicator: article.indicadorFacturacion,
    })
  }
}

function articleForItem(item: InvoiceItem) {
  return articles.value.find(article => article.id === item.articleId)
}

function quantityStep(item: InvoiceItem) {
  const unitCode = Number(articleForItem(item)?.unidadMedida)
  return DECIMAL_UNIT_CODES.has(unitCode) ? 0.01 : 1
}

function normalizeQuantity(item: InvoiceItem) {
  const step = quantityStep(item)
  const quantity = Number(item.quantity)

  if (!Number.isFinite(quantity) || quantity <= 0) {
    item.quantity = step
    return
  }

  item.quantity = step === 1
    ? Math.max(1, Math.round(quantity))
    : Math.max(0.01, Math.round(quantity * 100) / 100)
}

function isValidItem(item: InvoiceItem) {
  const quantity = Number(item.quantity)
  const step = quantityStep(item)
  const respectsStep = step === 1
    ? Number.isInteger(quantity)
    : Math.abs(quantity * 100 - Math.round(quantity * 100)) < Number.EPSILON * 100

  return Boolean(
    item.articleId
    && item.description.trim()
    && Number.isFinite(quantity)
    && quantity > 0
    && respectsStep
    && Number.isFinite(Number(item.unitPrice))
    && Number(item.unitPrice) > 0
    && billingIndicators.value.some(indicator => indicator.codigo === item.billingIndicator),
  )
}

function taxRateForItem(item: InvoiceItem) {
  return Number(billingIndicators.value.find(indicator => indicator.codigo === item.billingIndicator)?.tasaItbis || 0)
}

function taxLabel(indicator: number) {
  const catalogIndicator = billingIndicators.value.find(item => item.codigo === indicator)
  if (!catalogIndicator) return 'Indicador no disponible'
  return `${catalogIndicator.descripcion} · ${catalogIndicator.tasaItbis}%`
}

function activeCatalog<T extends { activo: boolean }>(items: T[]) {
  return (Array.isArray(items) ? items : []).filter(item => item.activo !== false)
}

function selectCatalogDefaults() {
  if (!receiptTypes.value.some(item => String(item.tipo) === invoice.documentType)) {
    invoice.documentType = String(receiptTypes.value.find(item => item.tipo === 32)?.tipo ?? receiptTypes.value[0]?.tipo ?? '')
  }
  if (!currencies.value.some(item => item.codigo === invoice.currency)) {
    invoice.currency = currencies.value.find(item => item.codigo === 'DOP')?.codigo ?? currencies.value[0]?.codigo ?? ''
  }
  if (!paymentMethods.value.some(item => item.codigo === invoice.paymentMethod)) {
    invoice.paymentMethod = paymentMethods.value.find(item => item.codigo === '2')?.codigo ?? paymentMethods.value[0]?.codigo ?? ''
  }
}

function normalizeDates() {
  if (invoice.issueDate && invoice.dueDate && invoice.dueDate < invoice.issueDate) {
    invoice.dueDate = invoice.issueDate
    showNotification('Fecha ajustada', 'El vencimiento no puede ser anterior a la fecha de emisión.', 'info')
  }
}

function normalizeDiscount() {
  const discount = Number(invoice.discount)
  invoice.discount = Number.isFinite(discount)
    ? Math.min(Math.max(Math.round(discount * 100) / 100, 0), grossTotal.value)
    : 0
}

function normalizeExchangeRate() {
  if (!requiresExchangeRate.value) {
    invoice.exchangeRate = 1
    return
  }

  const rate = Number(invoice.exchangeRate)
  invoice.exchangeRate = Number.isFinite(rate) && rate > 0
    ? Math.round(rate * 10_000) / 10_000
    : 0
}

function restorePendingInvoice() {
  const pendingInvoice = sessionStorage.getItem(PENDING_INVOICE_KEY)
  if (!pendingInvoice) return

  try {
    const restored = JSON.parse(pendingInvoice) as Partial<typeof invoice>
    Object.assign(invoice, restored, {
      items: Array.isArray(restored.items) ? restored.items : [],
    })
  } catch {
    showNotification('Borrador no recuperado', 'No pudimos recuperar los datos previos de la factura.', 'danger')
  } finally {
    sessionStorage.removeItem(PENDING_INVOICE_KEY)
  }
}

function getErrorStatus(error: unknown) {
  return (error as { statusCode?: number }).statusCode ?? (error as { status?: number }).status
}

function currentDate() {
  return formatDateInput(new Date())
}

function dateAfterDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return formatDateInput(date)
}

function formatDateInput(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function showNotification(title: string, message: string, type: 'success' | 'danger' | 'info') {
  const jquery = (window as unknown as { jQuery?: TemplateNotify }).jQuery
  jquery?.notify?.(
    { icon: type === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-info-circle-fill', title, message },
    {
      type,
      placement: { from: 'top', align: 'right' },
      delay: 3500,
      timer: 500,
      z_index: 2000,
    },
  )
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

.field-helper {
  display: block;
  margin-top: 0.35rem;
  color: #667085;
  font-size: 0.72rem;
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

.client-selector {
  display: flex;
  width: 100%;
  min-height: 58px;
  padding: 0.65rem 0.8rem;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid #d9e1ec;
  border-radius: 10px;
  background: #fff;
  color: #344054;
  text-align: left;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.client-selector:hover:not(:disabled) {
  border-color: #9ec5fe;
  background: #f8fbff;
}

.client-selector:focus-visible {
  outline: 0;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.16rem rgba(13, 110, 253, 0.08);
}

.client-selector:disabled {
  opacity: 0.65;
  cursor: wait;
}

.client-selector.selected {
  border-color: #b9d3ff;
  background: #f8fbff;
}

.client-selector-icon {
  display: inline-flex;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #eef5ff;
  color: #0d6efd;
}

.client-selector-content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.client-selector-content strong,
.client-selector-content small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.client-selector-content strong {
  color: #101828;
  font-size: 0.86rem;
}

.client-selector-content small {
  margin-top: 0.12rem;
  color: #667085;
  font-size: 0.74rem;
}

.client-selector-arrow {
  color: #98a2b3;
  font-size: 0.78rem;
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

.line-product-name,
.line-product-code {
  display: block;
}

.line-product-code {
  margin-top: 0.18rem;
  color: #667085;
  font-size: 0.74rem;
}

.products-empty-state {
  display: flex;
  min-height: 150px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.35rem;
  color: #667085;
  text-align: center;
}

.products-empty-state i {
  margin-bottom: 0.35rem;
  color: #0d6efd;
  font-size: 1.5rem;
}

.products-empty-state strong {
  color: #344054;
}

.quantity-input {
  width: 90px;
  text-align: center;
}

.quantity-helper {
  display: block;
  margin-top: 0.3rem;
  color: #667085;
  font-size: 0.68rem;
  white-space: nowrap;
}

.price-input {
  width: 150px;
  text-align: right;
}

.line-unit-price {
  color: #344054;
  font-weight: 700;
  white-space: nowrap;
}

.tax-input {
  width: 90px;
}

.tax-badge {
  display: inline-flex;
  min-width: 52px;
  padding: 0.38rem 0.55rem;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #eef5ff;
  color: #175cd3;
  font-size: 0.76rem;
  font-weight: 700;
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

.add-line-button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.catalog-bootstrap-modal {
  overflow: hidden;
  border: 0;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
}

.product-modal-header,
.product-modal-footer {
  display: flex;
  flex: 0 0 auto;
  padding: 1.25rem 1.5rem;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.product-modal-header {
  border-bottom: 1px solid #e5eaf2;
}

.product-modal-header h2 {
  margin: 0.15rem 0 0.25rem;
  color: #101828;
  font-size: 1.3rem;
  font-weight: 700;
}

.product-modal-header p {
  margin: 0;
  color: #667085;
  font-size: 0.84rem;
}

.product-modal-eyebrow {
  color: #0d6efd;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.product-modal-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
}

.product-modal-footer {
  align-items: center;
  justify-content: flex-end;
  border-top: 1px solid #e5eaf2;
  background: #f8fafc;
}

.product-modal-footer .btn {
  min-width: 110px;
}

.product-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.product-search-wrap > i {
  position: absolute;
  left: 0.9rem;
  z-index: 1;
  color: #667085;
}

.product-search-wrap .form-control {
  min-height: 46px;
  padding-left: 2.45rem;
  border-color: #d9e1ec;
  border-radius: 10px;
}

.product-results-summary {
  display: flex;
  padding: 1rem 0 0.65rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: #344054;
  font-size: 0.8rem;
  font-weight: 600;
}

.product-results-summary small {
  color: #667085;
  font-weight: 400;
}

.product-results {
  border: 1px solid #e5eaf2;
  border-radius: 12px;
}

.product-results thead th {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #e5eaf2;
  background: #f8fafc;
  color: #667085;
  font-size: 0.72rem;
  white-space: nowrap;
}

.product-results tbody td {
  padding: 0.8rem 0.85rem;
  border-color: #edf0f5;
  color: #344054;
  font-size: 0.8rem;
}

.product-results td strong,
.product-results td small {
  display: block;
}

.product-results td small {
  max-width: 390px;
  margin-top: 0.15rem;
  overflow: hidden;
  color: #667085;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-type-badge {
  display: inline-flex;
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  background: #eef5ff;
  color: #175cd3;
  font-size: 0.7rem;
  font-weight: 700;
}

.select-product-button {
  border-radius: 8px;
  white-space: nowrap;
}

.client-results .selected-client-row td {
  background: #f3f8ff;
}

.product-modal-empty {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.4rem;
  color: #667085;
  text-align: center;
}

.product-modal-empty i {
  margin-bottom: 0.35rem;
  font-size: 1.5rem;
}

.product-modal-empty strong {
  color: #344054;
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

.summary-exchange {
  display: flex;
  padding-top: 0.85rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px dashed #d9e1ec;
  color: #667085;
  font-size: 0.82rem;
}

.summary-exchange strong {
  color: #344054;
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

  .product-modal-header,
  .product-modal-body,
  .product-modal-footer {
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .product-search-wrap {
    align-items: stretch;
    flex-direction: column;
  }

  .product-search-wrap .btn {
    width: 100%;
  }
}
</style>
