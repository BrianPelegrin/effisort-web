<script setup lang="ts">
import type { FiscalDocument } from '~/types/ecf'
import { ensureFiscalDocumentsDescending, filterFiscalDocumentsByIssueDateRange } from '~/utils/fiscal-documents'

interface TemplateNotify {
  notify?: (
    content: { icon: string, title: string, message: string },
    options: Record<string, unknown>,
  ) => unknown
}

const { searchAllDocuments } = useFiscalDocumentsApi()
const { downloadPdf } = useEcfApi()
const CREDIT_NOTE_SOURCE_KEY = 'effisort_credit_note_source'

const loading = ref(true)
const error = ref('')
const downloadingEncf = ref('')
const allDocuments = ref<FiscalDocument[]>([])
const pageNumber = ref(1)
const pageSize = 10
const totalItems = computed(() => allDocuments.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))
const firstVisibleItem = computed(() => totalItems.value ? (pageNumber.value - 1) * pageSize + 1 : 0)
const lastVisibleItem = computed(() => Math.min(pageNumber.value * pageSize, totalItems.value))
const documents = computed(() => {
  const start = (pageNumber.value - 1) * pageSize
  return allDocuments.value.slice(start, start + pageSize)
})

const filters = reactive({
  encfTipo: '',
  encf: '',
  rncComprador: '',
  fechaDesde: '',
  fechaHasta: '',
  estadoEncf: '',
})
const appliedFilters = ref({ ...filters })
const hasAppliedFilters = computed(() => Object.values(appliedFilters.value).some(Boolean))
const showAdvancedFilters = ref(false)
const advancedFilterCount = computed(() => [filters.encfTipo, filters.estadoEncf, filters.fechaDesde, filters.fechaHasta].filter(Boolean).length)
const invalidDateRange = computed(() => Boolean(filters.fechaDesde && filters.fechaHasta && filters.fechaDesde > filters.fechaHasta))
const hasPendingFilterChanges = computed(() => Object.keys(filters).some((key) => {
  const filterKey = key as keyof typeof filters
  return filters[filterKey] !== appliedFilters.value[filterKey]
}))

const acceptedCount = computed(() => allDocuments.value.filter(document => classifyStatus(document.estadoEncf) === 'accepted').length)
const rejectedCount = computed(() => allDocuments.value.filter(document => classifyStatus(document.estadoEncf) === 'rejected').length)
const pendingCount = computed(() => totalItems.value - acceptedCount.value - rejectedCount.value)

onMounted(loadDocuments)

async function loadDocuments() {
  loading.value = true
  error.value = ''
  try {
    const response = await searchAllDocuments({
      encfTipo: appliedFilters.value.encfTipo || undefined,
      encf: appliedFilters.value.encf.trim() || undefined,
      rncComprador: appliedFilters.value.rncComprador.trim() || undefined,
      estadoEncf: appliedFilters.value.estadoEncf.trim() || undefined,
    })
    allDocuments.value = filterFiscalDocumentsByIssueDateRange(
      ensureFiscalDocumentsDescending(response),
      appliedFilters.value.fechaDesde,
      appliedFilters.value.fechaHasta,
    )
    pageNumber.value = Math.min(pageNumber.value, totalPages.value)
  } catch (caughtError) {
    allDocuments.value = []
    error.value = caughtError instanceof Error
      ? caughtError.message
      : 'No pudimos consultar la bandeja fiscal.'
  } finally {
    loading.value = false
  }
}

async function applyFilters() {
  if (invalidDateRange.value) return
  appliedFilters.value = { ...filters }
  pageNumber.value = 1
  await loadDocuments()
}

async function clearFilters() {
  Object.assign(filters, { encfTipo: '', encf: '', rncComprador: '', fechaDesde: '', fechaHasta: '', estadoEncf: '' })
  appliedFilters.value = { ...filters }
  pageNumber.value = 1
  await loadDocuments()
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value || page === pageNumber.value) return
  pageNumber.value = page
}

