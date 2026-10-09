<template>
  <main class="credit-note-page">
    <header class="page-header">
      <div>
        <nav class="breadcrumb-line" aria-label="Miga de pan">
          <NuxtLink to="/admin/billing">Facturación</NuxtLink>
          <i class="bi bi-chevron-right" aria-hidden="true" />
          <NuxtLink to="/admin/billing/credit-notes">Notas de crédito</NuxtLink>
          <i class="bi bi-chevron-right" aria-hidden="true" />
          <strong>Nueva E34</strong>
        </nav>
        <h1>Nueva nota de crédito</h1>
        <p>Corrige o anula una factura electrónica emitida.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline-secondary" type="button" @click="cancelCreditNote">
          Cancelar
        </button>
        <button class="btn btn-outline-primary" type="button" :disabled="loading || !source" @click="saveDraft">
          <i class="bi bi-cloud-arrow-down me-1" aria-hidden="true" /> Guardar borrador
        </button>
        <button class="btn btn-primary" type="button" :disabled="loading || submitting || !isReady" @click="reviewEmission">
          <i class="bi bi-send-check me-1" aria-hidden="true" /> Revisar y emitir
        </button>
      </div>
    </header>

    <div v-if="loading" class="state-card">
      <span class="spinner-border text-primary" aria-hidden="true" />
      <strong>Preparando la nota de crédito…</strong>
      <span>Estamos validando la factura original y los catálogos fiscales.</span>
    </div>

    <div v-else-if="loadError" class="alert alert-danger d-flex align-items-start gap-3" role="alert">
      <i class="bi bi-exclamation-octagon-fill fs-4" aria-hidden="true" />
      <div class="flex-grow-1">
        <strong>No pudimos preparar la nota de crédito</strong>
        <div>{{ loadError }}</div>
      </div>
      <button class="btn btn-sm btn-outline-danger" type="button" @click="initialize">Reintentar</button>
    </div>

    <template v-else-if="source">
      <section class="source-card" aria-labelledby="source-heading">
        <div class="source-icon"><i class="bi bi-receipt" aria-hidden="true" /></div>
        <div class="source-main">
          <span class="eyebrow">Factura afectada</span>
          <h2 id="source-heading">{{ source.encf }}</h2>
          <div class="source-meta">
            <span>E{{ source.documentType }}</span>
            <span>Emitida el {{ formatDate(source.issueDate) }}</span>
            <span>{{ source.buyerRnc ? `RNC ${source.buyerRnc}` : 'Sin RNC de comprador' }}</span>
          </div>
        </div>
        <div class="source-total">
          <small>Total original</small>
          <strong>{{ formatCurrency(source.total ?? 0) }}</strong>
        </div>
        <button class="btn btn-outline-primary" type="button" :disabled="downloadingOriginal" @click="downloadOriginalPdf">
          <span v-if="downloadingOriginal" class="spinner-border spinner-border-sm me-1" />
          <i v-else class="bi bi-file-earmark-pdf me-1" aria-hidden="true" />
          PDF original
        </button>
      </section>

      <div v-if="source.buyerRnc && !matchedClient" class="alert alert-info" role="alert">
        <div class="d-flex gap-2">
          <i class="bi bi-person-exclamation fs-5" aria-hidden="true" />
          <div>
            <strong>Comprador conservado por RNC.</strong>
            La búsqueda fiscal no devuelve todos sus datos y no encontramos un cliente coincidente. La E34 conservará el RNC original y enviará el resto de las propiedades en null.
          </div>
        </div>
      </div>

      <div class="editor-layout">
        <div class="editor-column">
          <section class="form-card" aria-labelledby="reason-heading">
            <div class="section-heading">
              <span class="section-icon blue"><i class="bi bi-arrow-counterclockwise" aria-hidden="true" /></span>
              <div><h2 id="reason-heading">Motivo de la modificación</h2><p>Información fiscal requerida por el comprobante E34.</p></div>
            </div>

            <div class="modification-grid">
              <label v-for="option in modificationOptions" :key="option.code" class="modification-option" :class="{ selected: form.modificationCode === option.code }">
                <input v-model.number="form.modificationCode" class="form-check-input" type="radio" name="modificationCode" :value="option.code">
                <span><strong>{{ option.title }}</strong><small>{{ option.description }}</small></span>
              </label>
            </div>

            <div class="row g-3 mt-1">
              <div class="col-12">
                <label class="form-label" for="reason">Razón de modificación <span class="text-danger">*</span></label>
                <textarea id="reason" v-model="form.reason" class="form-control" maxlength="90" rows="3" placeholder="Describe brevemente la razón de la nota de crédito" />
                <div class="form-hint"><span>Máximo 90 caracteres.</span><span>{{ form.reason.length }}/90</span></div>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="original-date">Fecha de la factura original</label>
                <input id="original-date" class="form-control" type="date" :value="source.issueDate" disabled>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="issue-date">Fecha de emisión E34 <span class="text-danger">*</span></label>
                <input id="issue-date" v-model="form.issueDate" class="form-control" type="date" :min="source.issueDate" :max="today">
              </div>
              <div class="col-md-6">
                <label class="form-label" for="income-type">Tipo de ingreso <span class="text-danger">*</span></label>
                <select id="income-type" v-model="form.incomeType" class="form-select">
                  <option value="">Selecciona una opción</option>
                  <option v-for="item in incomeTypes" :key="item.id" :value="normalizeIncomeType(item.codigo)">{{ normalizeIncomeType(item.codigo) }} · {{ item.descripcion }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="payment-type">Tipo de pago <span class="text-danger">*</span></label>
                <select id="payment-type" v-model.number="form.paymentType" class="form-select">
                  <option :value="0">Selecciona una opción</option>
                  <option v-for="item in paymentTypes" :key="item.id" :value="item.codigo">{{ item.codigo }} · {{ item.nombre }}</option>
                </select>
              </div>
            </div>

            <div v-if="calculation" class="rule-banner mt-3" :class="calculation.taxCreditAllowed ? 'rule-normal' : 'rule-warning'">
              <i :class="calculation.taxCreditAllowed ? 'bi bi-calendar-check' : 'bi bi-calendar-x'" aria-hidden="true" />
              <div>
                <strong>{{ calculation.daysSinceOriginal }} días desde la factura original · Indicador {{ calculation.indicator }}</strong>
                <span v-if="calculation.taxCreditAllowed">La nota está dentro de los 30 días y puede afectar base e ITBIS.</span>
                <span v-else>Han pasado más de 30 días: la E34 sólo afectará la base y no acreditará ITBIS.</span>
              </div>
            </div>
          </section>

          <section class="form-card" aria-labelledby="items-heading">
            <div class="section-heading items-heading">
              <span class="section-icon purple"><i class="bi bi-box-seam" aria-hidden="true" /></span>
              <div class="flex-grow-1"><h2 id="items-heading">Conceptos acreditados</h2><p>Reconstruye únicamente los conceptos que serán afectados.</p></div>
              <div class="item-actions">
                <button class="btn btn-outline-primary" type="button" :disabled="form.modificationCode === 2" @click="openProductModal"><i class="bi bi-search me-1" /> Inventario</button>
                <button class="btn btn-primary" type="button" @click="openCustomModal"><i class="bi bi-plus-lg me-1" /> Personalizado</button>
              </div>
            </div>

            <div class="alert alert-info py-2" role="note">
              <i class="bi bi-info-circle me-1" aria-hidden="true" />
              El backend no devuelve las líneas de la factura original. Confirma los conceptos con el PDF antes de emitir.
            </div>

            <div v-if="!form.items.length" class="empty-items">
              <i class="bi bi-basket" aria-hidden="true" />
              <strong>Aún no hay conceptos</strong>
              <span>{{ form.modificationCode === 2 ? 'Agrega una línea personalizada con monto cero para describir la corrección.' : 'Agrega productos del inventario o un concepto personalizado.' }}</span>
            </div>
            <div v-else class="table-responsive item-table-shell">
              <table class="table align-middle mb-0">
                <thead><tr><th>Concepto</th><th class="quantity-column">Cantidad</th><th>Precio</th><th>ITBIS</th><th>Total</th><th><span class="visually-hidden">Acciones</span></th></tr></thead>
                <tbody>
                  <tr v-for="(item, index) in form.items" :key="`${item.article.id}-${index}`">
                    <td><strong>{{ item.article.nombreItem }}</strong><small>{{ item.article.codigo || 'Concepto personalizado' }}</small></td>
                    <td><input v-model.number="item.quantity" class="form-control form-control-sm" type="number" min="0.01" :step="quantityStep(item.article)" @blur="normalizeQuantity(item)"></td>
                    <td>{{ formatCurrency(item.unitPrice) }}</td>
                    <td>{{ formatCurrency(lineTax(item)) }}</td>
                    <td><strong>{{ formatCurrency(lineTotal(item)) }}</strong></td>
                    <td><button class="btn btn-sm btn-outline-danger" type="button" :aria-label="`Eliminar ${item.article.nombreItem}`" @click="form.items.splice(index, 1)"><i class="bi bi-trash" /></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="form-card" aria-labelledby="additional-heading">
            <div class="section-heading">
              <span class="section-icon green"><i class="bi bi-card-text" aria-hidden="true" /></span>
              <div><h2 id="additional-heading">Información interna</h2><p>Estos datos son opcionales.</p></div>
            </div>
            <div class="row g-3">
              <div class="col-md-6"><label class="form-label" for="internal-reference">Referencia interna</label><input id="internal-reference" v-model="form.internalReference" class="form-control" maxlength="20"></div>
              <div class="col-md-6"><label class="form-label" for="notes">Nota del emisor</label><input id="notes" v-model="form.notes" class="form-control" maxlength="250"></div>
            </div>
          </section>
        </div>

        <aside class="summary-card" aria-labelledby="summary-heading">
          <div class="summary-title"><span class="section-icon blue"><i class="bi bi-calculator" /></span><h2 id="summary-heading">Resumen E34</h2></div>
          <dl>
            <div><dt>Subtotal acreditado</dt><dd>{{ formatCurrency(calculation?.subtotal ?? 0) }}</dd></div>
            <div><dt>ITBIS acreditado</dt><dd>{{ formatCurrency(calculation?.taxTotal ?? 0) }}</dd></div>
            <div class="summary-total"><dt>Total nota</dt><dd>{{ formatCurrency(calculation?.total ?? 0) }}</dd></div>
          </dl>
          <div class="original-comparison"><span>Total factura original</span><strong>{{ formatCurrency(source.total ?? 0) }}</strong></div>
          <div class="validation-summary">
            <strong>Validación previa</strong>
            <ul>
              <li :class="source ? 'valid' : 'invalid'"><i :class="source ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'" /> Factura original</li>
              <li :class="buyerPreserved ? 'valid' : 'invalid'"><i :class="buyerPreserved ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'" /> Comprador conservado</li>
              <li :class="form.items.length ? 'valid' : 'invalid'"><i :class="form.items.length ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'" /> Conceptos agregados</li>
              <li :class="validationErrors.length ? 'invalid' : 'valid'"><i :class="validationErrors.length ? 'bi bi-x-circle-fill' : 'bi bi-check-circle-fill'" /> Contrato fiscal</li>
            </ul>
          </div>
          <div v-if="validationErrors.length" class="validation-errors">
            <strong>Falta completar:</strong>
            <ul><li v-for="error in validationErrors.slice(0, 5)" :key="error">{{ error }}</li></ul>
          </div>
          <button class="btn btn-primary w-100" type="button" :disabled="submitting || !isReady" @click="reviewEmission">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-1" />
            <i v-else class="bi bi-send-check me-1" /> Revisar y emitir
          </button>
          <small class="submit-note"><i class="bi bi-shield-check" /> No se realizan reintentos automáticos.</small>
        </aside>
      </div>
    </template>

    <div ref="productModalElement" class="modal fade" tabindex="-1" aria-labelledby="product-modal-title" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><div class="modal-content app-modal">
        <div class="modal-header"><div><span class="eyebrow">Inventario</span><h2 id="product-modal-title" class="modal-title">Seleccionar productos o servicios</h2><p>Puedes agregar varios y cerrar cuando termines.</p></div><button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Cerrar" /></div>
        <div class="modal-body">
          <div class="search-box"><i class="bi bi-search" /><input ref="productSearchInput" v-model="productSearch" class="form-control" placeholder="Buscar por nombre o código"></div>
          <div v-if="articleError" class="alert alert-danger mt-3">{{ articleError }}</div>
          <div v-if="loadingArticles" class="modal-state"><span class="spinner-border text-primary" /> Cargando inventario…</div>
          <div v-else-if="!filteredArticles.length" class="modal-state"><i class="bi bi-inbox fs-2" /> No encontramos productos.</div>
          <div v-else class="product-list">
            <article v-for="article in filteredArticles" :key="article.id" class="product-row">
              <div><strong>{{ article.nombreItem }}</strong><span>{{ article.codigo || 'Sin código' }} · {{ indicatorLabel(article.indicadorFacturacion) }}</span></div>
              <div class="product-price"><strong>{{ formatCurrency(article.precioUnitarioItem) }}</strong><small>Precio unitario</small></div>
              <button class="btn btn-sm" :class="isArticleSelected(article.id) ? 'btn-success' : 'btn-outline-primary'" type="button" @click="addArticle(article)"><i :class="isArticleSelected(article.id) ? 'bi bi-check-lg' : 'bi bi-plus-lg'" /> {{ isArticleSelected(article.id) ? 'Agregado' : 'Seleccionar' }}</button>
            </article>
          </div>
        </div>
        <div class="modal-footer"><span>{{ form.items.length }} concepto(s) en la nota</span><button class="btn btn-primary" type="button" data-bs-dismiss="modal">Terminar selección</button></div>
      </div></div>
    </div>

    <div ref="customModalElement" class="modal fade" tabindex="-1" aria-labelledby="custom-modal-title" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered"><form class="modal-content app-modal" @submit.prevent="addCustomItem">
        <div class="modal-header"><div><span class="eyebrow">Concepto puntual</span><h2 id="custom-modal-title" class="modal-title">Agregar producto personalizado</h2><p>La unidad de medida se enviará con el código 46.</p></div><button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Cerrar" /></div>
        <div class="modal-body">
          <div v-if="customError" class="alert alert-danger py-2">{{ customError }}</div>
          <div class="row g-3">
            <div class="col-12"><label class="form-label" for="custom-name">Nombre <span class="text-danger">*</span></label><input id="custom-name" ref="customNameInput" v-model="customItem.name" class="form-control" maxlength="80" required></div>
            <div class="col-md-6"><label class="form-label" for="custom-quantity">Cantidad <span class="text-danger">*</span></label><input id="custom-quantity" v-model.number="customItem.quantity" class="form-control" type="number" min="1" step="1" required></div>
            <div class="col-md-6"><label class="form-label" for="custom-price">Precio unitario <span class="text-danger">*</span></label><CommonCurrencyInput id="custom-price" v-model="customItem.price" class="form-control" :min="form.modificationCode === 2 ? 0 : 0.01" :disabled="form.modificationCode === 2" required /></div>
            <div class="col-md-6"><label class="form-label" for="custom-kind">Bien o servicio <span class="text-danger">*</span></label><select id="custom-kind" v-model.number="customItem.kind" class="form-select"><option :value="1">Bien</option><option :value="2">Servicio</option></select></div>
            <div class="col-md-6"><label class="form-label" for="custom-indicator">Indicador de facturación <span class="text-danger">*</span></label><select id="custom-indicator" v-model.number="customItem.indicator" class="form-select"><option v-for="item in billingIndicators" :key="item.id" :value="item.codigo">{{ item.codigo }} · {{ item.descripcion }}</option></select></div>
          </div>
        </div>
        <div class="modal-footer"><button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Cancelar</button><button class="btn btn-primary" type="submit">Agregar concepto</button></div>
      </form></div>
    </div>

    <div ref="reviewModalElement" class="modal fade" tabindex="-1" aria-labelledby="review-modal-title" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered"><div class="modal-content app-modal">
        <div class="modal-header"><div><span class="eyebrow">Confirmación fiscal</span><h2 id="review-modal-title" class="modal-title">Revisa antes de emitir</h2><p>La emisión consume una secuencia y no se reintentará automáticamente.</p></div><button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Cerrar" :disabled="submitting" /></div>
        <div class="modal-body review-body">
          <div><span>Comprobante afectado</span><strong>{{ source?.encf }}</strong></div><div><span>Código de modificación</span><strong>{{ selectedModification?.title }}</strong></div><div><span>Comprador</span><strong>{{ matchedClient?.razonSocialComprador || source?.buyerRnc || 'No informado' }}</strong></div><div><span>Total E34</span><strong>{{ formatCurrency(calculation?.total ?? 0) }}</strong></div>
          <div v-if="calculation && !calculation.taxCreditAllowed" class="alert alert-warning mb-0">Esta nota supera los 30 días y se enviará sin crédito de ITBIS.</div>
        </div>
        <div class="modal-footer"><button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal" :disabled="submitting">Volver</button><button class="btn btn-primary" type="button" :disabled="submitting" @click="confirmEmission"><span v-if="submitting" class="spinner-border spinner-border-sm me-1" />Emitir nota E34</button></div>
      </div></div>
    </div>

    <div ref="resultModalElement" class="modal fade" tabindex="-1" aria-labelledby="result-modal-title" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered"><div class="modal-content app-modal">
        <div class="modal-body result-body" :class="`result-${resultStatus}`">
          <span class="result-icon"><i :class="resultStatus === 'rejected' ? 'bi bi-x-lg' : 'bi bi-check-lg'" /></span>
          <span class="eyebrow">Resultado fiscal</span><h2 id="result-modal-title">{{ resultTitle }}</h2><p>{{ fiscalResult?.estadoEncf || 'La API procesó la solicitud.' }}</p>
          <dl><div><dt>e-NCF</dt><dd>{{ fiscalResult?.encf || 'No informado' }}</dd></div><div><dt>Secuencia utilizada</dt><dd>{{ fiscalResult?.secuenciaUtilizada ? 'Sí' : 'No' }}</dd></div></dl>
          <div v-if="fiscalResult?.mensajes.length" class="result-messages"><strong>Mensajes del backend</strong><ul><li v-for="message in fiscalResult.mensajes" :key="message">{{ message }}</li></ul></div>
          <div class="result-actions"><button class="btn btn-outline-secondary" type="button" @click="goToList">Ir al listado</button><button v-if="canDownloadResult" class="btn btn-primary" type="button" :disabled="downloadingResult" @click="downloadResultPdf"><span v-if="downloadingResult" class="spinner-border spinner-border-sm me-1" /><i v-else class="bi bi-file-earmark-pdf me-1" />Descargar PDF</button></div>
        </div>
      </div></div>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { Article, BillingIndicator } from '~/types/article'
import type { Client } from '~/types/client'
import type { IncomeType, PaymentType } from '~/types/billing'
import type { EcfApiResult, EcfResultStatus, FiscalDocument } from '~/types/ecf'
import { ApiError } from '~/utils/api'
import {
  buildCreditNoteRequest,
  calculateCreditNote,
  fiscalDocumentDateToIso,
  validateCreditNoteDraft,
  type CreditNoteDraft,
  type CreditNoteModificationCode,
  type CreditNoteSource,
} from '~/utils/credit-note'
import { classifyEcfResult, EcfValidationError, mapCompanyProfileToIssuer, type InvoiceDraftItem } from '~/utils/ecf'

interface BootstrapModalInstance { show: () => void, hide: () => void, dispose: () => void }
interface BootstrapModalConstructor { getOrCreateInstance: (element: HTMLElement, options?: Record<string, unknown>) => BootstrapModalInstance }
interface TemplateNotify { notify?: (content: { icon: string, title: string, message: string }, options: Record<string, unknown>) => unknown }

const SOURCE_STORAGE_KEY = 'effisort_credit_note_source'
const route = useRoute()
const auth = useAuthStore()
const { getClients } = useClientsApi()
const { getArticles } = useArticlesApi()
const { getBillingIndicators, getIncomeTypes, getPaymentTypes } = useBillingCatalogsApi()
const { searchAllDocuments } = useFiscalDocumentsApi()
const { emitInvoice: sendCreditNote, downloadPdf, submitting } = useEcfApi()

const loading = ref(true)
const loadError = ref('')
const sourceDocument = ref<FiscalDocument | null>(null)
const clients = ref<Client[]>([])
const articles = ref<Article[]>([])
const billingIndicators = ref<BillingIndicator[]>([])
const incomeTypes = ref<IncomeType[]>([])
const paymentTypes = ref<PaymentType[]>([])
const articleError = ref('')
const loadingArticles = ref(false)
const productSearch = ref('')
const downloadingOriginal = ref(false)
const downloadingResult = ref(false)
const fiscalResult = ref<EcfApiResult | null>(null)
const unknownResult = ref('')

const productModalElement = ref<HTMLElement | null>(null)
const customModalElement = ref<HTMLElement | null>(null)
const reviewModalElement = ref<HTMLElement | null>(null)
const resultModalElement = ref<HTMLElement | null>(null)
const productSearchInput = ref<HTMLInputElement | null>(null)
const customNameInput = ref<HTMLInputElement | null>(null)
let productModal: BootstrapModalInstance | null = null
let customModal: BootstrapModalInstance | null = null
let reviewModal: BootstrapModalInstance | null = null
let resultModal: BootstrapModalInstance | null = null

const modificationOptions: Array<{ code: CreditNoteModificationCode, title: string, description: string }> = [
  { code: 1, title: 'Anulación total', description: 'Revierte completamente la factura original.' },
  { code: 2, title: 'Corrección de texto', description: 'Corrige información sin modificar montos.' },
  { code: 3, title: 'Corrección de montos', description: 'Acredita total o parcialmente conceptos facturados.' },
]

const form = reactive<CreditNoteDraft>({
  source: { id: 0, encf: '', documentType: '', issueDate: '', buyerRnc: null, total: null },
  issueDate: currentDate(),
  incomeType: '',
  paymentType: 0,
  modificationCode: 3,
  reason: '',
  internalReference: '',
  notes: '',
  items: [],
})

const customItem = reactive({ name: '', quantity: 1, price: 0, kind: 1, indicator: 0 })
const customError = ref('')
const today = currentDate()
const source = computed(() => form.source.id ? form.source : null)
const issuer = computed(() => auth.profile?.empresa ? mapCompanyProfileToIssuer(auth.profile.empresa) : null)
const matchedClient = computed(() => {
  const sourceRnc = normalizeRnc(source.value?.buyerRnc)
  if (!sourceRnc) return undefined
  return clients.value.find(client => normalizeRnc(client.rncComprador) === sourceRnc)
})
const selectedModification = computed(() => modificationOptions.find(option => option.code === form.modificationCode))
const buyerPreserved = computed(() => form.source.documentType === '32' || Boolean(normalizeRnc(form.source.buyerRnc)))
const calculation = computed(() => {
  if (!source.value || !billingIndicators.value.length) return null
  try { return calculateCreditNote({ ...form, client: matchedClient.value }, billingIndicators.value) }
  catch { return null }
})
const validationErrors = computed(() => {
  if (!source.value || !issuer.value || !billingIndicators.value.length) return ['La información fiscal todavía no está completa.']
  return validateCreditNoteDraft({ ...form, client: matchedClient.value }, issuer.value, billingIndicators.value)
})
const isReady = computed(() => validationErrors.value.length === 0)
const filteredArticles = computed(() => {
  const term = productSearch.value.trim().toLocaleLowerCase('es')
  return articles.value.filter(article => !term || `${article.nombreItem} ${article.codigo ?? ''}`.toLocaleLowerCase('es').includes(term))
})
const resultStatus = computed<EcfResultStatus>(() => fiscalResult.value ? classifyEcfResult(fiscalResult.value) : 'processed')
const resultTitle = computed(() => ({ accepted: 'Nota de crédito aceptada', 'conditionally-accepted': 'Nota aceptada condicionalmente', rejected: 'Nota de crédito rechazada', processed: 'Nota de crédito procesada' })[resultStatus.value])
const canDownloadResult = computed(() => Boolean(fiscalResult.value?.encf && fiscalResult.value.secuenciaUtilizada && resultStatus.value !== 'rejected'))

watch(() => form.modificationCode, code => { if (code === 2) customItem.price = 0 })

onMounted(async () => {
  for (const element of [productModalElement.value, customModalElement.value]) {
    element?.addEventListener('shown.bs.modal', handleModalShown)
  }
  await initialize()
})

onBeforeUnmount(() => {
  for (const element of [productModalElement.value, customModalElement.value]) element?.removeEventListener('shown.bs.modal', handleModalShown)
  for (const modal of [productModal, customModal, reviewModal, resultModal]) modal?.dispose()
})

async function initialize() {
  loading.value = true
  loadError.value = ''
  try {
    if (!auth.profile) await auth.loadProfile()
    const [loadedSource, loadedClients, loadedArticles, indicators, incomes, payments] = await Promise.all([
      resolveSourceDocument(), getClients(true), getArticles(false), getBillingIndicators(), getIncomeTypes(), getPaymentTypes(),
    ])
    sourceDocument.value = loadedSource
    clients.value = loadedClients.filter(item => item.activo !== false)
    articles.value = loadedArticles.filter(item => item.activo !== false)
    billingIndicators.value = indicators.filter(item => item.activo !== false)
    incomeTypes.value = incomes.filter(item => item.activo !== false)
    paymentTypes.value = payments.filter(item => item.activo !== false)
    applySource(loadedSource)
    selectDefaults()
    restoreDraft()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'No pudimos cargar los datos necesarios.'
  } finally { loading.value = false }
}

async function resolveSourceDocument() {
  const routeId = Number(route.params.id)
  const routeEncf = typeof route.query.encf === 'string' ? route.query.encf : ''
  const stored = sessionStorage.getItem(SOURCE_STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as FiscalDocument
      if (parsed.id === routeId && (!routeEncf || parsed.encf === routeEncf) && isEligibleSource(parsed)) return parsed
    } catch { sessionStorage.removeItem(SOURCE_STORAGE_KEY) }
  }
  if (!routeEncf) throw new Error('Selecciona una factura desde el listado de notas de crédito.')
  const matches = await searchAllDocuments({ encf: routeEncf })
  const exact = matches.find(document => document.id === routeId && document.encf === routeEncf)
  if (!exact || !isEligibleSource(exact)) throw new Error('La factura indicada no está disponible o no cumple las condiciones para crear una E34.')
  return exact
}

