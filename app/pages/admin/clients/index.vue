<script setup lang="ts">
import type { ProblemDetails, ValidationProblemDetails } from '~/types/auth'
import type { Client, ClientWrite } from '~/types/client'

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
const PENDING_INVOICE_KEY = 'effisort_invoice_pending_client'
const emptyClient = (): ClientWrite => ({
  rncComprador: null,
  identificadorExtranjero: null,
  razonSocialComprador: '',
  contactoComprador: null,
  correoComprador: null,
  direccionComprador: null,
  municipioComprador: null,
  provinciaComprador: null,
  paisComprador: null,
  fechaEntrega: null,
  contactoEntrega: null,
  direccionEntrega: null,
  telefonoAdicional: null,
  codigoInternoComprador: null,
  responsablePago: null,
  informacionAdicionalComprador: null,
  tipoPrecio: null,
  tipoPago: null,
  terminoPago: null,
  activo: true,
})

const { getClients, getClient, createClient, updateClient, deactivateClient } = useClientsApi()
const route = useRoute()
const clients = ref<Client[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const includeInactive = ref(false)
const currentPage = ref(1)
const showForm = ref(false)
const editingClient = ref<Client | null>(null)
const saving = ref(false)
const formError = ref('')
const actionClientId = ref<string | null>(null)
const showDetails = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const selectedClient = ref<Client | null>(null)
const statusClient = ref<Client | null>(null)
const statusError = ref('')
const formModalElement = ref<HTMLElement | null>(null)
const detailModalElement = ref<HTMLElement | null>(null)
const statusModalElement = ref<HTMLElement | null>(null)
const clientNameInput = ref<HTMLInputElement | null>(null)
let formModalInstance: BootstrapModalInstance | null = null
let detailModalInstance: BootstrapModalInstance | null = null
let statusModalInstance: BootstrapModalInstance | null = null
let allowFormClose = false
let allowStatusClose = false
let formReturnFocus: HTMLElement | null = null
let detailReturnFocus: HTMLElement | null = null
let statusReturnFocus: HTMLElement | null = null
const form = reactive<ClientWrite>(emptyClient())

const normalizedSearch = computed(() => search.value.trim().toLocaleLowerCase('es'))
const isEditing = computed(() => Boolean(editingClient.value))

const filteredClients = computed(() => {
  if (!normalizedSearch.value) return clients.value

  return clients.value.filter((client) => {
    const searchableValues = [
      client.razonSocialComprador,
      client.rncComprador,
      client.identificadorExtranjero,
      client.codigoInternoComprador,
      client.contactoComprador,
      client.correoComprador,
      client.telefonoAdicional,
    ]

    return searchableValues.some(value =>
      value?.toLocaleLowerCase('es').includes(normalizedSearch.value),
    )
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredClients.value.length / PAGE_SIZE)))
const paginatedClients = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredClients.value.slice(start, start + PAGE_SIZE)
})
const firstVisibleItem = computed(() =>
  filteredClients.value.length ? (currentPage.value - 1) * PAGE_SIZE + 1 : 0,
)
const lastVisibleItem = computed(() =>
  Math.min(currentPage.value * PAGE_SIZE, filteredClients.value.length),
)
const activeCount = computed(() => clients.value.filter(client => client.activo).length)
const inactiveCount = computed(() => clients.value.filter(client => !client.activo).length)
const clientsWithEmail = computed(() => clients.value.filter(client => client.correoComprador).length)

watch(search, () => {
  currentPage.value = 1
})

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages
})

watch(includeInactive, async () => {
  currentPage.value = 1
  await loadClients()
})

onMounted(async () => {
  formModalElement.value?.addEventListener('shown.bs.modal', handleFormModalShown)
  formModalElement.value?.addEventListener('hide.bs.modal', handleFormModalHide)
  formModalElement.value?.addEventListener('hidden.bs.modal', handleFormModalHidden)
  detailModalElement.value?.addEventListener('shown.bs.modal', handleDetailModalShown)
  detailModalElement.value?.addEventListener('hidden.bs.modal', handleDetailModalHidden)
  statusModalElement.value?.addEventListener('hide.bs.modal', handleStatusModalHide)
  statusModalElement.value?.addEventListener('hidden.bs.modal', handleStatusModalHidden)
  await loadClients()
  if (route.query.create === '1') openCreateForm()
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
  formModalInstance = null
  detailModalInstance = null
  statusModalInstance = null
})

async function loadClients() {
  loading.value = true
  error.value = ''

  try {
    const response = await getClients(includeInactive.value)
    clients.value = Array.isArray(response) ? response : []
  } catch (caughtError: unknown) {
    const status = getErrorStatus(caughtError)

    if (status === 403) {
      error.value = 'No tienes permisos para consultar los clientes.'
    } else if (status === 429) {
      error.value = 'Se alcanzó el límite de solicitudes. Espera un momento y vuelve a intentarlo.'
    } else if (status !== 401) {
      error.value = 'No pudimos cargar los clientes. Verifica la conexión con el backend.'
    }
  } finally {
    loading.value = false
  }
}