async function downloadDocument(document: FiscalDocument) {
  if (!document.encf || downloadingEncf.value) return
  downloadingEncf.value = document.encf
  try {
    const blob = await downloadPdf(document.encf)
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `${document.encf}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  } catch (caughtError) {
    showNotification(
      'PDF no disponible',
      caughtError instanceof Error ? caughtError.message : 'No pudimos descargar el documento fiscal.',
      'danger',
    )
  } finally {
    downloadingEncf.value = ''
  }
}

function canDownload(document: FiscalDocument) {
  return Boolean(document.encf && document.secuenciaUtilizada && classifyStatus(document.estadoEncf) !== 'rejected')
}

function supportsCreditNote(document: FiscalDocument) {
  return ['31', '32'].includes(normalizeDocumentType(document.encfTipo))
}

function canIssueCreditNote(document: FiscalDocument) {
  return Boolean(
    supportsCreditNote(document)
    && document.encf
    && document.secuenciaUtilizada
    && classifyStatus(document.estadoEncf) === 'accepted',
  )
}

function creditNoteDisabledReason(document: FiscalDocument) {
  if (!document.encf) return 'No tiene un e-NCF asignado.'
  if (!document.secuenciaUtilizada) return 'La secuencia fiscal no fue utilizada.'
  if (classifyStatus(document.estadoEncf) === 'rejected') return 'La factura fue rechazada.'
  if (classifyStatus(document.estadoEncf) !== 'accepted') return 'La factura todavía no está aceptada.'
  return ''
}

function issueCreditNote(document: FiscalDocument) {
  if (!canIssueCreditNote(document) || !document.encf) return
  sessionStorage.setItem(CREDIT_NOTE_SOURCE_KEY, JSON.stringify(document))
  navigateTo({
    path: `/admin/billing/${document.id}/credit-note`,
    query: { encf: document.encf },
  })
}

function normalizeDocumentType(value: string) {
  return value.replace(/^E/i, '')
}

function classifyStatus(value: string | null) {
  const status = value?.toLocaleLowerCase('es') ?? ''
  if (status.includes('rechazado') || status.includes('no aceptado')) return 'rejected'
  if (status.includes('aceptado')) return 'accepted'
  return 'pending'
}

function statusClass(value: string | null) {
  return `status-${classifyStatus(value)}`
}

function formatMoney(value: number | null) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value ?? 0)
}

function formatDate(value: string | null) {
  if (!value) return 'No informada'
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`
  const fiscalMatch = /^(\d{2})-(\d{2})-(\d{4})/.exec(value)
  if (fiscalMatch) return `${fiscalMatch[1]}/${fiscalMatch[2]}/${fiscalMatch[3]}`
  return value
}

function showNotification(title: string, message: string, type: 'danger' | 'info') {
  const jquery = (window as unknown as { jQuery?: TemplateNotify }).jQuery
  jquery?.notify?.(
    { icon: 'bi bi-info-circle-fill', title, message },
    { type, placement: { from: 'top', align: 'right' }, delay: 4000, z_index: 2000 },
  )
}
</script>

<template>
  <main class="billing-page">
    <header class="page-header mb-3">
      <div>
        <div class="breadcrumb-line mb-2">
          <span>Facturación</span><i class="bi bi-chevron-right" aria-hidden="true" /><strong>Bandeja fiscal</strong>
        </div>
        <h1 class="page-title">Documentos fiscales</h1>
        <p class="page-subtitle">Consulta tus comprobantes, revisa su estado y descarga los documentos disponibles.</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-outline-primary effi-btn" :disabled="loading" @click="loadDocuments">
          <i class="bi bi-arrow-clockwise me-2" aria-hidden="true" />Actualizar
        </button>
        <NuxtLink to="/admin/billing/sale" class="btn btn-primary effi-btn">
          <i class="bi bi-plus-lg me-2" aria-hidden="true" />Nueva factura
        </NuxtLink>
      </div>
    </header>

    <section class="row g-2 mb-3" aria-label="Resumen de documentos encontrados">
      <div class="col-xl-3 col-6"><div class="effi-card metric-card"><span class="metric-icon metric-blue"><i class="bi bi-files" aria-hidden="true" /></span><div><span class="metric-label">Total</span><strong class="metric-value">{{ loading || error ? '—' : totalItems }}</strong></div></div></div>
      <div class="col-xl-3 col-6"><div class="effi-card metric-card"><span class="metric-icon metric-success"><i class="bi bi-check-circle" aria-hidden="true" /></span><div><span class="metric-label">Aceptados</span><strong class="metric-value">{{ loading || error ? '—' : acceptedCount }}</strong></div></div></div>
      <div class="col-xl-3 col-6"><div class="effi-card metric-card"><span class="metric-icon metric-warning"><i class="bi bi-hourglass-split" aria-hidden="true" /></span><div><span class="metric-label">Otros estados</span><strong class="metric-value">{{ loading || error ? '—' : pendingCount }}</strong></div></div></div>
      <div class="col-xl-3 col-6"><div class="effi-card metric-card"><span class="metric-icon metric-danger"><i class="bi bi-x-circle" aria-hidden="true" /></span><div><span class="metric-label">Rechazados</span><strong class="metric-value">{{ loading || error ? '—' : rejectedCount }}</strong></div></div></div>
    </section>

    <form class="effi-card filters-card mb-3" role="search" @submit.prevent="applyFilters">
      <div class="filters-heading">
        <h2>Buscar documentos</h2>
        <span v-if="hasPendingFilterChanges" class="active-filter-label">Cambios sin aplicar</span>
        <span v-else-if="hasAppliedFilters" class="active-filter-label"><i class="bi bi-funnel-fill" aria-hidden="true" />Filtros aplicados</span>
      </div>
      <div class="row g-2 align-items-end">
        <div class="col-lg-4 col-md-6">
          <label for="encf" class="form-label">e-NCF</label>
          <input id="encf" v-model.trim="filters.encf" type="search" class="form-control effi-input" placeholder="Ej. E310000000001">
        </div>
        <div class="col-lg-4 col-md-6">
          <label for="buyer-rnc" class="form-label">RNC del comprador</label>
          <input id="buyer-rnc" v-model.trim="filters.rncComprador" type="search" class="form-control effi-input" inputmode="numeric" placeholder="Ej. 131234567">
        </div>
        <div class="col-lg-4 filter-actions">
          <button class="btn btn-outline-secondary effi-btn" type="button" aria-controls="advanced-filters" :aria-expanded="showAdvancedFilters" @click="showAdvancedFilters = !showAdvancedFilters">
            <i class="bi bi-sliders me-2" aria-hidden="true" />{{ showAdvancedFilters ? 'Ocultar' : 'Filtros' }}<span v-if="advancedFilterCount"> ({{ advancedFilterCount }})</span>
          </button>
          <button class="btn btn-outline-secondary effi-btn" type="button" :disabled="loading" aria-label="Limpiar filtros" title="Limpiar filtros" @click="clearFilters"><i class="bi bi-x-lg d-sm-none" aria-hidden="true" /><span class="d-none d-sm-inline">Limpiar</span></button>
          <button class="btn btn-primary effi-btn" type="submit" :disabled="loading || invalidDateRange"><i class="bi bi-search me-2" aria-hidden="true" />Buscar</button>
        </div>
      </div>
      <div id="advanced-filters" v-show="showAdvancedFilters" class="row g-2 advanced-filters">
        <div class="col-md-6">
          <label for="document-type" class="form-label">Tipo de e-CF</label>
          <select id="document-type" v-model="filters.encfTipo" class="form-select effi-input">
            <option value="">Todos los tipos</option><option value="31">E31</option><option value="32">E32</option><option value="33">E33</option><option value="34">E34</option><option value="41">E41</option><option value="43">E43</option><option value="44">E44</option><option value="45">E45</option><option value="46">E46</option><option value="47">E47</option>
          </select>
        </div>
        <div class="col-md-6">
          <label for="fiscal-status" class="form-label">Estado fiscal</label>
          <input id="fiscal-status" v-model.trim="filters.estadoEncf" class="form-control effi-input" placeholder="Ej. Aceptado" aria-describedby="status-filter-help">
        </div>
        <div class="col-md-6">
          <label for="issue-date-from" class="form-label">Fecha desde</label>
          <input id="issue-date-from" v-model="filters.fechaDesde" type="date" class="form-control effi-input" :max="filters.fechaHasta || undefined" :aria-invalid="invalidDateRange" :aria-describedby="invalidDateRange ? 'date-range-error' : undefined">
        </div>
        <div class="col-md-6">
          <label for="issue-date-to" class="form-label">Fecha hasta</label>
          <input id="issue-date-to" v-model="filters.fechaHasta" type="date" class="form-control effi-input" :min="filters.fechaDesde || undefined" :aria-invalid="invalidDateRange" :aria-describedby="invalidDateRange ? 'date-range-error' : undefined">
        </div>
      </div>
      <small id="status-filter-help" v-show="showAdvancedFilters" class="filter-hint">El estado se busca por su nombre exacto.</small>
      <small v-if="showAdvancedFilters && invalidDateRange" id="date-range-error" class="date-range-error" role="alert">La fecha desde no puede ser posterior a la fecha hasta.</small>
    </form>

    <section class="effi-card table-card" aria-labelledby="fiscal-documents-heading">
      <div class="table-header">
        <div>
          <h2 id="fiscal-documents-heading">Bandeja fiscal</h2>
          <p aria-live="polite">
            <template v-if="loading">Cargando documentos...</template>
            <template v-else-if="error">No se pudieron mostrar los documentos.</template>
            <template v-else-if="totalItems">Mostrando {{ firstVisibleItem }}–{{ lastVisibleItem }} de {{ totalItems }} documentos.</template>
            <template v-else>No hay documentos para mostrar.</template>
          </p>
        </div>
        <span v-if="hasAppliedFilters" class="table-filter-note">Resultados de la búsqueda</span>
      </div>

      <div v-if="error" class="table-feedback">
        <div class="alert alert-danger error-state" role="alert">
          <span><i class="bi bi-exclamation-triangle me-2" aria-hidden="true" />{{ error }}</span>
          <button class="btn btn-sm btn-outline-danger" type="button" @click="loadDocuments">Reintentar</button>
        </div>
      </div>
      <div v-else-if="loading" class="state-panel" role="status">
        <span class="spinner-border text-primary" aria-hidden="true" />
        <strong>Cargando documentos fiscales...</strong>
      </div>
      <div v-else-if="!documents.length" class="state-panel">
        <span class="empty-icon"><i class="bi bi-inbox" aria-hidden="true" /></span>
        <h3>{{ hasAppliedFilters ? 'No encontramos coincidencias' : 'Aún no hay documentos fiscales' }}</h3>
        <p>{{ hasAppliedFilters ? 'Prueba con otros datos o limpia los filtros.' : 'Los comprobantes aparecerán aquí cuando emitas tu primera factura.' }}</p>
        <button v-if="hasAppliedFilters" class="btn btn-outline-primary effi-btn" type="button" @click="clearFilters">Limpiar filtros</button>
        <NuxtLink v-else to="/admin/billing/sale" class="btn btn-primary effi-btn">Crear factura</NuxtLink>
      </div>
      <template v-else>
        <div class="table-responsive paginated-table-viewport desktop-documents">
          <table class="table effi-table align-middle mb-0">
            <thead><tr><th>e-NCF</th><th>Comprador</th><th>Emisión</th><th class="text-end">Total</th><th>Estado</th><th class="text-end">Acciones</th></tr></thead>
            <tbody>
              <tr v-for="document in documents" :key="document.id">
                <td><strong class="document-number">{{ document.encf || 'Sin e-NCF' }}</strong><small>E{{ normalizeDocumentType(document.encfTipo) }} · ID {{ document.id }}</small></td>
                <td><span class="buyer-id">{{ document.rncComprador || document.idExtranjero || 'No informado' }}</span><small>{{ document.correoComprador || 'Sin correo registrado' }}</small></td>
                <td><span>{{ formatDate(document.fechaEmision) }}</span><small>Firma: {{ formatDate(document.fechaFirma) }}</small></td>
                <td class="text-end"><strong class="amount">{{ formatMoney(document.montoTotal) }}</strong></td>
                <td><span class="status-badge" :class="statusClass(document.estadoEncf)">{{ document.estadoEncf || 'Sin estado' }}</span><small>{{ document.ambienteTrabajo || 'Ambiente no informado' }}</small><small v-if="document.mensaje" class="status-message" :title="document.mensaje">{{ document.mensaje }}</small></td>
                <td>
                  <div class="document-actions">
                    <button v-if="supportsCreditNote(document)" class="btn btn-sm btn-outline-secondary" type="button" :disabled="!canIssueCreditNote(document)" :title="canIssueCreditNote(document) ? 'Emitir nota de crédito' : creditNoteDisabledReason(document)" :aria-label="`Nota de crédito para ${document.encf || 'documento sin e-NCF'}${canIssueCreditNote(document) ? '' : ': ' + creditNoteDisabledReason(document)}`" @click="issueCreditNote(document)">
                      <i class="bi bi-arrow-counterclockwise" aria-hidden="true" /><span>Nota de crédito</span>
                    </button>
                    <button class="btn btn-sm btn-outline-primary" type="button" :disabled="!canDownload(document) || Boolean(downloadingEncf)" :title="canDownload(document) ? 'Descargar PDF' : 'PDF no disponible para este documento'" :aria-label="`Descargar PDF de ${document.encf || 'documento sin e-NCF'}`" @click="downloadDocument(document)">
                      <span v-if="downloadingEncf === document.encf" class="spinner-border spinner-border-sm" aria-hidden="true" /><i v-else class="bi bi-file-earmark-pdf" aria-hidden="true" /><span>PDF</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mobile-documents">
          <article v-for="document in documents" :key="document.id" class="document-card">
            <div class="document-card-top">
              <div><strong class="document-number">{{ document.encf || 'Sin e-NCF' }}</strong><small>E{{ normalizeDocumentType(document.encfTipo) }} · ID {{ document.id }}</small></div>
              <span class="status-badge" :class="statusClass(document.estadoEncf)">{{ document.estadoEncf || 'Sin estado' }}</span>
            </div>
            <dl class="document-facts">
              <div><dt>Comprador</dt><dd>{{ document.rncComprador || document.idExtranjero || 'No informado' }}</dd></div>
              <div><dt>Emisión</dt><dd>{{ formatDate(document.fechaEmision) }}</dd></div>
              <div><dt>Ambiente</dt><dd>{{ document.ambienteTrabajo || 'No informado' }}</dd></div>
              <div><dt>Total</dt><dd class="amount">{{ formatMoney(document.montoTotal) }}</dd></div>
            </dl>
            <p v-if="document.mensaje" class="document-message">{{ document.mensaje }}</p>
            <div class="document-card-actions">
              <button v-if="supportsCreditNote(document)" class="btn btn-sm btn-outline-secondary" type="button" :disabled="!canIssueCreditNote(document)" :title="canIssueCreditNote(document) ? 'Emitir nota de crédito' : creditNoteDisabledReason(document)" @click="issueCreditNote(document)"><i class="bi bi-arrow-counterclockwise me-2" aria-hidden="true" />Nota de crédito</button>
              <button class="btn btn-sm btn-outline-primary" type="button" :disabled="!canDownload(document) || Boolean(downloadingEncf)" @click="downloadDocument(document)"><span v-if="downloadingEncf === document.encf" class="spinner-border spinner-border-sm me-2" aria-hidden="true" /><i v-else class="bi bi-file-earmark-pdf me-2" aria-hidden="true" />Descargar PDF</button>
            </div>
            <small v-if="supportsCreditNote(document) && !canIssueCreditNote(document)" class="action-reason">{{ creditNoteDisabledReason(document) }}</small>
          </article>
        </div>

        <div class="pagination-shell"><CommonPaginationControls :current-page="pageNumber" :total-pages="totalPages" aria-label="Paginación fiscal" @change="changePage" /></div>
      </template>
    </section>
  </main>
</template>

<style scoped>
.billing-page {
  min-width: 0;
  color: #101828;
}

.page-header,
.header-actions,
.table-header,
.filters-heading,
.filter-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.page-header,
.filters-heading {
  align-items: flex-start;
}

.breadcrumb-line {
  display: flex;
  align-items: center;
  gap: .5rem;
  color: #667085;
  font-size: .84rem;
}

.breadcrumb-line i {
  color: #98a2b3;
  font-size: .7rem;
}

.page-title {
  margin: 0 0 .35rem;
  color: #101828;
  font-size: 1.8rem;
  font-weight: 700;
}

.page-subtitle,
.filters-heading p,
.table-header p {
  margin: 0;
  color: #667085;
}

.effi-card {
  min-width: 0;
  padding: 1.35rem;
  border: 1px solid #e5eaf2;
  border-radius: 16px;
  background: #fff;
}

.effi-btn {
  min-height: 40px;
  border-radius: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.metric-card {
  display: flex;
  min-height: 76px;
  align-items: center;
  gap: .7rem;
  padding: .7rem .9rem;
}

.metric-icon {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  font-size: 1.05rem;
}

.metric-blue { color: #0d6efd; background: #eef5ff; }
.metric-success { color: #16a34a; background: #eaf8ee; }
.metric-warning { color: #a66a00; background: #fff8df; }
.metric-danger { color: #dc3545; background: #fff0f1; }

.metric-label {
  display: block;
  color: #667085;
  font-size: .8rem;
}

.metric-value {
  display: block;
  margin-top: .05rem;
  font-size: 1.15rem;
  line-height: 1.2;
}

.filters-card {
  padding: .85rem 1rem;
}

.filters-heading {
  margin-bottom: .55rem;
}

.filters-heading h2,
.table-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.filters-heading p,
.table-header p {
  font-size: .84rem;
}

.active-filter-label,
.table-filter-note {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  color: #175cd3;
  font-size: .76rem;
  font-weight: 700;
  white-space: nowrap;
}

.active-filter-label {
  padding: .35rem .6rem;
  border-radius: 999px;
  background: #eff8ff;
}

.filters-card .form-label {
  margin-bottom: .25rem;
  color: #344054;
  font-size: .8rem;
  font-weight: 600;
}

.effi-input {
  min-height: 40px;
  border-color: #d9e1ec;
  border-radius: 9px;
}

.filter-actions {
  justify-content: flex-end;
  gap: .4rem;
}

.filter-actions .btn {
  padding-right: .7rem;
  padding-left: .7rem;
}

.advanced-filters {
  margin-top: .3rem;
}

.filter-hint {
  display: block;
  margin-top: .35rem;
  color: #667085;
  font-size: .73rem;
}

.date-range-error {
  display: block;
  margin-top: .35rem;
  color: #b42318;
  font-size: .76rem;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.table-header {
  padding: 1.35rem;
  border-bottom: 1px solid #edf0f5;
}

.effi-table th {
  padding: .8rem 1rem;
  border-bottom: 1px solid #e5eaf2;
  background: #f8fafc;
  color: #667085;
  font-size: .74rem;
  font-weight: 700;
  white-space: nowrap;
}

.effi-table td {
  padding: .9rem 1rem;
  border-color: #edf0f5;
  color: #344054;
  font-size: .82rem;
}

.effi-table td strong,
.effi-table td small {
  display: block;
}

.effi-table td small,
.document-card small {
  margin-top: .2rem;
  color: #667085;
  font-size: .73rem;
}

.document-number {
  color: #101828;
  white-space: nowrap;
}

.buyer-id,
.amount {
  font-weight: 700;
}

.amount {
  color: #101828;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  width: fit-content;
  padding: .38rem .65rem;
  border-radius: 8px;
  font-size: .72rem;
  font-weight: 700;
}

.status-accepted { color: #15803d; background: #eaf8ee; }
.status-rejected { color: #b02a37; background: #fff0f1; }
.status-pending { color: #8a6500; background: #fff8df; }

.status-message {
  max-width: 230px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-actions {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: .4rem;
}

.document-actions .btn {
  display: inline-flex;
  min-width: 120px;
  align-items: center;
  justify-content: center;
  gap: .35rem;
  white-space: nowrap;
}

.table-feedback {
  padding: 1.35rem;
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0;
}

.state-panel {
  display: flex;
  min-height: 280px;
  padding: 2rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .8rem;
  color: #667085;
  text-align: center;
}

.state-panel h3 {
  margin: 0;
  color: #344054;
  font-size: 1.05rem;
}

.state-panel p {
  margin: 0;
}

.empty-icon {
  display: inline-flex;
  width: 54px;
  height: 54px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: #eef5ff;
  color: #0d6efd;
  font-size: 1.4rem;
}

.pagination-shell {
  padding: 0 1.35rem 1.35rem;
}

.mobile-documents {
  display: none;
}

@media (max-width: 1399.98px) {
  .desktop-documents { display: none; }
  .mobile-documents { display: block; }

  .document-card {
    padding: 1.1rem 1.35rem;
    border-bottom: 1px solid #edf0f5;
  }

  .document-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: .75rem;
  }

  .document-card-top > div {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  .document-card-top .document-number {
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .document-facts {
    display: grid;
    margin: 1rem 0;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .8rem 1rem;
  }

  .document-facts div { min-width: 0; }
  .document-facts dt { color: #667085; font-size: .72rem; font-weight: 500; }
  .document-facts dd { margin: .15rem 0 0; overflow-wrap: anywhere; color: #344054; font-size: .84rem; font-weight: 600; }
  .document-message { margin: 0 0 .8rem; color: #667085; font-size: .78rem; }
  .document-card-actions { display: flex; flex-wrap: wrap; gap: .55rem; }
  .document-card-actions .btn { min-height: 38px; }
  .action-reason { display: block; margin-top: .55rem; }
}

@media (max-width: 767.98px) {
  .page-header { align-items: flex-start; flex-direction: column; }
  .header-actions { width: 100%; }
  .header-actions .btn { flex: 1; }
  .filters-heading { flex-wrap: wrap; }
  .filter-actions { justify-content: flex-start; }
}

@media (max-width: 575.98px) {
  .metric-card { min-height: 64px; padding: .55rem .65rem; gap: .5rem; }
  .metric-icon { width: 30px; height: 30px; flex-basis: 30px; font-size: .85rem; }
  .metric-label { font-size: .72rem; }
  .metric-value { font-size: 1rem; }
  .filter-actions .btn:first-child { flex: 1; }
  .table-header { align-items: flex-start; flex-direction: column; }
  .document-card { padding: 1rem; }
  .document-card-top { flex-direction: column; }
  .document-card-actions .btn { flex: 1 1 100%; }
  .pagination-shell { padding: 0 1rem 1rem; }
  .error-state { align-items: flex-start; flex-direction: column; }
}
</style>