function applySource(document: FiscalDocument) {
  const issueDate = fiscalDocumentDateToIso(document.fechaEmision)
  if (!document.encf || !issueDate) throw new Error('La factura original no contiene un e-NCF o fecha válida.')
  Object.assign(form.source, { id: document.id, encf: document.encf, documentType: document.encfTipo.replace(/^E/i, ''), issueDate, buyerRnc: document.rncComprador, total: document.montoTotal } satisfies CreditNoteSource)
  if (form.issueDate < issueDate) form.issueDate = currentDate() < issueDate ? issueDate : currentDate()
}

function selectDefaults() {
  if (!incomeTypes.value.some(item => normalizeIncomeType(item.codigo) === form.incomeType)) form.incomeType = normalizeIncomeType(incomeTypes.value.find(item => normalizeIncomeType(item.codigo) === '01')?.codigo ?? incomeTypes.value[0]?.codigo ?? '')
  if (!paymentTypes.value.some(item => item.codigo === form.paymentType)) form.paymentType = paymentTypes.value.find(item => item.codigo === 1)?.codigo ?? paymentTypes.value[0]?.codigo ?? 0
  if (!billingIndicators.value.some(item => item.codigo === customItem.indicator)) customItem.indicator = billingIndicators.value.find(item => item.codigo === 4)?.codigo ?? billingIndicators.value[0]?.codigo ?? 0
}

