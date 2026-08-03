<script setup lang="ts">
import type { ProblemDetails, ValidationProblemDetails } from '~/types/auth'
import type {
  Article,
  ArticleWrite,
  BillingIndicator,
  MeasurementUnit,
} from '~/types/article'

interface ApiRequestError {
  status?: number
  statusCode?: number
  data?: ProblemDetails | ValidationProblemDetails | string
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

const PAGE_SIZE = 10
const CODE_TYPES = [
  { value: 'INT', label: 'INT — Código interno' },
  { value: 'SKU', label: 'SKU — Código de inventario' },
  { value: 'EAN13', label: 'EAN13 — Código de barras EAN-13' },
  { value: 'UPC', label: 'UPC — Código de barras UPC' },
  { value: 'ISBN', label: 'ISBN — Libros y publicaciones' },
] as const
const currencyFormatter = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 2,
})

const emptyArticle = (): ArticleWrite => ({
  codigo: null,
  tipoCodigo: null,
  indicadorFacturacion: -1,
  nombreItem: '',
  indicadorBienoServicio: 0,
  descripcionItem: null,
  unidadMedida: 0,
  precioUnitarioItem: 0,
  existencia: 0,
  codigoImpuesto: null,
  cantidadReferencia: null,
  unidadReferencia: null,
  gradosAlcohol: null,
  precioUnitarioReferencia: null,
  activo: true,
})

const {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deactivateArticle,
  getArticleCatalogs,
} = useArticlesApi()

const articles = ref<Article[]>([])
const billingIndicators = ref<BillingIndicator[]>([])
const measurementUnits = ref<MeasurementUnit[]>([])
const loading = ref(true)
const error = ref('')
const catalogWarning = ref('')
const search = ref('')
const includeInactive = ref(false)
const currentPage = ref(1)
const showForm = ref(false)
const editingArticle = ref<Article | null>(null)
const saving = ref(false)
const formError = ref('')
const actionArticleId = ref<string | null>(null)
const showDetails = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const selectedArticle = ref<Article | null>(null)
const statusArticle = ref<Article | null>(null)
const statusError = ref('')
const formModalElement = ref<HTMLElement | null>(null)
const detailModalElement = ref<HTMLElement | null>(null)
const statusModalElement = ref<HTMLElement | null>(null)
const articleNameInput = ref<HTMLInputElement | null>(null)
let formModalInstance: BootstrapModalInstance | null = null
let detailModalInstance: BootstrapModalInstance | null = null
let statusModalInstance: BootstrapModalInstance | null = null
let allowFormClose = false
let allowStatusClose = false
const form = reactive<ArticleWrite>(emptyArticle())

const normalizedSearch = computed(() => search.value.trim().toLocaleLowerCase('es'))
const isEditing = computed(() => Boolean(editingArticle.value))
const filteredArticles = computed(() => {
  if (!normalizedSearch.value) return articles.value

  return articles.value.filter((article) => [
    article.nombreItem,
    article.codigo,
    article.tipoCodigo,
    article.descripcionItem,
    article.codigoImpuesto,
  ].some(value => value?.toLocaleLowerCase('es').includes(normalizedSearch.value)))
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredArticles.value.length / PAGE_SIZE)))
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredArticles.value.slice(start, start + PAGE_SIZE)
})
const firstVisibleItem = computed(() => filteredArticles.value.length
  ? (currentPage.value - 1) * PAGE_SIZE + 1
  : 0)
const lastVisibleItem = computed(() => Math.min(currentPage.value * PAGE_SIZE, filteredArticles.value.length))
const activeCount = computed(() => articles.value.filter(article => article.activo).length)
const inactiveCount = computed(() => articles.value.filter(article => !article.activo).length)
const totalStock = computed(() => articles.value.reduce((total, article) => total + Number(article.existencia || 0), 0))
const serviceCount = computed(() => articles.value.filter(article => article.indicadorBienoServicio === 2).length)

watch(search, () => { currentPage.value = 1 })
watch(totalPages, pages => {
  if (currentPage.value > pages) currentPage.value = pages
})
watch(includeInactive, async () => {
  currentPage.value = 1
  await loadArticles()
})
watch(() => form.indicadorBienoServicio, (itemType) => {
  if (Number(itemType) === 2) form.existencia = 0
})

onMounted(async () => {
  formModalElement.value?.addEventListener('shown.bs.modal', handleFormModalShown)
  formModalElement.value?.addEventListener('hide.bs.modal', handleFormModalHide)
  formModalElement.value?.addEventListener('hidden.bs.modal', handleFormModalHidden)
  detailModalElement.value?.addEventListener('shown.bs.modal', handleDetailModalShown)
  detailModalElement.value?.addEventListener('hidden.bs.modal', handleDetailModalHidden)
  statusModalElement.value?.addEventListener('hide.bs.modal', handleStatusModalHide)
  statusModalElement.value?.addEventListener('hidden.bs.modal', handleStatusModalHidden)
  await Promise.all([loadArticles(), loadCatalogs()])
})

