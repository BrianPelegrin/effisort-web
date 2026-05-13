<template>
    <div class="container-fluid py-3">
        <!-- Header -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
            <div>
                <h2 class="fw-bold mb-1 d-flex align-items-center gap-2">
                    <i class="fas fa-file-invoice-dollar text-primary"></i>
                    Facturación
                </h2>
                <p class="text-muted mb-0">
                    Gestión de factura y generación de facturación electrónica (e-CF)
                </p>
            </div>

            <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-light border" @click="resetForm">
                    <i class="fas fa-rotate-left me-2"></i>Nuevo
                </button>
                <button class="btn btn-outline-secondary">
                    <i class="fas fa-print me-2"></i>Imprimir
                </button>
                <button class="btn btn-primary" @click="saveDraft">
                    <i class="fas fa-floppy-disk me-2"></i>Guardar borrador
                </button>
            </div>
        </div>

        <div class="row g-4">
            <!-- Columna principal -->
            <div class="col-xl-8">
                <!-- Datos generales -->
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-header bg-white border-0 pt-3 pb-0">
                        <h5 class="card-title mb-1">Datos de la factura</h5>
                        <small class="text-muted">Información general del comprobante</small>
                    </div>

                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <label class="form-label">No. Factura</label>
                                <input v-model="invoice.number" type="text" class="form-control"
                                    placeholder="FAC-000123" />
                            </div>

                            <div class="col-md-4">
                                <label class="form-label">Fecha emisión</label>
                                <input v-model="invoice.issueDate" type="date" class="form-control" />
                            </div>

                            <div class="col-md-4">
                                <label class="form-label">Fecha vencimiento</label>
                                <input v-model="invoice.dueDate" type="date" class="form-control" />
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Sucursal / Caja</label>
                                <select v-model="invoice.branch" class="form-select">
                                    <option>Sucursal Principal</option>
                                    <option>Sucursal Norte</option>
                                    <option>Sucursal Este</option>
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Método de pago</label>
                                <select v-model="invoice.paymentMethod" class="form-select">
                                    <option>Efectivo</option>
                                    <option>Tarjeta</option>
                                    <option>Transferencia</option>
                                    <option>Crédito</option>
                                </select>
                            </div>

                            <div class="col-12">
                                <label class="form-label">Observaciones</label>
                                <textarea v-model="invoice.notes" class="form-control" rows="2"
                                    placeholder="Notas internas o comentarios de la factura..." />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Cliente -->
                <div class="card shadow-sm border-0 mb-4">
                    <div
                        class="card-header bg-white border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="card-title mb-1">Cliente</h5>
                            <small class="text-muted">Datos fiscales y de contacto</small>
                        </div>
                        <button class="btn btn-sm btn-outline-primary" @click="openCustomerModal">
                            <i class="fas fa-magnifying-glass me-1"></i>Buscar cliente
                        </button>
                    </div>

                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Nombre / Razón social</label>
                                <input v-model="customer.name" type="text" class="form-control"
                                    placeholder="Empresa XYZ, SRL" />
                            </div>

                            <div class="col-md-3">
                                <label class="form-label">RNC / Cédula</label>
                                <input v-model="customer.taxId" type="text" class="form-control"
                                    placeholder="131234567" />
                            </div>

                            <div class="col-md-3">
                                <label class="form-label">Tipo cliente</label>
                                <select v-model="customer.type" class="form-select">
                                    <option>Consumidor final</option>
                                    <option>Crédito fiscal</option>
                                    <option>Gubernamental</option>
                                    <option>Exportación</option>
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Correo</label>
                                <input v-model="customer.email" type="email" class="form-control"
                                    placeholder="cliente@empresa.com" />
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Teléfono</label>
                                <input v-model="customer.phone" type="text" class="form-control"
                                    placeholder="809-000-0000" />
                            </div>

                            <div class="col-12">
                                <label class="form-label">Dirección</label>
                                <input v-model="customer.address" type="text" class="form-control"
                                    placeholder="Dirección del cliente" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Productos / Servicios -->
                <div class="card shadow-sm border-0">
                    <div
                        class="card-header bg-white border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="card-title mb-1">Detalle de productos / servicios</h5>
                            <small class="text-muted">Agrega los conceptos de la factura</small>
                        </div>

                        <button class="btn btn-sm btn-primary" @click="addItem">
                            <i class="fas fa-plus me-1"></i>Agregar línea
                        </button>
                    </div>

                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th style="min-width: 260px">Descripción</th>
                                        <th style="width: 120px">Cantidad</th>
                                        <th style="width: 140px">Precio</th>
                                        <th style="width: 120px">ITBIS %</th>
                                        <th style="width: 160px">Total línea</th>
                                        <th style="width: 70px"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, index) in items" :key="item.id">
                                        <td>
                                            <input v-model="item.description" type="text" class="form-control"
                                                placeholder="Descripción del producto o servicio" />
                                        </td>
                                        <td>
                                            <input v-model.number="item.qty" type="number" min="1" step="1"
                                                class="form-control text-end" />
                                        </td>
                                        <td>
                                            <div class="input-group">
                                                <span class="input-group-text">RD$</span>
                                                <input v-model.number="item.price" type="number" min="0" step="0.01"
                                                    class="form-control text-end" />
                                            </div>
                                        </td>
                                        <td>
                                            <select v-model.number="item.taxRate" class="form-select">
                                                <option :value="0">0%</option>
                                                <option :value="18">18%</option>
                                                <option :value="16">16%</option>
                                            </select>
                                        </td>
                                        <td class="fw-semibold text-end">{{ formatCurrency(lineTotal(item)) }}</td>
                                        <td class="text-end">
                                            <button class="btn btn-sm btn-outline-danger" @click="removeItem(index)"
                                                :disabled="items.length === 1" title="Eliminar línea">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="d-flex justify-content-end mt-3">
                            <button class="btn btn-outline-primary btn-sm" @click="addDemoItems">
                                <i class="fas fa-wand-magic-sparkles me-1"></i>Cargar ejemplo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sidebar resumen + e-CF -->
            <div class="col-xl-4">
                <!-- Facturación electrónica -->
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-header bg-white border-0 pt-3 pb-0">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="card-title mb-1">Facturación electrónica</h5>
                                <small class="text-muted">Configuración e-CF para generación</small>
                            </div>
                            <div class="form-check form-switch m-0">
                                <input id="ecfSwitch" v-model="eInvoice.enabled" class="form-check-input"
                                    type="checkbox" />
                                <label class="form-check-label ms-1" for="ecfSwitch"></label>
                            </div>
                        </div>
                    </div>

                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-6 col-xl-12">
                                <label class="form-label">Tipo e-CF</label>
                                <select v-model="eInvoice.ecfType" class="form-select" :disabled="!eInvoice.enabled">
                                    <option value="E31">E31 - Crédito Fiscal</option>
                                    <option value="E32">E32 - Consumo</option>
                                    <option value="E33">E33 - Nota de Débito</option>
                                    <option value="E34">E34 - Nota de Crédito</option>
                                    <option value="E44">E44 - Régimen especial</option>
                                </select>
                            </div>

                            <div class="col-md-6 col-xl-12">
                                <label class="form-label">e-NCF</label>
                                <input v-model="eInvoice.eNcf" type="text" class="form-control"
                                    placeholder="E320000000001" :disabled="!eInvoice.enabled" />
                            </div>

                            <div class="col-md-6 col-xl-12">
                                <label class="form-label">TrackId / Secuencia</label>
                                <input v-model="eInvoice.trackId" type="text" class="form-control"
                                    placeholder="DGII-TRACK-000123" :disabled="!eInvoice.enabled" />
                            </div>

                            <div class="col-md-6 col-xl-12">
                                <label class="form-label">Estado</label>
                                <select v-model="eInvoice.status" class="form-select" :disabled="!eInvoice.enabled">
                                    <option>Pendiente</option>
                                    <option>Generada</option>
                                    <option>Rechazada</option>
                                    <option>Error de validación</option>
                                </select>
                            </div>

                            <div class="col-12">
                                <label class="form-label">Mensaje / Respuesta</label>
                                <textarea v-model="eInvoice.responseMessage" class="form-control" rows="3"
                                    :disabled="!eInvoice.enabled"
                                    placeholder="Respuesta del proceso de generación..." />
                            </div>
                        </div>

                        <hr />

                        <div class="d-grid">
                            <button class="btn btn-success" :disabled="!eInvoice.enabled" @click="generateInvoice">
                                <i class="fas fa-file-circle-check me-2"></i>Generar factura
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Resumen -->
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-header bg-white border-0 pt-3 pb-0">
                        <h5 class="card-title mb-1">Resumen de factura</h5>
                        <small class="text-muted">Totales y estado general</small>
                    </div>

                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">Subtotal</span>
                            <span class="fw-medium">{{ formatCurrency(subtotal) }}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">ITBIS</span>
                            <span class="fw-medium">{{ formatCurrency(taxTotal) }}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-3">
                            <span class="text-muted">Descuento</span>
                            <span class="fw-medium">{{ formatCurrency(discount) }}</span>
                        </div>

                        <div class="bg-light rounded-3 p-3 mb-3 border">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="fw-semibold">Total a pagar</span>
                                <span class="fs-4 fw-bold text-primary">{{ formatCurrency(grandTotal) }}</span>
                            </div>
                        </div>

                        <div class="d-flex flex-wrap gap-2">
                            <span class="badge text-bg-light border">Items: {{ items.length }}</span>
                            <span class="badge" :class="statusBadgeClass">
                                {{ eInvoice.enabled ? `e-CF: ${eInvoice.status}` : 'e-CF desactivada' }}
                            </span>
                            <span class="badge text-bg-info">Pago: {{ invoice.paymentMethod }}</span>
                        </div>
                    </div>
                </div>

                <!-- Panel de validación -->
                <div class="card shadow-sm border-0">
                    <div class="card-header bg-white border-0 pt-3 pb-0">
                        <h5 class="card-title mb-1">Validaciones rápidas</h5>
                        <small class="text-muted">Chequeos previos antes de guardar / generar</small>
                    </div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item px-0 d-flex justify-content-between align-items-center">
                                Cliente seleccionado
                                <i :class="validationIcon(!!customer.name)"></i>
                            </li>
                            <li class="list-group-item px-0 d-flex justify-content-between align-items-center">
                                RNC/Cédula
                                <i :class="validationIcon(!!customer.taxId)"></i>
                            </li>
                            <li class="list-group-item px-0 d-flex justify-content-between align-items-center">
                                Al menos 1 línea
                                <i :class="validationIcon(items.length > 0)"></i>
                            </li>
                            <li class="list-group-item px-0 d-flex justify-content-between align-items-center">
                                Total mayor a 0
                                <i :class="validationIcon(grandTotal > 0)"></i>
                            </li>
                            <li class="list-group-item px-0 d-flex justify-content-between align-items-center">
                                e-CF configurado (si aplica)
                                <i :class="validationIcon(!eInvoice.enabled || !!eInvoice.ecfType)"></i>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Buscar Cliente -->
        <div v-if="showCustomerModal" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title mb-0">Buscar cliente</h5>
                            <small class="text-muted">Selecciona un cliente para cargar sus datos en la factura</small>
                        </div>
                        <button type="button" class="btn-close" @click="closeCustomerModal"></button>
                    </div>

                    <div class="modal-body">
                        <div class="row g-3 mb-3">
                            <div class="col-md-8">
                                <label class="form-label">Buscar por nombre, RNC o correo</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fas fa-magnifying-glass"></i></span>
                                    <input v-model="customerSearch" type="text" class="form-control"
                                        placeholder="Ej: Carol, 131234567, facturas@empresa.com" />
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Tipo</label>
                                <select v-model="customerTypeFilter" class="form-select">
                                    <option value="">Todos</option>
                                    <option value="Consumidor final">Consumidor final</option>
                                    <option value="Crédito fiscal">Crédito fiscal</option>
                                    <option value="Gubernamental">Gubernamental</option>
                                    <option value="Exportación">Exportación</option>
                                </select>
                            </div>
                        </div>

                        <div class="table-responsive border rounded-3">
                            <table class="table align-middle mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>Cliente</th>
                                        <th>RNC / Cédula</th>
                                        <th>Tipo</th>
                                        <th>Correo</th>
                                        <th>Teléfono</th>
                                        <th class="text-end" style="width: 120px;">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="filteredCustomers.length === 0">
                                        <td colspan="6" class="text-center text-muted py-4">
                                            No se encontraron clientes con ese criterio.
                                        </td>
                                    </tr>

                                    <tr v-for="client in filteredCustomers" :key="client.id">
                                        <td>
                                            <div class="fw-semibold">{{ client.name }}</div>
                                            <small class="text-muted">{{ client.address }}</small>
                                        </td>
                                        <td>{{ client.taxId }}</td>
                                        <td>
                                            <span class="badge text-bg-light border">{{ client.type }}</span>
                                        </td>
                                        <td>{{ client.email }}</td>
                                        <td>{{ client.phone }}</td>
                                        <td class="text-end">
                                            <button class="btn btn-sm btn-primary" @click="selectCustomer(client)">
                                                Seleccionar
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-light border" @click="closeCustomerModal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="showCustomerModal" class="modal-backdrop fade show"></div>
    </div>