function draftKey() { return `effisort_credit_note_draft_${form.source.id}` }
function saveDraft() { localStorage.setItem(draftKey(), JSON.stringify(form)); showNotification('Borrador guardado', 'La nota se guardó únicamente en este navegador.', 'success') }
function saveDraftSilently() { localStorage.setItem(draftKey(), JSON.stringify(form)) }
function restoreDraft() {
  const saved = localStorage.getItem(draftKey())
  if (!saved) return
  try {
    const parsed = JSON.parse(saved) as Partial<CreditNoteDraft>
    if (parsed.source?.encf !== form.source.encf) return
    Object.assign(form, parsed, { source: form.source, items: Array.isArray(parsed.items) ? parsed.items : [] })
    showNotification('Borrador recuperado', 'Restauramos la nota guardada en este navegador.', 'info')
  } catch { showNotification('Borrador no recuperado', 'El borrador local no tenía un formato válido.', 'danger') }
}

function cancelCreditNote() { if (form.source.id) localStorage.removeItem(draftKey()); sessionStorage.removeItem(SOURCE_STORAGE_KEY); navigateTo('/admin/billing/credit-notes') }

async function reviewEmission() {
  form.items.forEach(normalizeQuantity)
  if (!issuer.value || !isReady.value) { showNotification('Nota incompleta', validationErrors.value.join(' '), 'danger'); return }
  try { buildCreditNoteRequest({ ...form, client: matchedClient.value }, issuer.value, billingIndicators.value); getModal('review')?.show() }
  catch (error) { showNotification('Nota incompleta', error instanceof EcfValidationError ? error.errors.join(' ') : error instanceof Error ? error.message : 'Revisa la información fiscal.', 'danger') }
}