async function openCreateForm() {
  formReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  editingClient.value = null
  Object.assign(form, emptyClient())
  formError.value = ''
  showForm.value = true
  await nextTick()
  if (!showBootstrapModal(getFormModal(), 'No pudimos abrir el formulario de clientes.')) showForm.value = false
}

async function openEditForm(client: Client) {
  formReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  editingClient.value = client
  Object.assign(form, toClientWrite(client))
  formError.value = ''
  showForm.value = true
  await nextTick()
  if (!showBootstrapModal(getFormModal(), 'No pudimos abrir el formulario de clientes.')) showForm.value = false
}

function closeForm() {
  if (saving.value) return
  getFormModal()?.hide()
}

async function openClientDetails(client: Client) {
  detailReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  selectedClient.value = client
  detailError.value = ''
  detailLoading.value = true
  showDetails.value = true
  await nextTick()
  if (!showBootstrapModal(getDetailModal(), 'No pudimos abrir el detalle del cliente.')) showDetails.value = false

  try {
    selectedClient.value = await getClient(client.id)
  } catch (caughtError: unknown) {
    if (getErrorStatus(caughtError) !== 401) {
      detailError.value = getApiErrorMessage(caughtError, 'No pudimos cargar el detalle del cliente.')
    }
  } finally {
    detailLoading.value = false
  }
}

function closeClientDetails() {
  getDetailModal()?.hide()
}

function getBootstrapModalConstructor() {
  return (window as unknown as { bootstrap?: { Modal?: BootstrapModalConstructor } }).bootstrap?.Modal ?? null
}

function getFormModal() {
  if (formModalInstance) return formModalInstance
  const bootstrap = getBootstrapModalConstructor()
  if (!formModalElement.value || !bootstrap) return null

  formModalInstance = bootstrap.getOrCreateInstance(formModalElement.value, {
    backdrop: true,
    keyboard: true,
    focus: true,
  })
  return formModalInstance
}

function getDetailModal() {
  if (detailModalInstance) return detailModalInstance
  const bootstrap = getBootstrapModalConstructor()
  if (!detailModalElement.value || !bootstrap) return null

  detailModalInstance = bootstrap.getOrCreateInstance(detailModalElement.value, {
    backdrop: true,
    keyboard: true,
    focus: true,
  })
  return detailModalInstance
}

function getStatusModal() {
  if (statusModalInstance) return statusModalInstance
  const bootstrap = getBootstrapModalConstructor()
  if (!statusModalElement.value || !bootstrap) return null

  statusModalInstance = bootstrap.getOrCreateInstance(statusModalElement.value, {
    backdrop: true,
    keyboard: true,
    focus: true,
  })
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
  clientNameInput.value?.focus()
}

function handleFormModalHide(event: Event) {
  if (saving.value && !allowFormClose) event.preventDefault()
}

function handleFormModalHidden() {
  showForm.value = false
  editingClient.value = null
  formError.value = ''
  allowFormClose = false
  formReturnFocus?.focus()
  formReturnFocus = null
}

function handleDetailModalShown() {
  showDetails.value = true
}

function handleDetailModalHidden() {
  showDetails.value = false
  selectedClient.value = null
  detailError.value = ''
  detailReturnFocus?.focus()
  detailReturnFocus = null
}

function handleStatusModalHide(event: Event) {
  if (actionClientId.value && !allowStatusClose) event.preventDefault()
}

function handleStatusModalHidden() {
  statusClient.value = null
  statusError.value = ''
  allowStatusClose = false
  statusReturnFocus?.focus()
  statusReturnFocus = null
}

async function saveClient() {
  formError.value = ''

  if (!form.razonSocialComprador.trim()) {
    formError.value = 'La razón social es obligatoria.'
    return
  }

  saving.value = true

  try {
    const payload = normalizeClientWrite(form)

    if (editingClient.value) {
      await updateClient(editingClient.value.id, payload)
      showSuccessNotification('Cliente actualizado', 'El cliente fue actualizado correctamente.')
    } else {
      const createdClient = await createClient(payload)
      showSuccessNotification('Cliente creado', 'El cliente fue creado correctamente.')

      if (route.query.returnTo === '/admin/billing/sale') {
        selectCreatedClientForPendingInvoice(createdClient.id)
        await navigateTo('/admin/billing/sale')
        return
      }
    }

    allowFormClose = true
    getFormModal()?.hide()
    await loadClients()
  } catch (caughtError: unknown) {
    if (getErrorStatus(caughtError) !== 401) {
      formError.value = getApiErrorMessage(caughtError, 'No pudimos guardar el cliente.')
    }
  } finally {
    saving.value = false
  }
}

function selectCreatedClientForPendingInvoice(clientId: string) {
  const pendingInvoice = sessionStorage.getItem(PENDING_INVOICE_KEY)
  if (!pendingInvoice) return

  try {
    const restored = JSON.parse(pendingInvoice) as Record<string, unknown>
    sessionStorage.setItem(PENDING_INVOICE_KEY, JSON.stringify({ ...restored, clientId }))
  } catch {
    sessionStorage.removeItem(PENDING_INVOICE_KEY)
  }
}

