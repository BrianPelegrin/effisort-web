<script setup lang="ts">
import type { FiscalDocument } from '~/types/ecf'
import { ensureFiscalDocumentsDescending } from '~/utils/fiscal-documents'

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
const documents = computed(() => {
  const start = (pageNumber.value - 1) * pageSize
  return allDocuments.value.slice(start, start + pageSize)
})

const filters = reactive({
  encfTipo: '',
  encf: '',
  rncComprador: '',
  fechaEmision: '',
  estadoEncf: '',
})

const acceptedOnPage = computed(() => documents.value.filter(document => classifyStatus(document.estadoEncf) === 'accepted').length)
const rejectedOnPage = computed(() => documents.value.filter(document => classifyStatus(document.estadoEncf) === 'rejected').length)
const pendingOnPage = computed(() => documents.value.length - acceptedOnPage.value - rejectedOnPage.value)

onMounted(loadDocuments)

async function loadDocuments() {
  loading.value = true
  error.value = ''
  try {
    const response = await searchAllDocuments({
      encfTipo: filters.encfTipo || undefined,
      encf: filters.encf.trim() || undefined,
      rncComprador: filters.rncComprador.trim() || undefined,
      fechaEmision: filters.fechaEmision || undefined,
      estadoEncf: filters.estadoEncf.trim() || undefined,
    })
    allDocuments.value = ensureFiscalDocumentsDescending(response)
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
  pageNumber.value = 1
  await loadDocuments()
}

async function clearFilters() {
  Object.assign(filters, { encfTipo: '', encf: '', rncComprador: '', fechaEmision: '', estadoEncf: '' })
  pageNumber.value = 1
  await loadDocuments()
}

async function changePage(page: number) {
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
    <header class="page-header mb-4">
      <div>
        <div class="breadcrumb-line mb-2">
          <span>Facturación</span><i class="bi bi-chevron-right" aria-hidden="true" /><strong>Bandeja fiscal</strong>
        </div>
        <h1 class="page-title">Documentos fiscales</h1>
        <p class="page-subtitle">Consulta los e-CF registrados por la WebAPI para el tenant de tu sesión.</p>
      </div>
      <NuxtLink to="/admin/billing/sale" class="btn btn-primary effi-btn-primary">
        <i class="bi bi-plus-lg me-2" aria-hidden="true" />Nueva factura
      </NuxtLink>
    </header>

    <section class="row g-3 mb-4" aria-label="Resumen de la página actual">
      <div class="col-xl-3 col-md-6"><div class="effi-card metric-card"><i class="bi bi-files metric-icon metric-blue" /><div><span>Total encontrado</span><strong>{{ totalItems }}</strong></div></div></div>
      <div class="col-xl-3 col-md-6"><div class="effi-card metric-card"><i class="bi bi-check-circle metric-icon metric-success" /><div><span>Aceptados en página</span><strong>{{ acceptedOnPage }}</strong></div></div></div>
      <div class="col-xl-3 col-md-6"><div class="effi-card metric-card"><i class="bi bi-hourglass-split metric-icon metric-warning" /><div><span>Otros estados en página</span><strong>{{ pendingOnPage }}</strong></div></div></div>
      <div class="col-xl-3 col-md-6"><div class="effi-card metric-card"><i class="bi bi-x-circle metric-icon metric-danger" /><div><span>Rechazados en página</span><strong>{{ rejectedOnPage }}</strong></div></div></div>
    </section>

    <form class="effi-card filters-card mb-4" @submit.prevent="applyFilters">
      <div class="row g-3 align-items-end">
        <div class="col-xl-2 col-md-6">
          <label for="document-type" class="form-label">Tipo e-CF</label>
          <select id="document-type" v-model="filters.encfTipo" class="form-select effi-input">
            <option value="">Todos</option><option value="31">E31</option><option value="32">E32</option><option value="33">E33</option><option value="34">E34</option><option value="41">E41</option><option value="43">E43</option><option value="44">E44</option><option value="45">E45</option><option value="46">E46</option><option value="47">E47</option>
          </select>
        </div>
        <div class="col-xl-2 col-md-6">
          <label for="encf" class="form-label">e-NCF</label>
          <input id="encf" v-model.trim="filters.encf" class="form-control effi-input" placeholder="E310000000001">
        </div>
        <div class="col-xl-2 col-md-6">
          <label for="buyer-rnc" class="form-label">RNC comprador</label>
          <input id="buyer-rnc" v-model.trim="filters.rncComprador" class="form-control effi-input" placeholder="Ej. 131234567">
        </div>
        <div class="col-xl-2 col-md-6">
          <label for="fiscal-status" class="form-label">Estado exacto</label>
          <input id="fiscal-status" v-model.trim="filters.estadoEncf" class="form-control effi-input" placeholder="Aceptado">
        </div>
        <div class="col-xl-2 col-md-6">
          <label for="issue-date" class="form-label">Fecha emisión</label>
          <input id="issue-date" v-model="filters.fechaEmision" type="date" class="form-control effi-input">
        </div>
        <div class="col-xl-2 d-flex gap-2">
          <button class="btn btn-primary flex-grow-1" type="submit" :disabled="loading">Buscar</button>
          <button class="btn btn-outline-secondary" type="button" :disabled="loading" title="Limpiar filtros" @click="clearFilters"><i class="bi bi-x-lg" /></button>
        </div>
      </div>
    </form>

    <section class="effi-card" aria-labelledby="fiscal-documents-heading">
      <div class="table-header mb-3">
        <div><h2 id="fiscal-documents-heading">Bandeja fiscal</h2><p>{{ totalItems }} documentos encontrados.</p></div>
        <button class="btn btn-light" type="button" :disabled="loading" @click="loadDocuments"><i class="bi bi-arrow-clockwise me-2" />Actualizar</button>
      </div>

      <div v-if="error" class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
        <span>{{ error }}</span><button class="btn btn-sm btn-outline-danger" type="button" @click="loadDocuments">Reintentar</button>
      </div>
      <div v-else-if="loading" class="state-panel"><span class="spinner-border text-primary" aria-hidden="true" /><strong>Cargando documentos fiscales…</strong></div>
      <div v-else-if="!documents.length" class="state-panel"><i class="bi bi-inbox" /><strong>No hay documentos con estos filtros</strong><span>Prueba con otros criterios o emite una nueva factura.</span></div>
      <div v-else class="table-responsive paginated-table-viewport">
        <table class="table effi-table align-middle mb-0">
          <thead><tr><th>e-NCF</th><th>Comprador</th><th>Emisión</th><th class="text-end">Total</th><th>Estado</th><th>Ambiente</th><th class="text-end">Acción</th></tr></thead>
          <tbody>
            <tr v-for="document in documents" :key="document.id">
              <td><strong>{{ document.encf || 'Sin e-NCF' }}</strong><small>E{{ normalizeDocumentType(document.encfTipo) }} · ID {{ document.id }}</small></td>
              <td><span>{{ document.rncComprador || document.idExtranjero || 'No informado' }}</span><small>{{ document.correoComprador || 'Sin correo' }}</small></td>
              <td><span>{{ formatDate(document.fechaEmision) }}</span><small>Firma: {{ formatDate(document.fechaFirma) }}</small></td>
              <td class="text-end fw-semibold">{{ formatMoney(document.montoTotal) }}</td>
              <td><span class="status-badge" :class="statusClass(document.estadoEncf)">{{ document.estadoEncf || 'Sin estado' }}</span><small v-if="document.mensaje">{{ document.mensaje }}</small></td>
              <td>{{ document.ambienteTrabajo || 'No informado' }}</td>
              <td class="text-end">
                <div class="document-actions">
                  <div v-if="supportsCreditNote(document)" class="credit-note-action">
                    <button class="btn btn-sm btn-outline-warning" type="button" :disabled="!canIssueCreditNote(document)" :title="canIssueCreditNote(document) ? 'Emitir nota de crédito' : creditNoteDisabledReason(document)" @click="issueCreditNote(document)">
                      <i class="bi bi-arrow-counterclockwise" aria-hidden="true" /><span>Nota de crédito</span>
                    </button>
                    <small v-if="!canIssueCreditNote(document)" class="credit-note-disabled-message">
                      <i class="bi bi-info-circle" aria-hidden="true" />{{ creditNoteDisabledReason(document) }}
                    </small>
                  </div>
                  <button class="btn btn-sm btn-outline-primary" type="button" :disabled="!canDownload(document) || Boolean(downloadingEncf)" @click="downloadDocument(document)">
                    <span v-if="downloadingEncf === document.encf" class="spinner-border spinner-border-sm" /><i v-else class="bi bi-file-earmark-pdf" /><span>PDF</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <CommonPaginationControls v-if="!loading && !error && documents.length" :current-page="pageNumber" :total-pages="totalPages" aria-label="Paginación fiscal" @change="changePage" />
    </section>
  </main>
</template>

<style scoped>
.billing-page{min-height:100vh;padding:1.5rem;background:#f5f7fb;color:#101828}.page-header,.table-header,.pagination-wrap{display:flex;align-items:center;justify-content:space-between;gap:1rem}.breadcrumb-line{display:flex;align-items:center;gap:.5rem;color:#667085;font-size:.84rem}.breadcrumb-line i{font-size:.68rem}.page-title{margin:0 0 .35rem;font-size:1.8rem;font-weight:700}.page-subtitle,.table-header p{margin:0;color:#667085}.effi-card{padding:1.3rem;border:1px solid #e5eaf2;border-radius:16px;background:#fff}.effi-btn-primary,.effi-input{min-height:44px;border-radius:10px}.metric-card{display:flex;align-items:center;gap:1rem}.metric-card div{display:flex;flex-direction:column}.metric-card span{color:#667085;font-size:.8rem}.metric-card strong{font-size:1.5rem}.metric-icon{display:grid;width:42px;height:42px;border-radius:12px;font-size:1.1rem;place-items:center}.metric-blue{color:#0d6efd;background:#eef5ff}.metric-success{color:#198754;background:#eaf8ee}.metric-warning{color:#b58105;background:#fff8df}.metric-danger{color:#dc3545;background:#fff0f1}.table-header h2{margin:0 0 .2rem;font-size:1rem}.effi-table th{color:#667085;font-size:.76rem;font-weight:700;white-space:nowrap}.effi-table td{vertical-align:middle}.effi-table td small{display:block;max-width:280px;margin-top:.2rem;color:#667085;font-size:.72rem}.status-badge{display:inline-flex;padding:.32rem .62rem;border-radius:999px;font-size:.73rem;font-weight:700}.status-accepted{color:#157347;background:#eaf8ee}.status-rejected{color:#b02a37;background:#fff0f1}.status-pending{color:#8a6500;background:#fff8df}.document-actions{display:flex;align-items:flex-start;justify-content:flex-end;gap:.45rem;white-space:nowrap}.document-actions .btn{display:inline-flex;align-items:center;gap:.4rem}.credit-note-action{display:flex;max-width:190px;align-items:flex-end;flex-direction:column}.credit-note-disabled-message{display:flex!important;align-items:flex-start;gap:.3rem;margin-top:.35rem!important;color:#8a6500!important;line-height:1.25;text-align:left;white-space:normal}.credit-note-disabled-message i{margin-top:.05rem;flex:0 0 auto}.state-panel{display:flex;min-height:220px;flex-direction:column;align-items:center;justify-content:center;gap:.65rem;color:#667085;text-align:center}.state-panel>i{font-size:2.5rem;color:#98a2b3}.pagination-wrap{margin-top:1.25rem}.pagination-wrap span{color:#667085;font-size:.84rem}@media(max-width:767.98px){.billing-page{padding:1rem}.page-header,.table-header{align-items:stretch;flex-direction:column}.page-header>a{width:100%;text-align:center}.pagination-wrap{gap:.5rem}}
</style>