async function confirmEmission() {
  if (submitting.value || !issuer.value) return
  try {
    const request = buildCreditNoteRequest({ ...form, client: matchedClient.value }, issuer.value, billingIndicators.value)
    fiscalResult.value = await sendCreditNote(request)
    reviewModal?.hide()
    const status = classifyEcfResult(fiscalResult.value)
    if ((status === 'accepted' || status === 'conditionally-accepted') && fiscalResult.value.secuenciaUtilizada) localStorage.removeItem(draftKey())
    else saveDraftSilently()
    await nextTick(); getModal('result')?.show()
  } catch (error) {
    if (error instanceof EcfValidationError) { showNotification('Nota incompleta', error.errors.join(' '), 'danger'); return }
    const apiError = error instanceof ApiError ? error : null
    if (apiError?.code === 'TIMEOUT' || apiError?.code === 'NETWORK_ERROR' || apiError?.status === 500) {
      saveDraftSilently(); unknownResult.value = 'No fue posible confirmar el resultado. Conservamos el borrador porque la secuencia pudo haberse consumido.'; reviewModal?.hide(); showNotification('Resultado desconocido', unknownResult.value, 'danger'); return
    }
    showNotification('No se pudo emitir', apiError?.message || (error instanceof Error ? error.message : 'La WebAPI rechazó la solicitud.'), 'danger')
  }
}