</template>

<script setup lang="ts">
interface InvoiceItem {
    id: number
    description: string
    qty: number
    price: number
    taxRate: number
}

interface CustomerCatalogItem {
    id: number
    name: string
    taxId: string
    type: 'Consumidor final' | 'Crédito fiscal' | 'Gubernamental' | 'Exportación'
    email: string
    phone: string
    address: string
}

const invoice = reactive({
    number: 'FAC-000123',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    branch: 'Sucursal Principal',
    paymentMethod: 'Transferencia',
    notes: ''
})

const customer = reactive({
    name: '',
    taxId: '',
    type: 'Consumidor final',
    email: '',
    phone: '',
    address: ''
})

const eInvoice = reactive({
    enabled: true,
    ecfType: 'E32',
    eNcf: '',
    trackId: '',
    status: 'Pendiente',
    responseMessage: ''
})

const discount = ref(0)

const items = ref<InvoiceItem[]>([
    {
        id: 1,
        description: '',
        qty: 1,
        price: 0,
        taxRate: 18
    }
])

let nextItemId = 2

const lineTotal = (item: InvoiceItem) => {
    const base = (Number(item.qty) || 0) * (Number(item.price) || 0)
    const tax = base * ((Number(item.taxRate) || 0) / 100)
    return base + tax
}