async function toggleClientStatus(client: Client) {
  statusReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  statusClient.value = client
  statusError.value = ''
  await nextTick()
  if (!showBootstrapModal(getStatusModal(), 'No pudimos abrir la confirmación.')) statusClient.value = null
}

async function confirmClientStatusChange() {
  const client = statusClient.value
  if (!client) return
  const action = client.activo ? 'desactivar' : 'reactivar'

  actionClientId.value = client.id
  statusError.value = ''

  try {
    if (client.activo) {
      await deactivateClient(client.id)
      showSuccessNotification('Cliente desactivado', 'El cliente fue desactivado correctamente.')
    } else {
      await updateClient(client.id, { ...toClientWrite(client), activo: true })
      showSuccessNotification('Cliente reactivado', 'El cliente fue reactivado correctamente.')
    }

    allowStatusClose = true
    getStatusModal()?.hide()
    await loadClients()
  } catch (caughtError: unknown) {
    if (getErrorStatus(caughtError) !== 401) {
      statusError.value = getApiErrorMessage(caughtError, `No pudimos ${action} el cliente.`)
    }
  } finally {
    actionClientId.value = null
  }
}

function toClientWrite(client: Client): ClientWrite {
  const { id: _id, tenantId: _tenantId, ...editableFields } = client
  return editableFields
}

function normalizeClientWrite(value: ClientWrite): ClientWrite {
  const nullableTextFields: (keyof ClientWrite)[] = [
    'rncComprador',
    'identificadorExtranjero',
    'contactoComprador',
    'correoComprador',
    'direccionComprador',
    'municipioComprador',
    'provinciaComprador',
    'paisComprador',
    'fechaEntrega',
    'contactoEntrega',
    'direccionEntrega',
    'telefonoAdicional',
    'codigoInternoComprador',
    'responsablePago',
    'informacionAdicionalComprador',
  ]
  const payload = { ...value, razonSocialComprador: value.razonSocialComprador.trim() }

  for (const field of nullableTextFields) {
    const fieldValue = payload[field]
    if (typeof fieldValue === 'string') {
      Object.assign(payload, { [field]: fieldValue.trim() || null })
    }
  }

  for (const field of ['tipoPrecio', 'tipoPago', 'terminoPago'] as const) {
    const fieldValue = payload[field] as number | string | null | undefined
    Object.assign(payload, {
      [field]: fieldValue === null || fieldValue === undefined || fieldValue === ''
        ? null
        : Number(fieldValue),
    })
  }

  return payload
}

function getErrorStatus(caughtError: unknown) {
  const apiError = caughtError as ApiRequestError
  return apiError.statusCode ?? apiError.status
}

function getApiErrorMessage(caughtError: unknown, fallback: string) {
  const apiError = caughtError as ApiRequestError
  const data = apiError.data

  if (typeof data === 'string' && data.trim()) return data
  if (data && typeof data === 'object') {
    if (data.detail) return data.detail
    if ('errors' in data && data.errors) {
      const firstValidationError = Object.values(data.errors).flat()[0]
      if (firstValidationError) return firstValidationError
    }
    if (data.title) return data.title
  }

  return fallback
}

function showSuccessNotification(title: string, message: string) {
  const jquery = (window as unknown as { jQuery?: TemplateNotify }).jQuery

  jquery?.notify?.(
    {
      icon: 'bi bi-check-circle-fill',
      title,
      message,
    },
    {
      type: 'success',
      placement: {
        from: 'top',
        align: 'right',
      },
      delay: 3500,
      timer: 500,
      z_index: 2000,
      animate: {
        enter: 'animated fadeInDown',
        exit: 'animated fadeOutUp',
      },
    },
  )
}

function clearSearch() {
  search.value = ''
}

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

function clientIdentifier(client: Client) {
  return client.rncComprador || client.identificadorExtranjero || 'Sin identificación'
}

function clientLocation(client: Client) {
  return [client.municipioComprador, client.provinciaComprador, client.paisComprador]
    .filter(Boolean)
    .join(', ') || 'Sin ubicación'
}

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? 'No registrado' : String(value)
}
</script>