onBeforeUnmount(() => {
  formModalElement.value?.removeEventListener('shown.bs.modal', handleFormModalShown)
  formModalElement.value?.removeEventListener('hide.bs.modal', handleFormModalHide)
  formModalElement.value?.removeEventListener('hidden.bs.modal', handleFormModalHidden)
  detailModalElement.value?.removeEventListener('shown.bs.modal', handleDetailModalShown)
  detailModalElement.value?.removeEventListener('hidden.bs.modal', handleDetailModalHidden)
  statusModalElement.value?.removeEventListener('hide.bs.modal', handleStatusModalHide)
  statusModalElement.value?.removeEventListener('hidden.bs.modal', handleStatusModalHidden)
  formModalInstance?.dispose()
  detailModalInstance?.dispose()
  statusModalInstance?.dispose()
})

async function loadArticles() {
  loading.value = true
  error.value = ''

  try {
    const response = await getArticles(includeInactive.value)
    articles.value = Array.isArray(response) ? response : []
  } catch (caughtError: unknown) {
    const status = getErrorStatus(caughtError)
    if (status === 403) error.value = 'No tienes permisos para consultar los artículos.'
    else if (status !== 401) error.value = 'No pudimos cargar el inventario. Verifica la conexión con el backend.'
  } finally {
    loading.value = false
  }
}

async function loadCatalogs() {
  catalogWarning.value = ''
  try {
    const catalogs = await getArticleCatalogs()
    billingIndicators.value = catalogs.billingIndicators
      .filter(item => item.activo)
      .sort((first, second) => first.codigo - second.codigo)
    measurementUnits.value = catalogs.measurementUnits
      .filter(item => item.activo)
      .sort((first, second) => Number(first.codigo) - Number(second.codigo))
  } catch {
    catalogWarning.value = 'No se pudieron cargar los catálogos; podrás indicar sus códigos manualmente.'
  }
}

async function openCreateForm() {
  editingArticle.value = null
  Object.assign(form, emptyArticle())
  formError.value = ''
  showForm.value = true
  await nextTick()
  if (!showBootstrapModal(getFormModal(), 'No pudimos abrir el formulario de artículos.')) showForm.value = false
}

async function openEditForm(article: Article) {
  editingArticle.value = article
  Object.assign(form, toArticleWrite(article))
  formError.value = ''
  showForm.value = true
  await nextTick()
  if (!showBootstrapModal(getFormModal(), 'No pudimos abrir el formulario de artículos.')) showForm.value = false
}

function closeForm() {
  if (saving.value) return
  getFormModal()?.hide()
}

async function saveArticle() {
  formError.value = validateForm()
  if (formError.value) return

  saving.value = true
  try {
    const payload = normalizeArticleWrite(form)
    if (editingArticle.value) {
      await updateArticle(editingArticle.value.id, payload)
      showSuccessNotification('Artículo actualizado', 'El artículo fue actualizado correctamente.')
    } else {
      await createArticle(payload)
      showSuccessNotification('Artículo creado', 'El artículo fue agregado al inventario.')
    }

    allowFormClose = true
    getFormModal()?.hide()
    await loadArticles()
  } catch (caughtError: unknown) {
    if (getErrorStatus(caughtError) !== 401) {
      formError.value = getApiErrorMessage(caughtError, 'No pudimos guardar el artículo.')
    }
  } finally {
    saving.value = false
  }
}

async function toggleArticleStatus(article: Article) {
  statusArticle.value = article
  statusError.value = ''
  await nextTick()
  if (!showBootstrapModal(getStatusModal(), 'No pudimos abrir la confirmación.')) statusArticle.value = null
}

async function confirmArticleStatusChange() {
  const article = statusArticle.value
  if (!article) return
  const action = article.activo ? 'desactivar' : 'reactivar'

  actionArticleId.value = article.id
  statusError.value = ''
  try {
    if (article.activo) {
      await deactivateArticle(article.id)
      showSuccessNotification('Artículo desactivado', 'El artículo fue desactivado correctamente.')
    } else {
      await updateArticle(article.id, { ...toArticleWrite(article), activo: true })
      showSuccessNotification('Artículo reactivado', 'El artículo fue reactivado correctamente.')
    }
    allowStatusClose = true
    getStatusModal()?.hide()
    await loadArticles()
  } catch (caughtError: unknown) {
    if (getErrorStatus(caughtError) !== 401) {
      statusError.value = getApiErrorMessage(caughtError, `No pudimos ${action} el artículo.`)
    }
  } finally {
    actionArticleId.value = null
  }
}

async function openArticleDetails(article: Article) {
  selectedArticle.value = article
  detailError.value = ''
  detailLoading.value = true
  showDetails.value = true
  await nextTick()
  if (!showBootstrapModal(getDetailModal(), 'No pudimos abrir el detalle del artículo.')) showDetails.value = false
  try {
    selectedArticle.value = await getArticle(article.id)
  } catch (caughtError: unknown) {
    if (getErrorStatus(caughtError) !== 401) {
      detailError.value = getApiErrorMessage(caughtError, 'No pudimos cargar el detalle del artículo.')
    }
  } finally {
    detailLoading.value = false
  }
}

function closeArticleDetails() {
  getDetailModal()?.hide()
}

function getBootstrapModalConstructor() {
  return (window as unknown as { bootstrap?: { Modal?: BootstrapModalConstructor } }).bootstrap?.Modal ?? null
}

