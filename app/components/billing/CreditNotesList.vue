<template>
  <main class="credit-notes-page admin-list-compact">
    <header class="page-header">
      <div>
        <div class="breadcrumb-line"><span>Facturación</span><i class="bi bi-chevron-right" /><strong>Notas de crédito</strong></div>
        <h1>Notas de crédito</h1>
        <p>Consulta las E34 emitidas y crea una nueva desde una factura fiscal existente.</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-outline-primary" :disabled="loading" @click="loadCreditNotes">
          <i class="bi bi-arrow-clockwise me-2" />Actualizar
        </button>
        <button ref="newNoteButton" type="button" class="btn btn-primary" @click="openSourceModal">
          <i class="bi bi-file-earmark-minus me-2" /><span class="d-none d-sm-inline">Nueva nota de crédito</span><span class="d-sm-none">Nueva nota</span>
        </button>
      </div>
    </header>

    <section class="metrics-grid" aria-label="Resumen de notas de crédito">
      <article class="metric-card"><span class="metric-icon blue"><i class="bi bi-file-earmark-minus" /></span><div><small>Notas</small><strong>{{ filteredNotes.length }}</strong></div></article>
      <article class="metric-card"><span class="metric-icon green"><i class="bi bi-check-circle" /></span><div><small>Aceptadas</small><strong>{{ acceptedCount }}</strong></div></article>
      <article class="metric-card"><span class="metric-icon purple"><i class="bi bi-cash-stack" /></span><div><small>Total acreditado</small><strong>{{ formatCurrency(creditedAmount) }}</strong></div></article>
    </section>

    <section class="filter-card">
      <div class="compact-filter-row">
        <div class="compact-search-field">
          <label for="credit-note-search" class="form-label">Buscar nota</label>
          <div class="input-group"><span class="input-group-text"><i class="bi bi-search" /></span><input id="credit-note-search" v-model="filters.search" type="search" class="form-control" placeholder="E34, RNC o mensaje fiscal"></div>
        </div>
        <button type="button" class="btn btn-outline-secondary compact-filters-toggle" aria-controls="credit-note-extra-filters" :aria-expanded="showExtraFilters" @click="showExtraFilters = !showExtraFilters"><i class="bi bi-sliders me-2" aria-hidden="true" />{{ showExtraFilters ? 'Ocultar' : 'Filtros' }}<span v-if="activeExtraFilterCount"> ({{ activeExtraFilterCount }})</span></button>
        <button v-if="filters.search || filters.status || filters.fromDate" type="button" class="btn btn-outline-secondary compact-clear-button" aria-label="Limpiar filtros" title="Limpiar filtros" @click="clearFilters"><i class="bi bi-x-lg" aria-hidden="true" /></button>
      </div>
      <div id="credit-note-extra-filters" v-show="showExtraFilters" class="compact-extra-filters">
        <div class="row g-2">
          <div class="col-md-6">
            <label for="credit-note-status" class="form-label">Estado</label>
            <select id="credit-note-status" v-model="filters.status" class="form-select"><option value="">Todos</option><option value="accepted">Aceptadas</option><option value="rejected">Rechazadas</option><option value="pending">En proceso</option></select>
          </div>
          <div class="col-md-6"><label for="credit-note-from" class="form-label">Desde</label><input id="credit-note-from" v-model="filters.fromDate" type="date" class="form-control"></div>
        </div>
      </div>
    </section>

    <section class="list-card">
      <div class="list-heading"><div><h2>Listado de E34</h2><p>Mostrando {{ firstVisibleItem }}–{{ lastVisibleItem }} de {{ filteredNotes.length }} registros.</p></div></div>

      <div v-if="error" class="alert alert-danger m-3" role="alert">{{ error }}</div>
      <div v-if="loading" class="loading-state"><span class="spinner-border text-primary" /><span>Cargando notas de crédito...</span></div>
      <div v-else class="table-responsive table-shell">
        <table class="table align-middle mb-0">
          <thead><tr><th>e-NCF</th><th>Comprador</th><th>Fecha</th><th class="text-end">Monto</th><th>Estado</th><th class="text-end">Acción</th></tr></thead>
          <tbody>
            <tr v-for="note in paginatedNotes" :key="note.id">
              <td><strong>{{ note.encf || 'Sin secuencia' }}</strong><small>#{{ note.id }}</small></td>
              <td><span>{{ note.rncComprador || note.idExtranjero || 'No identificado' }}</span><small>{{ note.correoComprador || 'Sin correo' }}</small></td>
              <td>{{ formatDate(note.fechaEmision) }}</td>
              <td class="text-end fw-semibold">{{ formatCurrency(note.montoTotal) }}</td>
              <td><span class="status-badge" :class="`status-${classifyStatus(note.estadoEncf)}`">{{ note.estadoEncf || 'En proceso' }}</span></td>
              <td class="text-end"><button type="button" class="btn btn-sm btn-outline-primary" :disabled="!canDownload(note) || downloadingEncf === note.encf" title="Descargar PDF" @click="downloadDocument(note)"><span v-if="downloadingEncf === note.encf" class="spinner-border spinner-border-sm" /><i v-else class="bi bi-download" /><span class="visually-hidden">Descargar PDF</span></button></td>
            </tr>
            <tr v-if="!paginatedNotes.length"><td colspan="6"><div class="empty-state"><i class="bi bi-file-earmark-minus" /><strong>No encontramos notas de crédito</strong><span>Crea una nueva E34 o ajusta los filtros.</span></div></td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredNotes.length" class="pagination-wrap"><CommonPaginationControls :current-page="currentPage" :total-pages="totalPages" aria-label="Paginación de notas de crédito" @change="goToPage" /></div>
    </section>

    <Teleport to="body">
      <div id="credit-note-source-modal" ref="sourceModalElement" class="modal fade" tabindex="-1" aria-labelledby="source-modal-title" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content source-modal">
            <div class="modal-header"><div><span class="eyebrow">Factura afectada</span><h2 id="source-modal-title">Seleccionar factura original</h2><p>Solo se muestran E31 y E32 con secuencia utilizada y estado aceptado.</p></div><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar" /></div>
            <div class="modal-body">
              <div class="alert alert-warning py-2" role="note"><i class="bi bi-exclamation-triangle me-1" /> La búsqueda del backend no informa si una factura ya fue afectada por otra nota. Confirma esa condición antes de seleccionarla.</div>
              <div class="source-search"><i class="bi bi-search" /><input ref="sourceSearchInput" v-model="sourceSearch" type="search" class="form-control" placeholder="Buscar por e-NCF o RNC del comprador"></div>
              <div v-if="sourceError" class="alert alert-danger mt-3">{{ sourceError }}</div>
              <div v-if="loadingSources" class="loading-state"><span class="spinner-border text-primary" /><span>Cargando facturas elegibles...</span></div>
              <div v-else class="table-responsive source-table">
                <table class="table align-middle mb-0"><thead><tr><th>Factura</th><th>Comprador</th><th>Fecha</th><th class="text-end">Total</th><th class="text-end">Acción</th></tr></thead><tbody>
                  <tr v-for="source in filteredSources" :key="source.id"><td><strong>{{ source.encf }}</strong><small>{{ normalizeDocumentType(source.encfTipo) === '31' ? 'Crédito fiscal' : 'Consumidor final' }}</small></td><td>{{ source.rncComprador || source.idExtranjero || 'No identificado' }}</td><td>{{ formatDate(source.fechaEmision) }}</td><td class="text-end fw-semibold">{{ formatCurrency(source.montoTotal) }}</td><td class="text-end"><button type="button" class="btn btn-sm btn-primary" @click="selectSource(source)">Seleccionar</button></td></tr>
                  <tr v-if="!filteredSources.length"><td colspan="5"><div class="empty-state compact"><strong>No hay facturas elegibles</strong><span>Prueba con otro criterio de búsqueda.</span></div></td></tr>
                </tbody></table>
              </div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button></div>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