<template>
  <div class="clients-page">
    <div class="page-header mb-4">
      <div>
        <div class="breadcrumb-line mb-2">
          <span>Administración</span>
          <i class="bi bi-chevron-right" />
          <strong>Clientes</strong>
        </div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">Consulta los clientes registrados para tu empresa.</p>
      </div>

      <div class="header-actions">
        <button type="button" class="btn btn-outline-primary effi-btn" :disabled="loading" @click="loadClients">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          <i v-else class="bi bi-arrow-clockwise me-2" />
          Actualizar
        </button>
        <button type="button" class="btn btn-primary effi-btn" @click="openCreateForm">
          <i class="bi bi-person-plus me-2" />Nuevo cliente
        </button>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-lg-4 col-md-6">
        <div class="effi-card metric-card">
          <span class="metric-icon metric-blue"><i class="bi bi-people" /></span>
          <div>
            <span class="metric-label">Clientes cargados</span>
            <strong class="metric-value">{{ clients.length }}</strong>
          </div>
        </div>
      </div>
      <div class="col-lg-4 col-md-6">
        <div class="effi-card metric-card">
          <span class="metric-icon metric-success"><i class="bi bi-person-check" /></span>
          <div>
            <span class="metric-label">Activos</span>
            <strong class="metric-value">{{ activeCount }}</strong>
            <small v-if="includeInactive && inactiveCount" class="metric-helper">{{ inactiveCount }} inactivos</small>
          </div>
        </div>
      </div>
      <div class="col-lg-4 col-md-6">
        <div class="effi-card metric-card">
          <span class="metric-icon metric-purple"><i class="bi bi-envelope-check" /></span>
          <div>
            <span class="metric-label">Con correo registrado</span>
            <strong class="metric-value">{{ clientsWithEmail }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="effi-card filters-card mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-lg-8">
          <label for="client-search" class="form-label">Buscar clientes</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-search" /></span>
            <input
              id="client-search"
              v-model="search"
              type="search"
              class="form-control effi-input"
              placeholder="Razón social, RNC, código, contacto o correo..."
            >
            <button v-if="search" type="button" class="btn btn-outline-secondary" @click="clearSearch">
              Limpiar
            </button>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="form-check form-switch inactive-switch">
            <input
              id="include-inactive"
              v-model="includeInactive"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :disabled="loading"
            >
            <label class="form-check-label" for="include-inactive">Incluir clientes inactivos</label>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger d-flex align-items-center justify-content-between gap-3" role="alert">
      <span><i class="bi bi-exclamation-triangle me-2" />{{ error }}</span>
      <button type="button" class="btn btn-sm btn-outline-danger" @click="loadClients">Reintentar</button>
    </div>

    <div class="effi-card table-card">
      <div class="table-header">
        <div>
          <h2>Listado de clientes</h2>
          <p v-if="!loading">
            <template v-if="filteredClients.length">
              Mostrando {{ firstVisibleItem }}–{{ lastVisibleItem }} de {{ filteredClients.length }} clientes.
            </template>
            <template v-else>No hay clientes para mostrar.</template>
          </p>
          <p v-else>Cargando información...</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state" aria-live="polite">
        <span class="spinner-border text-primary" aria-hidden="true" />
        <span>Cargando clientes...</span>
      </div>

      <template v-else-if="paginatedClients.length">
        <div class="table-responsive">
          <table class="table effi-table align-middle">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Identificación</th>
                <th>Contacto</th>
                <th>Ubicación</th>
                <th>Código interno</th>
                <th>Estado</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="client in paginatedClients" :key="client.id">
                <td>
                  <strong class="client-name">{{ client.razonSocialComprador }}</strong>
                  <small>{{ client.direccionComprador || 'Sin dirección registrada' }}</small>
                </td>
                <td>
                  <span>{{ clientIdentifier(client) }}</span>
                  <small>{{ client.rncComprador ? 'RNC' : client.identificadorExtranjero ? 'ID extranjero' : '' }}</small>
                </td>
                <td>
                  <span>{{ client.contactoComprador || 'Sin contacto' }}</span>
                  <small>{{ client.correoComprador || client.telefonoAdicional || 'Sin datos de contacto' }}</small>
                </td>
                <td>{{ clientLocation(client) }}</td>
                <td>{{ client.codigoInternoComprador || '—' }}</td>
                <td>
                  <span class="status-badge" :class="client.activo ? 'status-active' : 'status-inactive'">
                    {{ client.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <div class="row-actions">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      :disabled="actionClientId === client.id"
                      title="Ver detalle del cliente"
                      @click="openClientDetails(client)"
                    >
                      <i class="bi bi-eye" />
                      <span class="visually-hidden">Ver detalle</span>
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary"
                      :disabled="actionClientId === client.id"
                      title="Editar cliente"
                      @click="openEditForm(client)"
                    >
                      <i class="bi bi-pencil" />
                      <span class="visually-hidden">Editar</span>
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="client.activo ? 'btn-outline-danger' : 'btn-outline-success'"
                      :disabled="actionClientId === client.id"
                      :title="client.activo ? 'Desactivar cliente' : 'Reactivar cliente'"
                      @click="toggleClientStatus(client)"
                    >
                      <span v-if="actionClientId === client.id" class="spinner-border spinner-border-sm" />
                      <i v-else :class="client.activo ? 'bi bi-person-dash' : 'bi bi-person-check'" />
                      <span class="visually-hidden">{{ client.activo ? 'Desactivar' : 'Reactivar' }}</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <nav v-if="totalPages > 1" class="pagination-wrap" aria-label="Paginación de clientes">
          <span>Página {{ currentPage }} de {{ totalPages }}</span>
          <div class="btn-group">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              Anterior
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              Siguiente
            </button>
          </div>
        </nav>
      </template>

      <div v-else class="empty-state">
        <span class="empty-icon"><i class="bi bi-people" /></span>
        <h3>{{ search ? 'No encontramos coincidencias' : 'Aún no hay clientes registrados' }}</h3>
        <p>{{ search ? 'Prueba con otro nombre, RNC, código o correo.' : 'Los clientes aparecerán aquí cuando sean registrados.' }}</p>
        <button v-if="search" type="button" class="btn btn-outline-primary" @click="clearSearch">Limpiar búsqueda</button>
        <button v-else type="button" class="btn btn-primary" @click="openCreateForm">Registrar cliente</button>
      </div>
    </div>

    <Teleport to="body">
      <div ref="formModalElement" class="modal fade" tabindex="-1" aria-labelledby="client-form-title" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <form class="modal-content client-bootstrap-modal" @submit.prevent="saveClient">
            <div class="modal-header client-modal-header">
              <div>
                <span class="modal-eyebrow">Mantenimiento de clientes</span>
                <h2 id="client-form-title">{{ isEditing ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
                <p>{{ isEditing ? 'Actualiza los datos registrados.' : 'Completa la información del nuevo cliente.' }}</p>
              </div>
              <button type="button" class="btn-close" aria-label="Cerrar" :disabled="saving" @click="closeForm" />
            </div>

            <div class="modal-body client-modal-body">
              <div v-if="formError" class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle me-2" />{{ formError }}
              </div>

              <section class="form-section">
                <div class="form-section-title">
                  <i class="bi bi-building" />
                  <div><h3>Información fiscal</h3><p>Identificación y datos principales del cliente.</p></div>
                </div>
                <div class="row g-3">
                  <div class="col-md-8">
                    <label for="client-name" class="form-label">Razón social <span class="required">*</span></label>
                    <input id="client-name" ref="clientNameInput" v-model="form.razonSocialComprador" class="form-control" maxlength="150" required autocomplete="organization">
                  </div>
                  <div class="col-md-4">
                    <label for="client-code" class="form-label">Código interno</label>
                    <input id="client-code" v-model="form.codigoInternoComprador" class="form-control" maxlength="20">
                  </div>
                  <div class="col-md-3">
                    <label for="client-rnc" class="form-label">RNC/Cédula</label>
                    <input id="client-rnc" v-model="form.rncComprador" class="form-control" maxlength="11" inputmode="numeric">
                  </div>
                  <div class="col-md-3">
                    <label for="client-foreign-id" class="form-label">Identificador extranjero</label>
                    <input id="client-foreign-id" v-model="form.identificadorExtranjero" class="form-control" maxlength="20">
                  </div>
                  <div class="col-md-3">
                    <label for="client-country" class="form-label">País</label>
                    <input id="client-country" v-model="form.paisComprador" class="form-control" maxlength="60" placeholder="DO">
                  </div>
                  <div class="col-md-3">
                    <label for="client-active" class="form-label">Cliente activo</label>
                    <select id="client-active" v-model="form.activo" class="form-select">
                      <option :value="true">Sí</option>
                      <option :value="false">No</option>
                    </select>
                  </div>
                </div>
              </section>

              <section class="form-section">
                <div class="form-section-title">
                  <i class="bi bi-person-lines-fill" />
                  <div><h3>Contacto y ubicación</h3><p>Datos para comunicación y facturación.</p></div>
                </div>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label for="client-contact" class="form-label">Contacto</label>
                    <input id="client-contact" v-model="form.contactoComprador" class="form-control" maxlength="80" autocomplete="name">
                  </div>
                  <div class="col-md-6">
                    <label for="client-email" class="form-label">Correo electrónico</label>
                    <input id="client-email" v-model="form.correoComprador" type="email" class="form-control" maxlength="80" autocomplete="email">
                  </div>
                  <div class="col-md-8">
                    <label for="client-address" class="form-label">Dirección</label>
                    <input id="client-address" v-model="form.direccionComprador" class="form-control" maxlength="100" autocomplete="street-address">
                  </div>
                  <div class="col-md-4">
                    <label for="client-phone" class="form-label">Teléfono adicional</label>
                    <input id="client-phone" v-model="form.telefonoAdicional" type="tel" class="form-control" maxlength="12" autocomplete="tel">
                  </div>
                  <div class="col-md-6">
                    <label for="client-province" class="form-label">Provincia</label>
                    <input id="client-province" v-model="form.provinciaComprador" class="form-control" maxlength="10">
                  </div>
                  <div class="col-md-6">
                    <label for="client-municipality" class="form-label">Municipio</label>
                    <input id="client-municipality" v-model="form.municipioComprador" class="form-control" maxlength="10">
                  </div>
                </div>
              </section>

              <section class="form-section" hidden>
                <div class="form-section-title">
                  <i class="bi bi-truck" />
                  <div><h3>Entrega y condiciones comerciales</h3><p>Información opcional para la operación.</p></div>
                </div>
                <div class="row g-3">
                  <div class="col-md-4">
                    <label for="client-delivery-date" class="form-label">Fecha de entrega</label>
                    <input id="client-delivery-date" v-model="form.fechaEntrega" type="date" class="form-control">
                  </div>
                  <div class="col-md-8">
                    <label for="client-delivery-contact" class="form-label">Contacto de entrega</label>
                    <input id="client-delivery-contact" v-model="form.contactoEntrega" class="form-control" maxlength="100">
                  </div>
                  <div class="col-12">
                    <label for="client-delivery-address" class="form-label">Dirección de entrega</label>
                    <input id="client-delivery-address" v-model="form.direccionEntrega" class="form-control" maxlength="100">
                  </div>
                  <div class="col-md-4">
                    <label for="client-price-type" class="form-label">Tipo de precio</label>
                    <input id="client-price-type" v-model.number="form.tipoPrecio" type="number" class="form-control" min="0">
                  </div>
                  <div class="col-md-4">
                    <label for="client-payment-type" class="form-label">Tipo de pago</label>
                    <input id="client-payment-type" v-model.number="form.tipoPago" type="number" class="form-control" min="0">
                  </div>
                  <div class="col-md-4">
                    <label for="client-payment-term" class="form-label">Término de pago</label>
                    <input id="client-payment-term" v-model.number="form.terminoPago" type="number" class="form-control" min="0">
                  </div>
                  <div class="col-md-6">
                    <label for="client-payment-owner" class="form-label">Responsable de pago</label>
                    <input id="client-payment-owner" v-model="form.responsablePago" class="form-control" maxlength="20">
                  </div>
                  <div class="col-12">
                    <label for="client-notes" class="form-label">Información adicional</label>
                    <textarea id="client-notes" v-model="form.informacionAdicionalComprador" class="form-control" rows="3" maxlength="150"></textarea>
                  </div>
                </div>
              </section>
            </div>

            <div class="modal-footer client-modal-footer">
              <button type="button" class="btn btn-outline-secondary" :disabled="saving" @click="closeForm">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2" />
                {{ saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear cliente' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div ref="detailModalElement" class="modal fade" tabindex="-1" aria-labelledby="client-detail-title" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content client-bootstrap-modal">
          <div class="modal-header client-modal-header">
            <div>
              <span class="modal-eyebrow">Detalle del cliente</span>
              <h2 id="client-detail-title">{{ selectedClient?.razonSocialComprador || 'Cliente' }}</h2>
              <p>Información completa registrada para este cliente.</p>
            </div>
            <button type="button" class="btn-close" aria-label="Cerrar" @click="closeClientDetails" />
          </div>

          <div class="modal-body client-modal-body detail-modal-body">
            <div v-if="detailError" class="alert alert-danger" role="alert">
              <i class="bi bi-exclamation-triangle me-2" />{{ detailError }}
            </div>

            <div v-if="detailLoading" class="detail-loading">
              <span class="spinner-border text-primary" aria-hidden="true" />
              <span>Cargando detalle...</span>
            </div>

            <template v-else-if="selectedClient">
              <section class="detail-section">
                <div class="form-section-title">
                  <i class="bi bi-building" />
                  <div><h3>Información fiscal</h3><p>Identificación y estado del cliente.</p></div>
                </div>
                <dl class="detail-grid">
                  <div class="detail-item detail-item-wide"><dt>Razón social</dt><dd>{{ displayValue(selectedClient.razonSocialComprador) }}</dd></div>
                  <div class="detail-item"><dt>Código interno</dt><dd>{{ displayValue(selectedClient.codigoInternoComprador) }}</dd></div>
                  <div class="detail-item"><dt>RNC/Cédula</dt><dd>{{ displayValue(selectedClient.rncComprador) }}</dd></div>
                  <div class="detail-item"><dt>Identificador extranjero</dt><dd>{{ displayValue(selectedClient.identificadorExtranjero) }}</dd></div>
                  <div class="detail-item"><dt>País</dt><dd>{{ displayValue(selectedClient.paisComprador) }}</dd></div>
                  <div class="detail-item">
                    <dt>Estado</dt>
                    <dd><span class="status-badge" :class="selectedClient.activo ? 'status-active' : 'status-inactive'">{{ selectedClient.activo ? 'Activo' : 'Inactivo' }}</span></dd>
                  </div>
                </dl>
              </section>

              <section class="detail-section">
                <div class="form-section-title">
                  <i class="bi bi-person-lines-fill" />
                  <div><h3>Contacto y ubicación</h3><p>Información para comunicación y facturación.</p></div>
                </div>
                <dl class="detail-grid">
                  <div class="detail-item"><dt>Contacto</dt><dd>{{ displayValue(selectedClient.contactoComprador) }}</dd></div>
                  <div class="detail-item"><dt>Correo electrónico</dt><dd>{{ displayValue(selectedClient.correoComprador) }}</dd></div>
                  <div class="detail-item"><dt>Teléfono adicional</dt><dd>{{ displayValue(selectedClient.telefonoAdicional) }}</dd></div>
                  <div class="detail-item detail-item-wide"><dt>Dirección</dt><dd>{{ displayValue(selectedClient.direccionComprador) }}</dd></div>
                  <div class="detail-item"><dt>Provincia</dt><dd>{{ displayValue(selectedClient.provinciaComprador) }}</dd></div>
                  <div class="detail-item"><dt>Municipio</dt><dd>{{ displayValue(selectedClient.municipioComprador) }}</dd></div>
                </dl>
              </section>

              <section class="detail-section">
                <div class="form-section-title">
                  <i class="bi bi-truck" />
                  <div><h3>Entrega</h3><p>Datos definidos para la recepción.</p></div>
                </div>
                <dl class="detail-grid">
                  <div class="detail-item"><dt>Fecha de entrega</dt><dd>{{ displayValue(selectedClient.fechaEntrega) }}</dd></div>
                  <div class="detail-item"><dt>Contacto de entrega</dt><dd>{{ displayValue(selectedClient.contactoEntrega) }}</dd></div>
                  <div class="detail-item detail-item-wide"><dt>Dirección de entrega</dt><dd>{{ displayValue(selectedClient.direccionEntrega) }}</dd></div>
                </dl>
              </section>

              <section class="detail-section">
                <div class="form-section-title">
                  <i class="bi bi-cash-coin" />
                  <div><h3>Condiciones comerciales</h3><p>Configuración de precios y pagos.</p></div>
                </div>
                <dl class="detail-grid">
                  <div class="detail-item"><dt>Tipo de precio</dt><dd>{{ displayValue(selectedClient.tipoPrecio) }}</dd></div>
                  <div class="detail-item"><dt>Tipo de pago</dt><dd>{{ displayValue(selectedClient.tipoPago) }}</dd></div>
                  <div class="detail-item"><dt>Término de pago</dt><dd>{{ displayValue(selectedClient.terminoPago) }}</dd></div>
                  <div class="detail-item"><dt>Responsable de pago</dt><dd>{{ displayValue(selectedClient.responsablePago) }}</dd></div>
                  <div class="detail-item detail-item-full"><dt>Información adicional</dt><dd>{{ displayValue(selectedClient.informacionAdicionalComprador) }}</dd></div>
                </dl>
              </section>
            </template>
          </div>

          <div class="modal-footer client-modal-footer">
            <button type="button" class="btn btn-outline-secondary" @click="closeClientDetails">Cerrar</button>
          </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div ref="statusModalElement" class="modal fade" tabindex="-1" aria-labelledby="client-status-title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content status-confirmation-modal">
            <div class="modal-header border-0 pb-0">
              <h2 id="client-status-title" class="modal-title fs-5">
                {{ statusClient?.activo ? 'Desactivar cliente' : 'Reactivar cliente' }}
              </h2>
              <button type="button" class="btn-close" aria-label="Cerrar" :disabled="Boolean(actionClientId)" @click="getStatusModal()?.hide()" />
            </div>

            <div class="modal-body status-confirmation-body">
              <div class="status-confirmation-icon" :class="statusClient?.activo ? 'danger' : 'success'">
                <i class="bi" :class="statusClient?.activo ? 'bi-person-dash' : 'bi-person-check'" />
              </div>
              <div>
                <p class="mb-1">
                  ¿Deseas {{ statusClient?.activo ? 'desactivar' : 'reactivar' }} a
                  <strong>{{ statusClient?.razonSocialComprador }}</strong>?
                </p>
                <small class="text-muted">
                  {{ statusClient?.activo ? 'El cliente dejará de aparecer en los listados activos, pero sus datos se conservarán.' : 'El cliente volverá a estar disponible para las operaciones.' }}
                </small>
              </div>
            </div>

            <div v-if="statusError" class="alert alert-danger mx-3 mb-0" role="alert">
              <i class="bi bi-exclamation-triangle me-2" />{{ statusError }}
            </div>

            <div class="modal-footer border-0">
              <button type="button" class="btn btn-outline-secondary" :disabled="Boolean(actionClientId)" @click="getStatusModal()?.hide()">Cancelar</button>
              <button
                type="button"
                class="btn"
                :class="statusClient?.activo ? 'btn-danger' : 'btn-success'"
                :disabled="Boolean(actionClientId)"
                @click="confirmClientStatusChange"
              >
                <span v-if="actionClientId" class="spinner-border spinner-border-sm me-2" />
                {{ actionClientId ? 'Procesando...' : statusClient?.activo ? 'Sí, desactivar' : 'Sí, reactivar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.clients-page {
  color: #101828;
}

.page-header,
.table-header,
.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-actions,
.row-actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.row-actions {
  justify-content: flex-end;
  min-width: 116px;
}

.breadcrumb-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #667085;
  font-size: 0.84rem;
}

.breadcrumb-line i {
  font-size: 0.7rem;
  color: #98a2b3;
}

.page-title {
  margin-bottom: 0.35rem;
  color: #101828;
  font-size: 1.8rem;
  font-weight: 700;
}

.page-subtitle,
.table-header p {
  margin-bottom: 0;
  color: #667085;
}

.effi-card {
  padding: 1.35rem;
  border: 1px solid #e5eaf2;
  border-radius: 16px;
  background: #fff;
}

.effi-btn {
  min-height: 42px;
  border-radius: 10px;
  font-weight: 600;
}

.metric-card {
  display: flex;
  min-height: 108px;
  align-items: center;
  gap: 1rem;
}

.metric-icon {
  display: inline-flex;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 1.3rem;
}

.metric-blue {
  color: #0d6efd;
  background: #eef5ff;
}

.metric-success {
  color: #16a34a;
  background: #eaf8ee;
}

.metric-purple {
  color: #6941c6;
  background: #f2edff;
}

.metric-label,
.metric-helper {
  display: block;
  color: #667085;
  font-size: 0.8rem;
}

.metric-value {
  display: block;
  margin-top: 0.1rem;
  font-size: 1.4rem;
  line-height: 1.2;
}

.input-group-text,
.effi-input {
  min-height: 44px;
  border-color: #d9e1ec;
}

.inactive-switch {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.table-header {
  padding: 1.35rem;
  border-bottom: 1px solid #edf0f5;
}

.table-header h2 {
  margin-bottom: 0.2rem;
  font-size: 1rem;
  font-weight: 700;
}

.table-header p {
  font-size: 0.84rem;
}

.effi-table {
  margin-bottom: 0;
}

.effi-table thead th {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #e5eaf2;
  background: #f8fafc;
  color: #667085;
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
}

.effi-table tbody td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #edf0f5;
  color: #344054;
  font-size: 0.82rem;
  vertical-align: middle;
}

.effi-table tbody tr:last-child td {
  border-bottom: 0;
}

.effi-table td span,
.effi-table td strong,
.effi-table td small {
  display: block;
}

.effi-table td small {
  margin-top: 0.15rem;
  color: #667085;
}

.client-name {
  max-width: 260px;
  overflow: hidden;
  color: #101828;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex !important;
  padding: 0.38rem 0.65rem;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 700;
}

.status-active {
  color: #15803d;
  background: #eaf8ee;
}

.status-inactive {
  color: #667085;
  background: #f2f4f7;
}

.loading-state,
.empty-state {
  display: flex;
  min-height: 280px;
  padding: 2rem;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.8rem;
  color: #667085;
  text-align: center;
}

.empty-state h3 {
  margin: 0;
  color: #344054;
  font-size: 1.05rem;
}

.empty-state p {
  max-width: 440px;
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

.pagination-wrap {
  padding: 1rem 1.35rem;
  border-top: 1px solid #edf0f5;
  color: #667085;
  font-size: 0.82rem;
}

.client-bootstrap-modal {
  overflow: hidden;
  border: 0;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
}

.status-confirmation-modal {
  overflow: hidden;
  border: 0;
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
}

.status-confirmation-body {
  display: flex;
  padding-top: 1.25rem;
  align-items: flex-start;
  gap: 1rem;
  color: #344054;
}

.status-confirmation-icon {
  display: inline-flex;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.2rem;
}

.status-confirmation-icon.danger {
  background: #fff1f2;
  color: #dc3545;
}

.status-confirmation-icon.success {
  background: #ecfdf3;
  color: #198754;
}

.client-modal-header,
.client-modal-footer {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
}

.client-modal-header {
  border-bottom: 1px solid #e5eaf2;
}

.client-modal-header h2 {
  margin: 0.15rem 0 0.25rem;
  color: #101828;
  font-size: 1.3rem;
  font-weight: 700;
}

.client-modal-header p,
.form-section-title p {
  margin: 0;
  color: #667085;
  font-size: 0.82rem;
}

.modal-eyebrow {
  color: #0d6efd;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.client-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.client-modal-footer {
  align-items: center;
  justify-content: flex-end;
  border-top: 1px solid #e5eaf2;
  background: #f8fafc;
}

.client-modal-footer .btn {
  min-width: 120px;
}

.form-section + .form-section {
  margin-top: 1.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #edf0f5;
}

.form-section-title {
  display: flex;
  margin-bottom: 1rem;
  align-items: flex-start;
  gap: 0.75rem;
}

.form-section-title > i {
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

.form-section-title h3 {
  margin: 0 0 0.15rem;
  color: #344054;
  font-size: 0.95rem;
  font-weight: 700;
}

.client-bootstrap-modal .form-label {
  margin-bottom: 0.4rem;
  color: #344054;
  font-size: 0.8rem;
  font-weight: 600;
}

.client-bootstrap-modal .form-control,
.client-bootstrap-modal .form-select {
  min-height: 42px;
  border-color: #d9e1ec;
  border-radius: 9px;
}

.client-bootstrap-modal textarea.form-control {
  min-height: auto;
}

.detail-modal-body {
  min-height: 260px;
}

.detail-loading {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.75rem;
  color: #667085;
}

.detail-section + .detail-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #edf0f5;
}

.detail-grid {
  display: grid;
  margin: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.detail-item {
  min-width: 0;
  padding: 0.85rem 1rem;
  border: 1px solid #e5eaf2;
  border-radius: 10px;
  background: #f8fafc;
}

.detail-item-wide {
  grid-column: span 2;
}

.detail-item-full {
  grid-column: 1 / -1;
}

.detail-item dt {
  margin-bottom: 0.3rem;
  color: #667085;
  font-size: 0.72rem;
  font-weight: 600;
}

.detail-item dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: #101828;
  font-size: 0.86rem;
  font-weight: 600;
}

.required {
  color: #dc3545;
}

@media (max-width: 767.98px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn {
    flex: 1;
  }

  .pagination-wrap {
    align-items: flex-start;
    flex-direction: column;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-item-wide,
  .detail-item-full {
    grid-column: auto;
  }

  .client-modal-header,
  .client-modal-body,
  .client-modal-footer {
    padding-right: 1rem;
    padding-left: 1rem;
  }
}
</style>