function getFormModal() {
  if (formModalInstance) return formModalInstance
  const bootstrap = getBootstrapModalConstructor()
  if (!formModalElement.value || !bootstrap) return null
  formModalInstance = bootstrap.getOrCreateInstance(formModalElement.value, { backdrop: true, keyboard: true, focus: true })
  return formModalInstance
}

function getDetailModal() {
  if (detailModalInstance) return detailModalInstance
  const bootstrap = getBootstrapModalConstructor()
  if (!detailModalElement.value || !bootstrap) return null
  detailModalInstance = bootstrap.getOrCreateInstance(detailModalElement.value, { backdrop: true, keyboard: true, focus: true })
  return detailModalInstance
}

function getStatusModal() {
  if (statusModalInstance) return statusModalInstance
  const bootstrap = getBootstrapModalConstructor()
  if (!statusModalElement.value || !bootstrap) return null
  statusModalInstance = bootstrap.getOrCreateInstance(statusModalElement.value, { backdrop: true, keyboard: true, focus: true })
  return statusModalInstance
}

function showBootstrapModal(instance: BootstrapModalInstance | null, fallbackMessage: string) {
  if (!instance) {
    error.value = fallbackMessage
    return false
  }
  instance.show()
  return true
}

function handleFormModalShown() {
  showForm.value = true
  articleNameInput.value?.focus()
}

function handleFormModalHide(event: Event) {
  if (saving.value && !allowFormClose) event.preventDefault()
}

function handleFormModalHidden() {
  showForm.value = false
  editingArticle.value = null
  formError.value = ''
  allowFormClose = false
}

function handleDetailModalShown() {
  showDetails.value = true
}

function handleDetailModalHidden() {
  showDetails.value = false
  selectedArticle.value = null
  detailError.value = ''
}

function handleStatusModalHide(event: Event) {
  if (actionArticleId.value && !allowStatusClose) event.preventDefault()
}

function handleStatusModalHidden() {
  statusArticle.value = null
  statusError.value = ''
  allowStatusClose = false
}

function validateForm() {
  if (!form.nombreItem.trim()) return 'El nombre del artículo es obligatorio.'
  if (form.codigo?.trim() && !form.tipoCodigo) return 'Selecciona el tipo de código del artículo.'
  if (form.tipoCodigo && !form.codigo?.trim()) return 'Indica el código correspondiente al tipo seleccionado.'
  if (![0, 1, 2, 3, 4].includes(Number(form.indicadorFacturacion))) {
    return 'Selecciona un indicador de facturación válido.'
  }
  if (![1, 2].includes(Number(form.indicadorBienoServicio))) return 'Selecciona si corresponde a un bien o servicio.'
  if (!Number.isFinite(Number(form.unidadMedida)) || Number(form.unidadMedida) <= 0) return 'Selecciona una unidad de medida válida.'
  if (!Number.isFinite(Number(form.precioUnitarioItem)) || Number(form.precioUnitarioItem) < 0) return 'Indica un precio unitario válido.'
  if (!Number.isFinite(Number(form.existencia)) || Number(form.existencia) < 0) return 'Indica una existencia válida.'
  return ''
}

function toArticleWrite(article: Article): ArticleWrite {
  const { id: _id, tenantId: _tenantId, ...editableFields } = article
  return editableFields
}

function normalizeArticleWrite(value: ArticleWrite): ArticleWrite {
  const payload = { ...value, nombreItem: value.nombreItem.trim() }
  for (const field of ['codigo', 'tipoCodigo', 'descripcionItem', 'codigoImpuesto'] as const) {
    const fieldValue = payload[field]
    payload[field] = typeof fieldValue === 'string' ? fieldValue.trim() || null : null
  }
  for (const field of [
    'indicadorFacturacion',
    'indicadorBienoServicio',
    'unidadMedida',
    'precioUnitarioItem',
    'existencia',
  ] as const) payload[field] = Number(payload[field])

  for (const field of [
    'cantidadReferencia',
    'unidadReferencia',
    'gradosAlcohol',
    'precioUnitarioReferencia',
  ] as const) {
    const fieldValue = payload[field] as number | string | null | undefined
    payload[field] = fieldValue === null || fieldValue === undefined || fieldValue === ''
      ? null
      : Number(fieldValue)
  }
  return payload
}

function getErrorStatus(caughtError: unknown) {
  const apiError = caughtError as ApiRequestError
  return apiError.statusCode ?? apiError.status
}

function getApiErrorMessage(caughtError: unknown, fallback: string) {
  const data = (caughtError as ApiRequestError).data
  if (typeof data === 'string' && data.trim()) return data
  if (data && typeof data === 'object') {
    if (data.detail) return data.detail
    if ('errors' in data && data.errors) {
      const firstError = Object.values(data.errors).flat()[0]
      if (firstError) return firstError
    }
    if (data.title) return data.title
  }
  return fallback
}

function showSuccessNotification(title: string, message: string) {
  const jquery = (window as unknown as { jQuery?: TemplateNotify }).jQuery
  jquery?.notify?.(
    { icon: 'bi bi-check-circle-fill', title, message },
    {
      type: 'success',
      placement: { from: 'top', align: 'right' },
      delay: 3500,
      timer: 500,
      z_index: 2000,
      animate: { enter: 'animated fadeInDown', exit: 'animated fadeOutUp' },
    },
  )
}