function openProductModal() { productSearch.value = ''; getModal('product')?.show() }
function openCustomModal() { Object.assign(customItem, { name: '', quantity: 1, price: form.modificationCode === 2 ? 0 : 0, kind: 1, indicator: billingIndicators.value.find(item => item.codigo === 4)?.codigo ?? billingIndicators.value[0]?.codigo ?? 0 }); customError.value = ''; getModal('custom')?.show() }
function handleModalShown(event: Event) { if (event.target === productModalElement.value) productSearchInput.value?.focus(); if (event.target === customModalElement.value) customNameInput.value?.focus() }

function addArticle(article: Article) {
  const existing = form.items.find(item => item.article.id === article.id)
  if (existing) existing.quantity += quantityStep(article)
  else form.items.push({ article, quantity: quantityStep(article), unitPrice: article.precioUnitarioItem })
}

function addCustomItem() {
  const name = customItem.name.trim()
  const price = form.modificationCode === 2 ? 0 : Number(customItem.price)
  if (!name || !Number.isFinite(customItem.quantity) || customItem.quantity <= 0 || !Number.isFinite(price) || price < 0 || !billingIndicators.value.some(item => item.codigo === customItem.indicator)) { customError.value = 'Completa correctamente todos los campos obligatorios.'; return }
  const article: Article = { id: `custom-${Date.now()}`, tenantId: auth.user?.tenantId ?? '', codigo: null, tipoCodigo: null, indicadorFacturacion: customItem.indicator, nombreItem: name, indicadorBienoServicio: customItem.kind, descripcionItem: null, unidadMedida: 46, precioUnitarioItem: price, existencia: 0, codigoImpuesto: null, cantidadReferencia: null, unidadReferencia: null, gradosAlcohol: null, precioUnitarioReferencia: null, activo: true }
  form.items.push({ article, quantity: Math.max(1, Math.round(customItem.quantity)), unitPrice: price })
  customModal?.hide()
}