const subtotal = computed(() =>
    items.value.reduce((acc, item) => acc + ((item.qty || 0) * (item.price || 0)), 0)
)

const taxTotal = computed(() =>
    items.value.reduce((acc, item) => {
        const base = (item.qty || 0) * (item.price || 0)
        return acc + (base * ((item.taxRate || 0) / 100))
    }, 0)
)

const grandTotal = computed(() => Math.max(0, subtotal.value + taxTotal.value - discount.value))

const addItem = () => {
    items.value.push({
        id: nextItemId++,
        description: '',
        qty: 1,
        price: 0,
        taxRate: 18
    })
}

const removeItem = (index: number) => {
    if (items.value.length > 1) {
        items.value.splice(index, 1)
    }
}

const addDemoItems = () => {
    items.value = [
        { id: 1, description: 'Servicio de soporte técnico mensual', qty: 1, price: 15000, taxRate: 18 },
        { id: 2, description: 'Licencia de plataforma (1 usuario)', qty: 2, price: 3500, taxRate: 18 }
    ]
    nextItemId = 3

    customer.name = 'Empresa Demo SRL'
    customer.taxId = '131234567'
    customer.email = 'facturas@empresademo.com'
    customer.phone = '809-555-0199'
    customer.address = 'Santo Domingo, República Dominicana'
    customer.type = 'Crédito fiscal'
}