import type { FiscalDocument } from '~/types/ecf'
import { ensureFiscalDocumentsDescending } from '~/utils/fiscal-documents'

interface BootstrapModalInstance { show: () => void, hide: () => void, dispose: () => void }
interface BootstrapModalConstructor { getOrCreateInstance: (element: HTMLElement, options?: Record<string, unknown>) => BootstrapModalInstance }
interface TemplateNotify { notify?: (content: { icon: string, title: string, message: string }, options: Record<string, unknown>) => unknown }

const SOURCE_STORAGE_KEY = 'effisort_credit_note_source'
const PAGE_SIZE = 10
const { searchAllDocuments } = useFiscalDocumentsApi()
const { downloadPdf } = useEcfApi()
const notes = ref<FiscalDocument[]>([])
const sources = ref<FiscalDocument[]>([])
const loading = ref(true)
const loadingSources = ref(false)
const error = ref('')
const sourceError = ref('')
const downloadingEncf = ref('')
const currentPage = ref(1)
const sourceSearch = ref('')
const sourceSearchInput = ref<HTMLInputElement | null>(null)
const newNoteButton = ref<HTMLButtonElement | null>(null)
const sourceModalElement = ref<HTMLElement | null>(null)
let sourceModalInstance: BootstrapModalInstance | null = null
const filters = reactive({ search: '', status: '', fromDate: '' })
const showExtraFilters = ref(false)
const activeExtraFilterCount = computed(() => [filters.status, filters.fromDate].filter(Boolean).length)