async function downloadOriginalPdf() { if (!source.value || downloadingOriginal.value) return; downloadingOriginal.value = true; try { downloadBlob(await downloadPdf(source.value.encf), `${source.value.encf}.pdf`) } catch (error) { showNotification('PDF no disponible', error instanceof Error ? error.message : 'No pudimos descargar la factura original.', 'danger') } finally { downloadingOriginal.value = false } }
async function downloadResultPdf() { const encf = fiscalResult.value?.encf; if (!encf || downloadingResult.value) return; downloadingResult.value = true; try { downloadBlob(await downloadPdf(encf), `${encf}.pdf`) } catch (error) { showNotification('PDF no disponible', error instanceof Error ? error.message : 'No pudimos descargar la nota.', 'danger') } finally { downloadingResult.value = false } }
function goToList() {
  if (!resultModal || !resultModalElement.value) { navigateTo('/admin/billing/credit-notes'); return }
  resultModalElement.value.addEventListener('hidden.bs.modal', () => { navigateTo('/admin/billing/credit-notes') }, { once: true })
  resultModal.hide()
}

function getModal(kind: 'product' | 'custom' | 'review' | 'result') {
  const constructor = (window as unknown as { bootstrap?: { Modal?: BootstrapModalConstructor } }).bootstrap?.Modal
  const elements = { product: productModalElement.value, custom: customModalElement.value, review: reviewModalElement.value, result: resultModalElement.value }
  if (!constructor || !elements[kind]) { showNotification('Modal no disponible', 'No pudimos inicializar el componente de Bootstrap.', 'danger'); return null }
  if (kind === 'product') return productModal ??= constructor.getOrCreateInstance(elements.product!, { backdrop: true, keyboard: true, focus: true })
  if (kind === 'custom') return customModal ??= constructor.getOrCreateInstance(elements.custom!, { backdrop: true, keyboard: true, focus: true })
  if (kind === 'review') return reviewModal ??= constructor.getOrCreateInstance(elements.review!, { backdrop: 'static', keyboard: false, focus: true })
  return resultModal ??= constructor.getOrCreateInstance(elements.result!, { backdrop: 'static', keyboard: false, focus: true })
}