const generateInvoice = () => {
    eInvoice.status = 'Pendiente'
    eInvoice.trackId = eInvoice.trackId || `DGII-${Date.now()}`
    eInvoice.responseMessage = 'Factura generada y enviada a procesamiento electrónico.'
}

const saveDraft = () => {
    console.log('Guardando borrador...', {
        invoice,
        customer,
        items: items.value,
        eInvoice,
        totals: {
            subtotal: subtotal.value,
            taxTotal: taxTotal.value,
            discount: discount.value,
            grandTotal: grandTotal.value
        }
    })
}

const resetForm = () => {
    invoice.number = ''
    invoice.notes = ''
    customer.name = ''
    customer.taxId = ''
    customer.email = ''
    customer.phone = ''
    customer.address = ''
    customer.type = 'Consumidor final'

    eInvoice.enabled = true
    eInvoice.ecfType = 'E32'
    eInvoice.eNcf = ''
    eInvoice.trackId = ''
    eInvoice.status = 'Pendiente'
    eInvoice.responseMessage = ''

    items.value = [{ id: 1, description: '', qty: 1, price: 0, taxRate: 18 }]
    nextItemId = 2
    discount.value = 0
}

/* --------------------------
   Modal de búsqueda de clientes
--------------------------- */
const showCustomerModal = ref(false)
const customerSearch = ref('')
const customerTypeFilter = ref('')