const filteredNotes = computed(() => {
  const search = filters.search.trim().toLocaleLowerCase('es')
  return notes.value.filter(note => {
    const matchesSearch = !search || [note.encf, note.rncComprador, note.idExtranjero, note.mensaje].some(value => value?.toLocaleLowerCase('es').includes(search))
    const matchesStatus = !filters.status || classifyStatus(note.estadoEncf) === filters.status
    const isoDate = fiscalDateToIso(note.fechaEmision)
    return matchesSearch && matchesStatus && (!filters.fromDate || Boolean(isoDate && isoDate >= filters.fromDate))
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredNotes.value.length / PAGE_SIZE)))
const paginatedNotes = computed(() => filteredNotes.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE))
const firstVisibleItem = computed(() => filteredNotes.value.length ? (currentPage.value - 1) * PAGE_SIZE + 1 : 0)
const lastVisibleItem = computed(() => Math.min(currentPage.value * PAGE_SIZE, filteredNotes.value.length))
const acceptedCount = computed(() => filteredNotes.value.filter(note => classifyStatus(note.estadoEncf) === 'accepted').length)
const creditedAmount = computed(() => filteredNotes.value.filter(note => classifyStatus(note.estadoEncf) !== 'rejected').reduce((sum, note) => sum + Number(note.montoTotal || 0), 0))
const filteredSources = computed(() => {
  const search = sourceSearch.value.trim().toLocaleLowerCase('es')
  return sources.value.filter(source => !search || [source.encf, source.rncComprador, source.idExtranjero].some(value => value?.toLocaleLowerCase('es').includes(search)))
})

watch(filters, () => { currentPage.value = 1 }, { deep: true })
watch(totalPages, pages => { if (currentPage.value > pages) currentPage.value = pages })

onMounted(() => {
  sourceModalElement.value?.addEventListener('shown.bs.modal', handleSourceModalShown)
  sourceModalElement.value?.addEventListener('hidden.bs.modal', handleSourceModalHidden)
  loadCreditNotes()
})
onBeforeUnmount(() => {
  sourceModalElement.value?.removeEventListener('shown.bs.modal', handleSourceModalShown)
  sourceModalElement.value?.removeEventListener('hidden.bs.modal', handleSourceModalHidden)
  sourceModalInstance?.dispose()
})

async function loadCreditNotes() {
  loading.value = true
  error.value = ''
  try { notes.value = ensureFiscalDocumentsDescending(await searchAllDocuments({ encfTipo: '34' })) }
  catch (caught) { notes.value = []; error.value = caught instanceof Error ? caught.message : 'No pudimos cargar las notas de crédito.' }
  finally { loading.value = false }
}