function isEligibleSource(document: FiscalDocument) { const type = document.encfTipo.replace(/^E/i, ''); const status = document.estadoEncf?.toLocaleLowerCase('es') ?? ''; return Boolean(document.encf && document.secuenciaUtilizada && ['31', '32'].includes(type) && status.includes('aceptado') && !status.includes('rechazado')) }
function isArticleSelected(id: string) { return form.items.some(item => item.article.id === id) }
function normalizeQuantity(item: InvoiceDraftItem) { const step = quantityStep(item.article); const value = Number(item.quantity); item.quantity = Number.isFinite(value) && value > 0 ? Math.max(step, Math.round(value / step) * step) : step }
function quantityStep(article: Article) { return article.unidadMedida === 46 ? 1 : 0.01 }
function lineBase(item: InvoiceDraftItem) { return Math.round(item.quantity * item.unitPrice * 100) / 100 }
function lineTax(item: InvoiceDraftItem) { if (!calculation.value?.taxCreditAllowed) return 0; const rate = billingIndicators.value.find(indicator => indicator.codigo === item.article.indicadorFacturacion)?.tasaItbis ?? 0; return Math.round(lineBase(item) * Number(rate) / 100 * 100) / 100 }
function lineTotal(item: InvoiceDraftItem) { return lineBase(item) + lineTax(item) }
function indicatorLabel(code: number) { const item = billingIndicators.value.find(indicator => indicator.codigo === code); return item ? `${item.descripcion} (${item.tasaItbis}%)` : `Indicador ${code}` }
function normalizeRnc(value: string | null | undefined) { return value?.replace(/[\s-]/g, '') || '' }
function normalizeIncomeType(value: string) { const normalized = String(value).trim(); return normalized.length === 1 ? normalized.padStart(2, '0') : normalized }
function currentDate() { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10) }
function formatDate(value: string) { return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)) }
function formatCurrency(value: number) { return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(value || 0) }
function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url) }
function showNotification(title: string, message: string, type: 'success' | 'danger' | 'info') { (window as unknown as { jQuery?: TemplateNotify }).jQuery?.notify?.({ icon: type === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-info-circle-fill', title, message }, { type, placement: { from: 'top', align: 'right' }, delay: 4500, z_index: 3000 }) }
</script>

<style scoped>
.credit-note-page{min-height:100vh;padding:1.5rem;background:#f4f7fb;color:#101828}.page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;margin-bottom:1.5rem}.page-header h1{margin:.35rem 0 .25rem;font-size:1.75rem;font-weight:750}.page-header p,.section-heading p,.modal-header p{margin:0;color:#667085}.breadcrumb-line{display:flex;align-items:center;gap:.45rem;color:#667085;font-size:.78rem}.breadcrumb-line a{color:inherit;text-decoration:none}.breadcrumb-line strong{color:#344054}.header-actions{display:flex;gap:.65rem}.btn{min-height:42px;border-radius:10px;font-weight:650}.state-card{display:flex;min-height:360px;align-items:center;justify-content:center;flex-direction:column;gap:.65rem;border:1px solid #e3e9f2;border-radius:16px;background:#fff;color:#667085}.state-card strong{color:#344054}.source-card{display:flex;align-items:center;gap:1rem;padding:1.15rem 1.25rem;margin-bottom:1rem;border:1px solid #c9ddfb;border-radius:16px;background:linear-gradient(135deg,#f7fbff,#fff)}.source-icon,.section-icon{display:grid;place-items:center;flex:0 0 auto}.source-icon{width:48px;height:48px;border-radius:14px;background:#eaf3ff;color:#0d6efd;font-size:1.25rem}.source-main{flex:1}.eyebrow{color:#0d6efd;font-size:.7rem;font-weight:750;letter-spacing:.04em;text-transform:uppercase}.source-main h2{margin:.15rem 0;font-size:1.05rem}.source-meta{display:flex;gap:.8rem;flex-wrap:wrap;color:#667085;font-size:.78rem}.source-total{padding-right:1rem;text-align:right}.source-total small,.source-total strong{display:block}.source-total small{color:#667085}.source-total strong{font-size:1.05rem}.editor-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:1rem;align-items:start}.editor-column{display:grid;gap:1rem}.form-card,.summary-card{padding:1.25rem;border:1px solid #e3e9f2;border-radius:16px;background:#fff}.section-heading{display:flex;align-items:center;gap:.85rem;margin-bottom:1.2rem}.section-heading h2,.summary-title h2{margin:0;font-size:1rem;font-weight:750}.section-heading p{font-size:.8rem}.section-icon{width:42px;height:42px;border-radius:12px}.section-icon.blue{color:#1570ef;background:#eff8ff}.section-icon.purple{color:#6941c6;background:#f4f3ff}.section-icon.green{color:#079455;background:#ecfdf3}.modification-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem}.modification-option{display:flex;align-items:flex-start;gap:.65rem;padding:.9rem;border:1px solid #d9e1ec;border-radius:12px;cursor:pointer}.modification-option.selected{border-color:#1570ef;box-shadow:0 0 0 2px #eaf3ff}.modification-option strong,.modification-option small{display:block}.modification-option strong{font-size:.84rem}.modification-option small{margin-top:.2rem;color:#667085;font-size:.72rem;line-height:1.35}.form-label{color:#344054;font-size:.8rem;font-weight:650}.form-control,.form-select{min-height:44px;border-color:#d5deea}.form-hint{display:flex;justify-content:space-between;margin-top:.3rem;color:#667085;font-size:.7rem}.rule-banner{display:flex;gap:.75rem;padding:.85rem;border-radius:12px;font-size:.78rem}.rule-banner i{font-size:1.1rem}.rule-banner strong,.rule-banner span{display:block}.rule-normal{color:#05603a;background:#ecfdf3}.rule-warning{color:#93370d;background:#fffaeb}.items-heading{flex-wrap:wrap}.item-actions{display:flex;gap:.5rem}.empty-items{display:flex;min-height:180px;align-items:center;justify-content:center;flex-direction:column;gap:.35rem;color:#667085;text-align:center}.empty-items i{font-size:1.8rem;color:#98a2b3}.empty-items strong{color:#344054}.item-table-shell{border:1px solid #e8edf4;border-radius:12px}.table th{padding:.7rem;background:#f8fafc;color:#667085;font-size:.68rem;text-transform:uppercase;white-space:nowrap}.table td{padding:.75rem;font-size:.78rem}.table td small{display:block;margin-top:.15rem;color:#667085}.quantity-column{width:115px}.summary-card{position:sticky;top:1rem}.summary-title{display:flex;align-items:center;gap:.7rem;margin-bottom:1rem}.summary-card dl{margin:0}.summary-card dl>div,.original-comparison{display:flex;justify-content:space-between;gap:1rem;padding:.65rem 0;border-bottom:1px solid #edf1f6}.summary-card dt{color:#667085;font-weight:500}.summary-card dd{margin:0;font-weight:700}.summary-card .summary-total{padding:1rem 0;font-size:1.03rem}.summary-total dd{color:#0d6efd;font-size:1.2rem}.original-comparison{padding:.8rem;margin:.85rem 0;border:0;border-radius:10px;background:#f8fafc;font-size:.78rem}.validation-summary>strong{font-size:.82rem}.validation-summary ul{padding:0;margin:.65rem 0;list-style:none}.validation-summary li{display:flex;align-items:center;gap:.45rem;margin:.45rem 0;color:#667085;font-size:.78rem}.validation-summary .valid i{color:#12b76a}.validation-summary .invalid i{color:#f04438}.validation-errors{padding:.75rem;margin-bottom:.8rem;border-radius:10px;background:#fef3f2;color:#912018;font-size:.72rem}.validation-errors ul{padding-left:1rem;margin:.35rem 0 0}.submit-note{display:block;margin-top:.65rem;color:#667085;text-align:center}.app-modal{overflow:hidden;border:0;border-radius:18px}.modal-header{padding:1.25rem 1.5rem;align-items:flex-start}.modal-title{margin:.15rem 0;font-size:1.15rem}.modal-body{padding:1.25rem 1.5rem}.search-box{position:relative}.search-box i{position:absolute;left:.9rem;top:50%;z-index:1;transform:translateY(-50%);color:#667085}.search-box input{padding-left:2.4rem}.modal-state{display:flex;min-height:180px;align-items:center;justify-content:center;flex-direction:column;gap:.6rem;color:#667085}.product-list{display:grid;gap:.65rem;margin-top:1rem}.product-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:1rem;padding:.85rem;border:1px solid #e3e9f2;border-radius:12px}.product-row span,.product-price small{display:block;color:#667085;font-size:.72rem}.product-price{text-align:right}.modal-footer{justify-content:space-between;padding:1rem 1.5rem}.review-body{display:grid;gap:.65rem}.review-body>div:not(.alert){display:flex;justify-content:space-between;gap:1rem;padding:.7rem;border-radius:9px;background:#f8fafc}.review-body span{color:#667085}.result-body{text-align:center}.result-icon{display:grid;width:62px;height:62px;margin:0 auto .8rem;border-radius:50%;place-items:center;font-size:1.6rem}.result-accepted .result-icon,.result-conditionally-accepted .result-icon{color:#067647;background:#ecfdf3}.result-rejected .result-icon{color:#b42318;background:#fef3f2}.result-processed .result-icon{color:#175cd3;background:#eff8ff}.result-body h2{font-size:1.35rem}.result-body dl{margin:1rem 0}.result-body dl>div{display:flex;justify-content:space-between;padding:.65rem;border-bottom:1px solid #edf1f6}.result-body dd{margin:0;font-weight:700}.result-messages{padding:.8rem;border-radius:10px;background:#f8fafc;text-align:left}.result-messages ul{margin:.4rem 0 0}.result-actions{display:flex;justify-content:center;gap:.6rem;margin-top:1rem}@media(max-width:1199.98px){.editor-layout{grid-template-columns:1fr}.summary-card{position:static}}@media(max-width:991.98px){.page-header{flex-direction:column}.header-actions{width:100%}.header-actions .btn{flex:1}.modification-grid{grid-template-columns:1fr}.source-card{align-items:flex-start;flex-wrap:wrap}.source-total{text-align:left}}@media(max-width:575.98px){.credit-note-page{padding:1rem}.header-actions,.item-actions{width:100%;flex-direction:column}.source-card>.btn{width:100%}.source-main{min-width:calc(100% - 64px)}.source-total{width:100%;padding:0}.form-card,.summary-card{padding:1rem}.product-row{grid-template-columns:1fr}.product-price{text-align:left}.product-row .btn{width:100%}.modal-header,.modal-body,.modal-footer{padding-right:1rem;padding-left:1rem}.modal-footer,.result-actions{flex-direction:column}.modal-footer .btn,.result-actions .btn{width:100%}}
</style>