const customerCatalog = ref<CustomerCatalogItem[]>([
    {
        id: 1,
        name: 'Farmacia Carol, SRL',
        taxId: '101000001',
        type: 'Crédito fiscal',
        email: 'facturas@carol.com.do',
        phone: '809-555-1001',
        address: 'Santo Domingo, República Dominicana'
    },
    {
        id: 2,
        name: 'Inversiones Duarte SRL',
        taxId: '131234567',
        type: 'Crédito fiscal',
        email: 'pagos@duarte.com',
        phone: '809-555-0199',
        address: 'San Francisco de Macorís, RD'
    },
    {
        id: 3,
        name: 'Juan Pérez',
        taxId: '00112345678',
        type: 'Consumidor final',
        email: 'juanperez@gmail.com',
        phone: '809-555-2211',
        address: 'Santiago, RD'
    },
    {
        id: 4,
        name: 'Ministerio de Ejemplo',
        taxId: '401000000',
        type: 'Gubernamental',
        email: 'compras@ministerio.gob.do',
        phone: '809-555-3000',
        address: 'Distrito Nacional, RD'
    },
    {
        id: 5,
        name: 'Exportadora Caribe SAS',
        taxId: '132555888',
        type: 'Exportación',
        email: 'billing@caribeexport.com',
        phone: '809-555-7788',
        address: 'La Romana, RD'
    }
])

const filteredCustomers = computed(() => {
    const term = customerSearch.value.trim().toLowerCase()
    const typeFilter = customerTypeFilter.value

    return customerCatalog.value.filter((client) => {
        const matchesSearch =
            !term ||
            client.name.toLowerCase().includes(term) ||
            client.taxId.toLowerCase().includes(term) ||
            client.email.toLowerCase().includes(term)

        const matchesType = !typeFilter || client.type === typeFilter

        return matchesSearch && matchesType
    })
})

const openCustomerModal = () => {
    showCustomerModal.value = true
}

const closeCustomerModal = () => {
    showCustomerModal.value = false
}

const selectCustomer = (client: CustomerCatalogItem) => {
    customer.name = client.name
    customer.taxId = client.taxId
    customer.type = client.type
    customer.email = client.email
    customer.phone = client.phone
    customer.address = client.address
    closeCustomerModal()
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2
    }).format(value || 0)

const statusBadgeClass = computed(() => {
    if (!eInvoice.enabled) return 'text-bg-secondary'
    switch (eInvoice.status) {
        case 'Generada':
            return 'text-bg-success'
        case 'Rechazada':
        case 'Error de validación':
            return 'text-bg-danger'
        case 'Pendiente':
        default:
            return 'text-bg-warning'
    }
})

const validationIcon = (ok: boolean) =>
    ok ? 'fas fa-circle-check text-success' : 'fas fa-circle-xmark text-danger'
</script>

<style scoped>
.card {
    border-radius: 14px;
}

.card-header {
    border-top-left-radius: 14px;
    border-top-right-radius: 14px;
}

.table> :not(caption)>*>* {
    vertical-align: middle;
}

.form-control,
.form-select,
.input-group-text {
    border-radius: 10px;
}

.btn {
    border-radius: 10px;
}

.list-group-item {
    border-color: rgba(0, 0, 0, 0.05);
}

.modal-content {
    border-radius: 16px;
}

.modal-header,
.modal-footer {
    border-color: rgba(0, 0, 0, 0.06);
}
</style>