function billingIndicatorLabel(code: number) {
  const indicator = billingIndicators.value.find(item => item.codigo === code)
  return indicator ? `${indicator.codigo} — ${indicator.descripcion}` : String(code)
}

function measurementLabel(code: number) {
  const unit = measurementUnits.value.find(item => Number(item.codigo) === code)
  return unit ? `${unit.medidaNombre} (${unit.abreviatura})` : String(code)
}

function itemTypeLabel(value: number) {
  return value === 1 ? 'Bien' : value === 2 ? 'Servicio' : String(value)
}

function formatCurrency(value: number) {
  return currencyFormatter.format(Number(value || 0))
}

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? 'No registrado' : String(value)
}

function clearSearch() { search.value = '' }
function goToPage(page: number) { currentPage.value = Math.min(Math.max(page, 1), totalPages.value) }
</script>

<template>
  <div class="inventory-page">
    <div class="page-header mb-4">
      <div>
        <div class="breadcrumb-line mb-2"><span>Administración</span><i class="bi bi-chevron-right" /><strong>Inventario</strong></div>
        <h1 class="page-title">Artículos de inventario</h1>
        <p class="page-subtitle">Administra los productos y servicios disponibles para facturación.</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-outline-primary effi-btn" :disabled="loading" @click="loadArticles">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" /><i v-else class="bi bi-arrow-clockwise me-2" />Actualizar
        </button>
        <button type="button" class="btn btn-primary effi-btn" @click="openCreateForm"><i class="bi bi-box-seam me-2" />Nuevo artículo</button>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-xl-3 col-md-6"><div class="effi-card metric-card"><span class="metric-icon metric-blue"><i class="bi bi-boxes" /></span><div><span class="metric-label">Artículos cargados</span><strong class="metric-value">{{ articles.length }}</strong></div></div></div>
      <div class="col-xl-3 col-md-6"><div class="effi-card metric-card"><span class="metric-icon metric-success"><i class="bi bi-check2-circle" /></span><div><span class="metric-label">Activos</span><strong class="metric-value">{{ activeCount }}</strong><small v-if="includeInactive && inactiveCount">{{ inactiveCount }} inactivos</small></div></div></div>
      <div class="col-xl-3 col-md-6"><div class="effi-card metric-card"><span class="metric-icon metric-purple"><i class="bi bi-archive" /></span><div><span class="metric-label">Existencia total</span><strong class="metric-value">{{ totalStock }}</strong></div></div></div>
      <div class="col-xl-3 col-md-6"><div class="effi-card metric-card"><span class="metric-icon metric-orange"><i class="bi bi-briefcase" /></span><div><span class="metric-label">Servicios</span><strong class="metric-value">{{ serviceCount }}</strong></div></div></div>
    </div>

    <div class="effi-card filters-card mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-lg-8">
          <label for="article-search" class="form-label">Buscar artículos</label>
          <div class="input-group"><span class="input-group-text"><i class="bi bi-search" /></span><input id="article-search" v-model="search" type="search" class="form-control" placeholder="Nombre, código, descripción o impuesto..."><button v-if="search" type="button" class="btn btn-outline-secondary" @click="clearSearch">Limpiar</button></div>
        </div>
        <div class="col-lg-4"><div class="form-check form-switch inactive-switch"><input id="include-inactive-articles" v-model="includeInactive" class="form-check-input" type="checkbox" :disabled="loading"><label class="form-check-label" for="include-inactive-articles">Incluir artículos inactivos</label></div></div>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger d-flex justify-content-between align-items-center gap-3" role="alert"><span><i class="bi bi-exclamation-triangle me-2" />{{ error }}</span><button type="button" class="btn btn-sm btn-outline-danger" @click="loadArticles">Reintentar</button></div>

    <div class="effi-card table-card">
      <div class="table-header"><div><h2>Listado de artículos</h2><p v-if="!loading">{{ filteredArticles.length ? `Mostrando ${firstVisibleItem}–${lastVisibleItem} de ${filteredArticles.length} artículos.` : 'No hay artículos para mostrar.' }}</p><p v-else>Cargando información...</p></div></div>
      <div v-if="loading" class="empty-state"><span class="spinner-border text-primary" /><span>Cargando inventario...</span></div>
      <template v-else-if="paginatedArticles.length">
        <div class="table-responsive">
          <table class="table effi-table align-middle">
            <thead><tr><th>Artículo</th><th>Tipo</th><th>Indicador</th><th>Precio</th><th>Existencia</th><th>Estado</th><th class="text-end">Acciones</th></tr></thead>
            <tbody>
              <tr v-for="article in paginatedArticles" :key="article.id">
                <td><strong>{{ article.nombreItem }}</strong><small>{{ article.codigo || 'Sin código' }}<template v-if="article.tipoCodigo"> · {{ article.tipoCodigo }}</template></small></td>
                <td><span class="type-badge">{{ itemTypeLabel(article.indicadorBienoServicio) }}</span></td>
                <td>{{ billingIndicatorLabel(article.indicadorFacturacion) }}</td>
                <td><strong>{{ formatCurrency(article.precioUnitarioItem) }}</strong><small>{{ measurementLabel(article.unidadMedida) }}</small></td>
                <td>{{ article.indicadorBienoServicio === 2 ? 'No aplica' : article.existencia }}</td>
                <td><span class="status-badge" :class="article.activo ? 'status-active' : 'status-inactive'">{{ article.activo ? 'Activo' : 'Inactivo' }}</span></td>
                <td><div class="row-actions">
                  <button type="button" class="btn btn-sm btn-outline-secondary" title="Ver detalle" @click="openArticleDetails(article)"><i class="bi bi-eye" /><span class="visually-hidden">Ver detalle</span></button>
                  <button type="button" class="btn btn-sm btn-outline-primary" title="Editar" :disabled="actionArticleId === article.id" @click="openEditForm(article)"><i class="bi bi-pencil" /><span class="visually-hidden">Editar</span></button>
                  <button type="button" class="btn btn-sm" :class="article.activo ? 'btn-outline-danger' : 'btn-outline-success'" :disabled="actionArticleId === article.id" :title="article.activo ? 'Desactivar' : 'Reactivar'" @click="toggleArticleStatus(article)"><span v-if="actionArticleId === article.id" class="spinner-border spinner-border-sm" /><i v-else :class="article.activo ? 'bi bi-box-arrow-down' : 'bi bi-box-arrow-up'" /></button>
                </div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <nav v-if="totalPages > 1" class="pagination-wrap"><span>Página {{ currentPage }} de {{ totalPages }}</span><div class="btn-group"><button type="button" class="btn btn-outline-secondary btn-sm" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Anterior</button><button type="button" class="btn btn-outline-secondary btn-sm" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Siguiente</button></div></nav>
      </template>
      <div v-else class="empty-state"><span class="empty-icon"><i class="bi bi-box-seam" /></span><h3>{{ search ? 'No encontramos coincidencias' : 'Aún no hay artículos registrados' }}</h3><p>{{ search ? 'Prueba con otro nombre, código o descripción.' : 'Registra el primer producto o servicio de tu inventario.' }}</p><button type="button" class="btn btn-primary" @click="search ? clearSearch() : openCreateForm()">{{ search ? 'Limpiar búsqueda' : 'Registrar artículo' }}</button></div>
    </div>

    <Teleport to="body">
      <div ref="formModalElement" class="modal fade" tabindex="-1" aria-labelledby="article-form-title" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"><form class="modal-content inventory-bootstrap-modal" @submit.prevent="saveArticle">
          <div class="modal-header modal-header-custom"><div><span class="modal-eyebrow">Mantenimiento de inventario</span><h2 id="article-form-title">{{ isEditing ? 'Editar artículo' : 'Nuevo artículo' }}</h2><p>{{ isEditing ? 'Actualiza los datos del artículo.' : 'Completa la información del producto o servicio.' }}</p></div><button type="button" class="btn-close" :disabled="saving" @click="closeForm" /></div>
          <div class="modal-body modal-body-custom">
            <div v-if="formError" class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2" />{{ formError }}</div>
            <div v-if="catalogWarning" class="alert alert-warning"><i class="bi bi-info-circle me-2" />{{ catalogWarning }}</div>
            <section class="form-section"><div class="section-title"><i class="bi bi-box-seam" /><div><h3>Información principal</h3><p>Identificación y clasificación del artículo.</p></div></div><div class="row g-3">
              <div class="col-md-8"><label for="article-name" class="form-label">Nombre <span class="required">*</span></label><input id="article-name" ref="articleNameInput" v-model="form.nombreItem" class="form-control" maxlength="80" required></div>
              <div class="col-md-4"><label for="article-active" class="form-label">Artículo activo</label><select id="article-active" v-model="form.activo" class="form-select"><option :value="true">Sí</option><option :value="false">No</option></select></div>
              <div class="col-md-6"><label for="article-code" class="form-label">Código</label><input id="article-code" v-model="form.codigo" class="form-control" maxlength="35"></div>
              <div class="col-md-6"><label for="article-code-type" class="form-label">Tipo de código</label><select id="article-code-type" v-model="form.tipoCodigo" class="form-select"><option :value="null">Seleccione un tipo de código</option><option v-for="codeType in CODE_TYPES" :key="codeType.value" :value="codeType.value">{{ codeType.label }}</option></select></div>
              <div class="col-12"><label for="article-description" class="form-label">Descripción</label><textarea id="article-description" v-model="form.descripcionItem" class="form-control" rows="3" maxlength="1000"></textarea></div>
            </div></section>
            <section class="form-section"><div class="section-title"><i class="bi bi-receipt" /><div><h3>Facturación e inventario</h3><p>Valores fiscales, precio y disponibilidad.</p></div></div><div class="row g-3">
              <div class="col-md-4"><label for="article-kind" class="form-label">Bien o servicio <span class="required">*</span></label><select id="article-kind" v-model.number="form.indicadorBienoServicio" class="form-select" required><option :value="0" disabled>Seleccione una opción</option><option :value="1">1 — Bien</option><option :value="2">2 — Servicio</option></select></div>
              <div class="col-md-4"><label for="article-billing" class="form-label">Indicador de facturación <span class="required">*</span></label><select v-if="billingIndicators.length" id="article-billing" v-model.number="form.indicadorFacturacion" class="form-select" required><option :value="-1" disabled>Seleccione un indicador</option><option v-for="indicator in billingIndicators" :key="indicator.id" :value="indicator.codigo">{{ indicator.codigo }} — {{ indicator.descripcion }}</option></select><input v-else id="article-billing" v-model.number="form.indicadorFacturacion" type="number" min="0" max="4" class="form-control" placeholder="Código entre 0 y 4" required></div>
              <div class="col-md-4"><label for="article-unit" class="form-label">Unidad de medida <span class="required">*</span></label><InventoryUnitSelect id="article-unit" :model-value="form.unidadMedida" :units="measurementUnits" placeholder="Seleccione una unidad" :required="true" :allow-empty="false" @update:model-value="form.unidadMedida = $event ?? 0" /></div>
              <div class="col-md-4"><label for="article-price" class="form-label">Precio unitario <span class="required">*</span></label><div class="input-group"><span class="input-group-text">RD$</span><input id="article-price" v-model.number="form.precioUnitarioItem" type="number" min="0" step="0.01" class="form-control" required></div></div>
              <div class="col-md-4"><label for="article-stock" class="form-label">Existencia <span class="required">*</span></label><input id="article-stock" v-model.number="form.existencia" type="number" min="0" step="0.01" class="form-control" :disabled="form.indicadorBienoServicio === 2" required><small v-if="form.indicadorBienoServicio === 2" class="form-helper">Los servicios no controlan existencia.</small></div>
              <div class="col-md-4"><label for="article-tax" class="form-label">Código de impuesto</label><input id="article-tax" v-model="form.codigoImpuesto" class="form-control" maxlength="100" placeholder="ITBIS18"></div>
            </div></section>
            <section class="form-section"><div class="section-title"><i class="bi bi-sliders" /><div><h3>Valores de referencia</h3><p>Información fiscal opcional del artículo.</p></div></div><div class="row g-3">
              <div class="col-md-3"><label for="reference-quantity" class="form-label">Cantidad referencia</label><input id="reference-quantity" v-model.number="form.cantidadReferencia" type="number" min="0" step="0.01" class="form-control"></div>
              <div class="col-md-3"><label for="reference-unit" class="form-label">Unidad referencia</label><InventoryUnitSelect id="reference-unit" :model-value="form.unidadReferencia" :units="measurementUnits" placeholder="Seleccione una unidad de referencia" :required="false" :allow-empty="true" @update:model-value="form.unidadReferencia = $event" /></div>
              <div class="col-md-3"><label for="alcohol-degree" class="form-label">Grados de alcohol</label><input id="alcohol-degree" v-model.number="form.gradosAlcohol" type="number" min="0" step="0.01" class="form-control"></div>
              <div class="col-md-3"><label for="reference-price" class="form-label">Precio referencia</label><input id="reference-price" v-model.number="form.precioUnitarioReferencia" type="number" min="0" step="0.01" class="form-control"></div>
            </div></section>
          </div>
          <div class="modal-footer modal-footer-custom"><button type="button" class="btn btn-outline-secondary" :disabled="saving" @click="closeForm">Cancelar</button><button type="submit" class="btn btn-primary" :disabled="saving"><span v-if="saving" class="spinner-border spinner-border-sm me-2" />{{ saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear artículo' }}</button></div>
        </form></div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div ref="detailModalElement" class="modal fade" tabindex="-1" aria-labelledby="article-detail-title" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"><div class="modal-content inventory-bootstrap-modal">
          <div class="modal-header modal-header-custom"><div><span class="modal-eyebrow">Detalle del artículo</span><h2 id="article-detail-title">{{ selectedArticle?.nombreItem || 'Artículo' }}</h2><p>Información completa registrada en inventario.</p></div><button type="button" class="btn-close" @click="closeArticleDetails" /></div>
          <div class="modal-body modal-body-custom">
            <div v-if="detailError" class="alert alert-danger">{{ detailError }}</div>
            <div v-if="detailLoading" class="empty-state"><span class="spinner-border text-primary" /><span>Cargando detalle...</span></div>
            <template v-else-if="selectedArticle">
              <section class="detail-section"><div class="section-title"><i class="bi bi-box-seam" /><div><h3>Información principal</h3><p>Identificación y estado.</p></div></div><dl class="detail-grid">
                <div class="detail-item wide"><dt>Nombre</dt><dd>{{ selectedArticle.nombreItem }}</dd></div><div class="detail-item"><dt>Estado</dt><dd><span class="status-badge" :class="selectedArticle.activo ? 'status-active' : 'status-inactive'">{{ selectedArticle.activo ? 'Activo' : 'Inactivo' }}</span></dd></div><div class="detail-item"><dt>Código</dt><dd>{{ displayValue(selectedArticle.codigo) }}</dd></div><div class="detail-item"><dt>Tipo de código</dt><dd>{{ displayValue(selectedArticle.tipoCodigo) }}</dd></div><div class="detail-item wide"><dt>Descripción</dt><dd>{{ displayValue(selectedArticle.descripcionItem) }}</dd></div>
              </dl></section>
              <section class="detail-section"><div class="section-title"><i class="bi bi-receipt" /><div><h3>Facturación e inventario</h3><p>Clasificación, precio y disponibilidad.</p></div></div><dl class="detail-grid">
                <div class="detail-item"><dt>Tipo</dt><dd>{{ itemTypeLabel(selectedArticle.indicadorBienoServicio) }}</dd></div><div class="detail-item"><dt>Indicador de facturación</dt><dd>{{ billingIndicatorLabel(selectedArticle.indicadorFacturacion) }}</dd></div><div class="detail-item"><dt>Unidad de medida</dt><dd>{{ measurementLabel(selectedArticle.unidadMedida) }}</dd></div><div class="detail-item"><dt>Precio unitario</dt><dd>{{ formatCurrency(selectedArticle.precioUnitarioItem) }}</dd></div><div class="detail-item"><dt>Existencia</dt><dd>{{ selectedArticle.indicadorBienoServicio === 2 ? 'No aplica' : selectedArticle.existencia }}</dd></div><div class="detail-item"><dt>Código de impuesto</dt><dd>{{ displayValue(selectedArticle.codigoImpuesto) }}</dd></div>
              </dl></section>
              <section class="detail-section"><div class="section-title"><i class="bi bi-sliders" /><div><h3>Valores de referencia</h3><p>Información fiscal opcional.</p></div></div><dl class="detail-grid">
                <div class="detail-item"><dt>Cantidad referencia</dt><dd>{{ displayValue(selectedArticle.cantidadReferencia) }}</dd></div><div class="detail-item"><dt>Unidad referencia</dt><dd>{{ displayValue(selectedArticle.unidadReferencia) }}</dd></div><div class="detail-item"><dt>Grados de alcohol</dt><dd>{{ displayValue(selectedArticle.gradosAlcohol) }}</dd></div><div class="detail-item"><dt>Precio referencia</dt><dd>{{ selectedArticle.precioUnitarioReferencia == null ? 'No registrado' : formatCurrency(selectedArticle.precioUnitarioReferencia) }}</dd></div>
              </dl></section>
            </template>
          </div>
          <div class="modal-footer modal-footer-custom"><button type="button" class="btn btn-outline-secondary" @click="closeArticleDetails">Cerrar</button></div>
        </div></div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div ref="statusModalElement" class="modal fade" tabindex="-1" aria-labelledby="article-status-title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered"><div class="modal-content status-confirmation-modal">
          <div class="modal-header border-0 pb-0"><h2 id="article-status-title" class="modal-title fs-5">{{ statusArticle?.activo ? 'Desactivar artículo' : 'Reactivar artículo' }}</h2><button type="button" class="btn-close" aria-label="Cerrar" :disabled="Boolean(actionArticleId)" @click="getStatusModal()?.hide()" /></div>
          <div class="modal-body status-confirmation-body"><div class="status-confirmation-icon" :class="statusArticle?.activo ? 'danger' : 'success'"><i class="bi" :class="statusArticle?.activo ? 'bi-box-arrow-down' : 'bi-box-arrow-up'" /></div><div><p class="mb-1">¿Deseas {{ statusArticle?.activo ? 'desactivar' : 'reactivar' }} <strong>{{ statusArticle?.nombreItem }}</strong>?</p><small class="text-muted">{{ statusArticle?.activo ? 'El artículo dejará de aparecer entre los artículos activos, pero sus datos se conservarán.' : 'El artículo volverá a estar disponible para las operaciones.' }}</small></div></div>
          <div v-if="statusError" class="alert alert-danger mx-3 mb-0" role="alert"><i class="bi bi-exclamation-triangle me-2" />{{ statusError }}</div>
          <div class="modal-footer border-0"><button type="button" class="btn btn-outline-secondary" :disabled="Boolean(actionArticleId)" @click="getStatusModal()?.hide()">Cancelar</button><button type="button" class="btn" :class="statusArticle?.activo ? 'btn-danger' : 'btn-success'" :disabled="Boolean(actionArticleId)" @click="confirmArticleStatusChange"><span v-if="actionArticleId" class="spinner-border spinner-border-sm me-2" />{{ actionArticleId ? 'Procesando...' : statusArticle?.activo ? 'Sí, desactivar' : 'Sí, reactivar' }}</button></div>
        </div></div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.inventory-page { color: #101828; }
.page-header, .header-actions, .table-header, .pagination-wrap, .row-actions { display: flex; align-items: center; justify-content: space-between; gap: .7rem; }
.breadcrumb-line { display: flex; align-items: center; gap: .5rem; color: #667085; font-size: .84rem; }
.breadcrumb-line i { font-size: .7rem; color: #98a2b3; }
.page-title { margin-bottom: .35rem; font-size: 1.8rem; font-weight: 700; }
.page-subtitle, .table-header p { margin: 0; color: #667085; }
.effi-card { padding: 1.35rem; border: 1px solid #e5eaf2; border-radius: 16px; background: #fff; }
.effi-btn { min-height: 42px; border-radius: 10px; font-weight: 600; }
.metric-card { display: flex; min-height: 108px; align-items: center; gap: 1rem; }
.metric-icon { display: inline-flex; width: 48px; height: 48px; flex: 0 0 48px; align-items: center; justify-content: center; border-radius: 14px; font-size: 1.3rem; }
.metric-blue { color: #0d6efd; background: #eef5ff; }.metric-success { color: #16a34a; background: #eaf8ee; }.metric-purple { color: #6941c6; background: #f2edff; }.metric-orange { color: #dc6803; background: #fff4e5; }
.metric-label, .metric-card small { display: block; color: #667085; font-size: .8rem; }.metric-value { display: block; margin-top: .1rem; font-size: 1.4rem; }
.inactive-switch { min-height: 44px; display: flex; align-items: center; gap: .4rem; }
.table-card { padding: 0; overflow: hidden; }.table-header { padding: 1.35rem; border-bottom: 1px solid #edf0f5; }.table-header h2 { margin: 0 0 .2rem; font-size: 1rem; font-weight: 700; }.table-header p { font-size: .84rem; }
.effi-table { margin: 0; }.effi-table th { padding: .8rem 1rem; background: #f8fafc; color: #667085; font-size: .74rem; white-space: nowrap; }.effi-table td { padding: .9rem 1rem; border-color: #edf0f5; color: #344054; font-size: .82rem; }.effi-table td strong, .effi-table td small { display: block; }.effi-table td small { margin-top: .15rem; color: #667085; }
.status-badge, .type-badge { display: inline-flex; padding: .38rem .65rem; border-radius: 8px; font-size: .72rem; font-weight: 700; }.status-active { color: #15803d; background: #eaf8ee; }.status-inactive { color: #667085; background: #f2f4f7; }.type-badge { color: #175cd3; background: #eff8ff; }
.row-actions { min-width: 116px; justify-content: flex-end; }.pagination-wrap { padding: 1rem 1.35rem; border-top: 1px solid #edf0f5; color: #667085; font-size: .82rem; }
.empty-state { display: flex; min-height: 280px; padding: 2rem; align-items: center; justify-content: center; flex-direction: column; gap: .8rem; color: #667085; text-align: center; }.empty-state h3 { margin: 0; color: #344054; font-size: 1.05rem; }.empty-state p { margin: 0; }.empty-icon { display: inline-flex; width: 54px; height: 54px; align-items: center; justify-content: center; border-radius: 16px; background: #eef5ff; color: #0d6efd; font-size: 1.4rem; }
.inventory-bootstrap-modal { overflow: hidden; border: 0; border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.24); }
.modal-header-custom, .modal-footer-custom { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1.25rem 1.5rem; }.modal-header-custom { border-bottom: 1px solid #e5eaf2; }.modal-header-custom h2 { margin: .15rem 0 .25rem; font-size: 1.3rem; font-weight: 700; }.modal-header-custom p, .section-title p { margin: 0; color: #667085; font-size: .82rem; }.modal-eyebrow { color: #0d6efd; font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }.modal-body-custom { padding: 1.5rem; overflow-y: auto; }.modal-footer-custom { align-items: center; justify-content: flex-end; border-top: 1px solid #e5eaf2; background: #f8fafc; }.modal-footer-custom .btn { min-width: 120px; }
.form-section + .form-section, .detail-section + .detail-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #edf0f5; }.section-title { display: flex; margin-bottom: 1rem; align-items: flex-start; gap: .75rem; }.section-title > i { display: inline-flex; width: 36px; height: 36px; flex: 0 0 36px; align-items: center; justify-content: center; border-radius: 10px; color: #0d6efd; background: #eef5ff; }.section-title h3 { margin: 0 0 .15rem; font-size: .95rem; font-weight: 700; }.inventory-bootstrap-modal .form-label { margin-bottom: .4rem; color: #344054; font-size: .8rem; font-weight: 600; }.inventory-bootstrap-modal .form-control, .inventory-bootstrap-modal .form-select { min-height: 42px; border-color: #d9e1ec; border-radius: 9px; }.inventory-bootstrap-modal textarea.form-control { min-height: auto; }.required { color: #dc3545; }
.form-helper { display: block; margin-top: .35rem; color: #667085; font-size: .72rem; }
.status-confirmation-modal { overflow: hidden; border: 0; border-radius: 16px; box-shadow: 0 24px 60px rgba(15,23,42,.24); }.status-confirmation-body { display: flex; padding-top: 1.25rem; align-items: flex-start; gap: 1rem; color: #344054; }.status-confirmation-icon { display: inline-flex; width: 44px; height: 44px; flex: 0 0 44px; align-items: center; justify-content: center; border-radius: 12px; font-size: 1.2rem; }.status-confirmation-icon.danger { background: #fff1f2; color: #dc3545; }.status-confirmation-icon.success { background: #ecfdf3; color: #198754; }
.detail-grid { display: grid; margin: 0; grid-template-columns: repeat(3,minmax(0,1fr)); gap: .75rem; }.detail-item { min-width: 0; padding: .85rem 1rem; border: 1px solid #e5eaf2; border-radius: 10px; background: #f8fafc; }.detail-item.wide { grid-column: span 2; }.detail-item dt { margin-bottom: .3rem; color: #667085; font-size: .72rem; }.detail-item dd { margin: 0; overflow-wrap: anywhere; color: #101828; font-size: .86rem; font-weight: 600; }
@media (max-width: 767.98px) { .page-header { align-items: flex-start; flex-direction: column; }.header-actions { width: 100%; }.header-actions .btn { flex: 1; }.pagination-wrap { align-items: flex-start; flex-direction: column; }.modal-header-custom, .modal-body-custom, .modal-footer-custom { padding-right: 1rem; padding-left: 1rem; }.detail-grid { grid-template-columns: 1fr; }.detail-item.wide { grid-column: auto; } }
</style>