async function openSourceModal() {
  sourceSearch.value = ''
  sourceError.value = ''
  await nextTick()
  const modal = getSourceModal()
  if (!modal) { showNotification('Modal no disponible', 'No pudimos abrir el selector de facturas.', 'danger'); return }
  modal.show()
  if (!sources.value.length) await loadSources()
}

async function loadSources() {
  loadingSources.value = true
  try {
    const [e31, e32] = await Promise.all([searchAllDocuments({ encfTipo: '31' }), searchAllDocuments({ encfTipo: '32' })])
    sources.value = ensureFiscalDocumentsDescending([...e31, ...e32]).filter(isEligibleSource)
  } catch (caught) { sourceError.value = caught instanceof Error ? caught.message : 'No pudimos cargar las facturas disponibles.' }
  finally { loadingSources.value = false }
}

function selectSource(source: FiscalDocument) {
  sessionStorage.setItem(SOURCE_STORAGE_KEY, JSON.stringify(source))
  const destination = { path: `/admin/billing/${source.id}/credit-note`, query: { encf: source.encf || '' } }
  if (!sourceModalInstance || !sourceModalElement.value) { navigateTo(destination); return }
  sourceModalElement.value.addEventListener('hidden.bs.modal', () => { navigateTo(destination) }, { once: true })
  sourceModalInstance.hide()
}

async function downloadDocument(note: FiscalDocument) {
  if (!note.encf || downloadingEncf.value) return
  downloadingEncf.value = note.encf
  try { downloadBlob(await downloadPdf(note.encf), `${note.encf}.pdf`) }
  catch (caught) { showNotification('PDF no disponible', caught instanceof Error ? caught.message : 'No pudimos descargar el PDF.', 'danger') }
  finally { downloadingEncf.value = '' }
}

function getSourceModal() {
  if (sourceModalInstance) return sourceModalInstance
  const constructor = (window as unknown as { bootstrap?: { Modal?: BootstrapModalConstructor } }).bootstrap?.Modal
  if (!constructor || !sourceModalElement.value) return null
  sourceModalInstance = constructor.getOrCreateInstance(sourceModalElement.value, { backdrop: true, keyboard: true, focus: true })
  return sourceModalInstance
}
function handleSourceModalShown() { sourceSearchInput.value?.focus() }
function handleSourceModalHidden() { newNoteButton.value?.focus() }
function isEligibleSource(document: FiscalDocument) { return Boolean(document.encf && document.secuenciaUtilizada && ['31', '32'].includes(normalizeDocumentType(document.encfTipo)) && classifyStatus(document.estadoEncf) === 'accepted') }
function canDownload(document: FiscalDocument) { return Boolean(document.encf && document.secuenciaUtilizada && classifyStatus(document.estadoEncf) !== 'rejected') }
function classifyStatus(value: string | null) { const status = value?.toLocaleLowerCase('es') ?? ''; if (status.includes('rechazado') || status.includes('no aceptado')) return 'rejected'; if (status.includes('aceptado')) return 'accepted'; return 'pending' }
function normalizeDocumentType(value: string) { return value.replace(/^E/i, '') }
function goToPage(page: number) { currentPage.value = Math.min(Math.max(page, 1), totalPages.value) }
function clearFilters() { Object.assign(filters, { search: '', status: '', fromDate: '' }) }
function formatCurrency(value: number | null) { return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value ?? 0) }
function fiscalDateToIso(value: string | null) { if (!value) return null; const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value); if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`; const fiscal = /^(\d{2})-(\d{2})-(\d{4})/.exec(value); return fiscal ? `${fiscal[3]}-${fiscal[2]}-${fiscal[1]}` : null }
function formatDate(value: string | null) { const iso = fiscalDateToIso(value); return iso ? new Intl.DateTimeFormat('es-DO').format(new Date(`${iso}T00:00:00`)) : 'No informada' }
function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url) }
function showNotification(title: string, message: string, type: 'danger' | 'info') { (window as unknown as { jQuery?: TemplateNotify }).jQuery?.notify?.({ icon: 'bi bi-info-circle-fill', title, message }, { type, placement: { from: 'top', align: 'right' }, delay: 4000, z_index: 3000 }) }
</script>

<style scoped>
.credit-notes-page{min-height:100vh;padding:1.5rem;background:#f4f7fb;color:#101828}.page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;margin-bottom:1.5rem}.page-header h1{margin:.35rem 0 .3rem;font-size:1.75rem;font-weight:750}.page-header p,.list-heading p,.modal-header p{margin:0;color:#667085}.breadcrumb-line{display:flex;align-items:center;gap:.45rem;color:#667085;font-size:.78rem}.breadcrumb-line strong{color:#344054}.header-actions{display:flex;gap:.65rem}.header-actions .btn{min-height:44px;border-radius:10px;font-weight:650}.metrics-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin-bottom:1rem}.metric-card{display:flex;min-height:112px;padding:1.2rem;align-items:center;gap:1rem;border:1px solid #e3e9f2;border-radius:16px;background:#fff}.metric-icon{display:grid;width:48px;height:48px;flex:0 0 48px;border-radius:14px;font-size:1.2rem;place-items:center}.metric-icon.blue{color:#1670e8;background:#edf5ff}.metric-icon.green{color:#079455;background:#ecfdf3}.metric-icon.purple{color:#6938ef;background:#f4f0ff}.metric-card small,.metric-card strong{display:block}.metric-card small{margin-bottom:.2rem;color:#667085}.metric-card strong{font-size:1.3rem}.filter-card,.list-card{border:1px solid #e3e9f2;border-radius:16px;background:#fff}.filter-card{padding:1.2rem;margin-bottom:1rem}.form-label{color:#344054;font-size:.82rem;font-weight:650}.form-control,.form-select,.input-group-text{min-height:44px;border-color:#d5deea}.list-card{overflow:hidden}.list-heading{display:flex;padding:1.2rem 1.3rem;border-bottom:1px solid #e8edf4}.list-heading h2{margin:0 0 .2rem;font-size:1.05rem;font-weight:750}.table-shell{min-height:430px}.table thead th{padding:.8rem 1rem;border-bottom:1px solid #e5eaf2;background:#f8fafc;color:#667085;font-size:.7rem;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}.table tbody td{padding:.9rem 1rem;border-color:#edf1f6;color:#344054;font-size:.82rem}.table td strong,.table td small{display:block}.table td small{margin-top:.15rem;color:#667085}.status-badge{display:inline-flex;padding:.35rem .6rem;border-radius:999px;font-size:.7rem;font-weight:700}.status-accepted{color:#067647;background:#ecfdf3}.status-rejected{color:#b42318;background:#fef3f2}.status-pending{color:#b54708;background:#fffaeb}.pagination-wrap{display:flex;padding:1rem 1.2rem;justify-content:flex-end;border-top:1px solid #e8edf4}.loading-state,.empty-state{display:flex;min-height:260px;align-items:center;justify-content:center;flex-direction:column;gap:.5rem;color:#667085;text-align:center}.empty-state i{font-size:1.8rem;color:#98a2b3}.empty-state strong{color:#344054}.empty-state.compact{min-height:160px}.source-modal{overflow:hidden;border:0;border-radius:18px}.modal-header{padding:1.25rem 1.5rem;align-items:flex-start}.modal-header h2{margin:.2rem 0;font-size:1.3rem}.eyebrow{color:#0d6efd;font-size:.72rem;font-weight:750;text-transform:uppercase}.modal-body{padding:1.25rem 1.5rem}.source-search{position:relative}.source-search i{position:absolute;left:.9rem;top:50%;z-index:1;transform:translateY(-50%);color:#667085}.source-search input{padding-left:2.4rem}.source-table{margin-top:1rem;border:1px solid #e5eaf2;border-radius:12px}@media(max-width:991.98px){.metrics-grid{grid-template-columns:1fr}.page-header{flex-direction:column}.header-actions{width:100%}.header-actions .btn{flex:1}}@media(max-width:575.98px){.credit-notes-page{padding:1rem}.header-actions{flex-direction:column}.metrics-grid{gap:.75rem}.modal-header,.modal-body{padding-right:1rem;padding-left:1rem}}
</style>
