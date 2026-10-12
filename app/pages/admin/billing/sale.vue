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
        <button type="button" class="btn btn-light effi-btn" :disabled="submitting" @click="cancelInvoice">
          Cancelar
        </button>

        <button type="button" class="btn btn-outline-primary effi-btn" :disabled="submitting" @click="saveDraft">
          <i class="bi bi-save me-2"></i>
          Guardar borrador
        </button>

        <button type="button" class="btn btn-primary effi-btn-primary" :disabled="submitting" @click="emitInvoice">
          <span v-if="submitting" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          <i v-else class="bi bi-clipboard-check me-2"></i>
          {{ submitting ? 'Emitiendo...' : 'Revisar factura' }}
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
    <div v-if="!issuerReady" class="alert alert-warning d-flex align-items-start gap-3" role="alert">
      <i class="bi bi-building-exclamation mt-1" aria-hidden="true" />
      <div class="flex-grow-1">
        <strong>Datos fiscales del emisor no disponibles.</strong>
        <div>{{ issuerStatusMessage }}</div>
      </div>
      <button
        v-if="auth.profileStatus === 'missing' || auth.profileStatus === 'error'"
        type="button"
        class="btn btn-sm btn-outline-warning"
        @click="reloadIssuerProfile"
      >
        Reintentar
      </button>
    </div>
    <div v-if="unknownResult" class="alert alert-warning d-flex align-items-start gap-3" role="alert">
      <i class="bi bi-question-octagon mt-1" aria-hidden="true" />
      <div class="flex-grow-1">
        <strong>El resultado de la última emisión es desconocido.</strong>
        <div>{{ unknownResult }} No reenvíes la factura sin verificar primero la bandeja fiscal.</div>
      </div>
      <NuxtLink to="/admin/billing" class="btn btn-sm btn-outline-warning">Abrir bandeja</NuxtLink>
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

              <div class="client-actions mt-2">
                <button ref="invoiceOnlyClientButton" type="button" class="link-action" :disabled="submitting" @click="openInvoiceOnlyClientModal">
                  <i class="bi bi-person-plus me-1" aria-hidden="true" />
                  {{ invoice.customClient ? 'Editar cliente de esta factura' : 'Cliente solo para esta factura' }}
                </button>
                <button type="button" class="link-action" :disabled="submitting" @click="createClient">
                  <i class="bi bi-plus-lg me-1" aria-hidden="true" />
                  Crear en el directorio
                </button>
              </div>
            </div>

            <div class="col-md-6">
              <label for="invoice-buyer-email" class="form-label">Correo de esta factura</label>
              <input
                id="invoice-buyer-email"
                v-model="buyerEmailForInvoice"
                type="email"
                inputmode="email"
                autocomplete="off"
                maxlength="80"
                class="form-control effi-input"
                :class="{ 'is-invalid': !hasValidBuyerEmail }"
                :disabled="!selectedClient || submitting"
                :aria-invalid="!hasValidBuyerEmail"
                placeholder="Selecciona un cliente"
              >
              <small v-if="!hasValidBuyerEmail" class="field-helper text-danger">Escribe un correo válido de hasta 80 caracteres.</small>
              <small v-else class="field-helper">Puedes cambiarlo solo para este comprobante. No modifica el cliente.</small>
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
              <small class="field-helper">La primera integración permite E31 y E32.</small>
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
              <small v-if="invoice.currency !== 'DOP'" class="field-helper text-warning">La emisión fiscal en moneda extranjera todavía no está habilitada.</small>
            </div>

            <div class="col-md-6">
              <label class="form-label">Tipo de ingreso <span class="required">*</span></label>
              <select v-model="invoice.incomeType" class="form-select effi-input" :disabled="loadingCatalogs">
                <option value="">Seleccione un tipo...</option>
                <option v-for="incomeType in incomeTypes" :key="incomeType.id" :value="incomeType.codigo">
                  {{ incomeType.codigo }} - {{ incomeType.descripcion }}
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
            <i class="bi bi-shield-check"></i>
            <span>La factura se enviará únicamente después de revisar y confirmar. La operación no se reintenta automáticamente.</span>
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

          <div class="table-responsive invoice-items-table">
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
                      <span>Selecciona un artículo del inventario o agrega uno personalizado.</span>
                    </div>
                  </td>
                </tr>
                <tr v-for="item in invoice.items" :key="item.id">
                  <td>
                    <template v-if="isEditingInventoryDescription(item)">
                      <div class="line-description-editor">
                        <input
                          v-model.trim="inventoryDescriptionDraft"
                          type="text"
                          class="form-control table-input"
                          maxlength="80"
                          aria-label="Descripción del producto"
                          @keydown.enter.prevent="saveInventoryDescription(item)"
                          @keydown.esc.prevent="cancelInventoryDescriptionEdit"
                        >
                        <button type="button" class="btn btn-success line-edit-save" title="Guardar descripción" aria-label="Guardar descripción" @click="saveInventoryDescription(item)">
                          <i class="bi bi-check-lg" />
                        </button>
                        <button type="button" class="btn btn-danger line-edit-cancel" title="Cancelar edición" aria-label="Cancelar edición" @click="cancelInventoryDescriptionEdit">
                          <i class="bi bi-x-lg" />
                        </button>
                      </div>
                    </template>
                    <strong v-else class="line-product-name">{{ item.description }}</strong>
                    <small class="line-product-code">{{ item.customArticle ? 'Producto personalizado · Unidad 46' : (articleForItem(item)?.codigo || 'Sin código') }}</small>
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
                      v-if="item.customArticle"
                      type="button"
                      class="action-btn"
                      title="Editar producto personalizado"
                      aria-label="Editar producto personalizado"
                      @click="openCustomProductEditor(item)"
                    >
                      <i class="bi bi-pencil" />
                    </button>
                    <button
                      v-else
                      type="button"
                      class="action-btn"
                      title="Editar descripción"
                      aria-label="Editar descripción"
                      @click="startInventoryDescriptionEdit(item)"
                    >
                      <i class="bi bi-pencil" />
                    </button>
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

          <div class="mobile-invoice-items">
            <div v-if="!invoice.items.length" class="products-empty-state">
              <i class="bi bi-bag-plus" aria-hidden="true" />
              <strong>No has agregado productos o servicios</strong>
              <span>Selecciona un artículo del inventario o agrega uno personalizado.</span>
            </div>
            <article v-for="item in invoice.items" :key="item.id" class="mobile-invoice-item">
              <div class="mobile-item-heading">
                <div class="mobile-item-description">
                  <template v-if="isEditingInventoryDescription(item)">
                    <div class="line-description-editor">
                      <input v-model.trim="inventoryDescriptionDraft" type="text" class="form-control table-input" maxlength="80" aria-label="Descripción del producto" @keydown.enter.prevent="saveInventoryDescription(item)" @keydown.esc.prevent="cancelInventoryDescriptionEdit">
                      <button type="button" class="btn btn-success line-edit-save" title="Guardar descripción" aria-label="Guardar descripción" @click="saveInventoryDescription(item)"><i class="bi bi-check-lg" /></button>
                      <button type="button" class="btn btn-danger line-edit-cancel" title="Cancelar edición" aria-label="Cancelar edición" @click="cancelInventoryDescriptionEdit"><i class="bi bi-x-lg" /></button>
                    </div>
                  </template>
                  <strong v-else class="line-product-name">{{ item.description }}</strong>
                  <small class="line-product-code">{{ item.customArticle ? 'Producto personalizado · Unidad 46' : (articleForItem(item)?.codigo || 'Sin código') }}</small>
                </div>
                <span class="tax-badge">ITBIS {{ taxRateForItem(item) }}%</span>
              </div>
              <div class="mobile-item-details">
                <label :for="`mobile-quantity-${item.id}`">Cantidad
                  <input :id="`mobile-quantity-${item.id}`" v-model.number="item.quantity" type="number" :min="quantityStep(item)" :step="quantityStep(item)" class="form-control table-input quantity-input" @change="normalizeQuantity(item)">
                  <small>{{ quantityStep(item) === 1 ? 'Unidades enteras' : 'Permite decimales' }}</small>
                </label>
                <div><span>Precio unitario</span><strong>{{ formatCurrency(item.unitPrice) }}</strong></div>
                <div class="mobile-item-amount"><span>Importe</span><strong>{{ formatCurrency(getLineSubtotal(item)) }}</strong></div>
              </div>
              <div class="mobile-item-actions">
                <button v-if="item.customArticle" type="button" class="btn btn-outline-primary" :aria-label="`Editar ${item.description}`" @click="openCustomProductEditor(item)"><i class="bi bi-pencil" aria-hidden="true" />Editar</button>
                <button v-else type="button" class="btn btn-outline-primary" :aria-label="`Editar descripción de ${item.description}`" @click="startInventoryDescriptionEdit(item)"><i class="bi bi-pencil" aria-hidden="true" />Editar descripción</button>
                <button type="button" class="btn btn-outline-danger" :aria-label="`Eliminar ${item.description}`" @click="removeItem(item.id)"><i class="bi bi-trash" aria-hidden="true" />Eliminar</button>
              </div>
            </article>
          </div>

          <div class="line-add-actions mt-3">
            <button ref="productSelectorButton" type="button" class="add-line-button" :disabled="loadingArticles" aria-haspopup="dialog" :aria-expanded="showProductModal" @click="openProductModal">
              <i class="bi bi-box-seam"></i>
              {{ loadingArticles ? 'Cargando inventario...' : 'Agregar desde inventario' }}
            </button>
            <button ref="customProductSelectorButton" type="button" class="add-line-button custom-line-button" :disabled="loadingCatalogs" aria-haspopup="dialog" :aria-expanded="showCustomProductModal" @click="openCustomProductModal">
              <i class="bi bi-pencil-square"></i>
              Agregar producto personalizado
            </button>
          </div>
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
                <CommonCurrencyInput
                  v-model="invoice.discount"
                  min="0"
                  :max="grossTotal"
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

      <!-- Resumen y pago -->
      <div class="col-xl-4">
        <div class="sticky-summary">
          <div class="effi-card summary-card">
            <div class="side-card-title">
              <span class="summary-icon">
                <i class="bi bi-currency-dollar"></i>
              </span>
              <div>
                <h2>Resumen de la factura</h2>
                <span class="summary-status"><i class="bi bi-circle-fill" aria-hidden="true" />Borrador<span v-if="selectedReceiptType"> · {{ selectedReceiptType.ecf }}</span></span>
              </div>
            </div>

            <div class="summary-row">
              <span>Subtotal (sin ITBIS)</span>
              <strong>{{ formatCurrency(subtotal) }}</strong>
            </div>

            <div class="summary-row">
              <span>ITBIS</span>
              <strong>{{ formatCurrency(taxTotal) }}</strong>
            </div>

            <div v-if="hasGlobalDiscount" class="summary-row">
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
            <div class="summary-section">
              <h3><i class="bi bi-credit-card" aria-hidden="true" />Método de pago</h3>
              <label for="invoice-payment-method" class="form-label">Forma de pago <span class="required">*</span></label>
              <select id="invoice-payment-method" v-model="invoice.paymentMethod" class="form-select effi-input" :disabled="loadingCatalogs">
                <option value="">Seleccione una forma...</option>
                <option v-for="paymentMethod in paymentMethods" :key="paymentMethod.id" :value="paymentMethod.codigo">
                  {{ paymentMethod.codigo }} - {{ paymentMethod.descripcion }}
                </option>
              </select>

              <label for="invoice-payment-type" class="form-label mt-3">Tipo de pago <span class="required">*</span></label>
              <select id="invoice-payment-type" v-model.number="invoice.paymentType" class="form-select effi-input" :disabled="loadingCatalogs">
                <option :value="0">Seleccione un tipo...</option>
                <option v-for="paymentType in paymentTypes" :key="paymentType.id" :value="paymentType.codigo">
                  {{ paymentType.codigo }} - {{ paymentType.nombre }}
                </option>
              </select>
              <small v-if="invoice.paymentType && invoice.paymentType !== 1" class="field-helper text-warning">La primera integración permite emitir únicamente con el tipo de pago 1.</small>

              <template v-if="requiresDueDate">
                <label for="invoice-payment-term" class="form-label mt-3">Término de pago</label>
                <select id="invoice-payment-term" v-model="invoice.paymentTerm" class="form-select effi-input" :disabled="loadingCatalogs">
                  <option value="">Sin término específico</option>
                  <option v-for="paymentTerm in paymentTerms" :key="paymentTerm.id" :value="paymentTerm.codigo">
                    {{ paymentTerm.codigo }} - {{ paymentTerm.nombre }}
                  </option>
                </select>
              </template>
            </div>

            <div class="summary-readiness" :class="pendingRequirements.length ? 'has-pending' : 'is-ready'" aria-live="polite">
              <i class="bi" :class="pendingRequirements.length ? 'bi-exclamation-circle' : 'bi-check-circle'" aria-hidden="true" />
              <span>{{ pendingRequirements.length ? `${pendingRequirements.length} ${pendingRequirements.length === 1 ? 'dato pendiente' : 'datos pendientes'} para emitir` : 'Lista para revisar' }}</span>
            </div>
            <button v-if="pendingRequirements.length" type="button" class="validation-toggle" aria-controls="invoice-pending-requirements" :aria-expanded="showValidationDetails" @click="showValidationDetails = !showValidationDetails">
              {{ showValidationDetails ? 'Ocultar pendientes' : 'Ver qué falta' }}
              <i class="bi" :class="showValidationDetails ? 'bi-chevron-up' : 'bi-chevron-down'" aria-hidden="true" />
            </button>
            <ul v-if="pendingRequirements.length" v-show="showValidationDetails" id="invoice-pending-requirements" class="validation-list">
              <li v-for="requirement in pendingRequirements" :key="requirement.label"><i class="bi bi-circle" aria-hidden="true" />{{ requirement.label }}</li>
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
                  aria-label="Buscar clientes"
                  placeholder="Buscar por nombre, RNC, identificación, código o correo..."
                >
                <button v-if="clientSearch" type="button" class="btn btn-outline-secondary" @click="clientSearch = ''">Limpiar</button>
              </div>

              <div class="product-results-summary">
                <span>{{ filteredClients.length }} {{ filteredClients.length === 1 ? 'resultado' : 'resultados' }}</span>
                <small>Solo se muestran clientes activos.</small>
              </div>

              <div v-if="filteredClients.length" class="table-responsive product-results client-results">
                <table class="table align-middle mb-0 selector-table">
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
                <div class="selector-mobile-list">
                  <article v-for="client in filteredClients" :key="client.id" class="selector-mobile-card" :class="{ 'is-selected': client.id === invoice.clientId }">
                    <strong>{{ client.razonSocialComprador }}</strong>
                    <small>{{ clientIdentification(client) }}</small>
                    <small v-if="client.correoComprador">{{ client.correoComprador }}</small>
                    <button type="button" class="btn btn-primary" @click="selectClient(client)"><i class="bi me-2" :class="client.id === invoice.clientId ? 'bi-check-circle' : 'bi-person-check'" aria-hidden="true" />{{ client.id === invoice.clientId ? 'Seleccionado' : 'Seleccionar cliente' }}</button>
                  </article>
                </div>
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
      <div id="invoice-only-client-modal" ref="invoiceOnlyClientModalElement" class="modal fade" tabindex="-1" aria-labelledby="invoice-only-client-title" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <form class="modal-content catalog-bootstrap-modal" novalidate @submit.prevent="saveInvoiceOnlyClient">
            <div class="modal-header product-modal-header">
              <div>
                <span class="product-modal-eyebrow">Sin crear un registro</span>
                <h2 id="invoice-only-client-title">{{ invoice.customClient ? 'Editar cliente de esta factura' : 'Cliente solo para esta factura' }}</h2>
                <p>Estos datos se incluirán en el comprobante y en el borrador, pero no se guardarán en el directorio de clientes.</p>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar" />
            </div>
            <div class="modal-body product-modal-body">
              <div v-if="invoiceOnlyClientError" class="alert alert-danger" role="alert">{{ invoiceOnlyClientError }}</div>
              <div class="row g-3">
                <div class="col-12">
                  <label for="invoice-only-client-name" class="form-label">Nombre o razón social <span class="required">*</span></label>
                  <input id="invoice-only-client-name" ref="invoiceOnlyClientNameInput" v-model="invoiceOnlyBuyerForm.razonSocialComprador" type="text" class="form-control" maxlength="150" autocomplete="off" required>
                </div>
                <div class="col-md-6">
                  <label for="invoice-only-client-rnc" class="form-label">RNC o cédula <span v-if="invoice.documentType === '31'" class="required">*</span></label>
                  <input id="invoice-only-client-rnc" v-model="invoiceOnlyBuyerForm.rncComprador" type="text" class="form-control" maxlength="15" inputmode="numeric" autocomplete="off">
                  <small class="field-helper">Obligatorio para E31. Puede escribirse con guiones.</small>
                </div>
                <div class="col-md-6">
                  <label for="invoice-only-client-foreign-id" class="form-label">Identificador extranjero</label>
                  <input id="invoice-only-client-foreign-id" v-model="invoiceOnlyBuyerForm.identificadorExtranjero" type="text" class="form-control" maxlength="20" autocomplete="off">
                </div>
                <div class="col-md-6">
                  <label for="invoice-only-client-email" class="form-label">Correo electrónico</label>
                  <input id="invoice-only-client-email" v-model="invoiceOnlyBuyerForm.correoComprador" type="email" inputmode="email" class="form-control" maxlength="80" autocomplete="off">
                </div>
                <div class="col-md-6">
                  <label for="invoice-only-client-contact" class="form-label">Persona de contacto</label>
                  <input id="invoice-only-client-contact" v-model="invoiceOnlyBuyerForm.contactoComprador" type="text" class="form-control" maxlength="80" autocomplete="off">
                </div>
                <div class="col-md-8">
                  <label for="invoice-only-client-address" class="form-label">Dirección</label>
                  <input id="invoice-only-client-address" v-model="invoiceOnlyBuyerForm.direccionComprador" type="text" class="form-control" maxlength="100" autocomplete="off">
                </div>
                <div class="col-md-4">
                  <label for="invoice-only-client-country" class="form-label">País</label>
                  <input id="invoice-only-client-country" v-model="invoiceOnlyBuyerForm.paisComprador" type="text" class="form-control" maxlength="60" autocomplete="off">
                </div>
              </div>
              <small class="field-helper d-block mt-3">El correo se puede ajustar después para esta factura. La emisión no envía un email automáticamente.</small>
            </div>
            <div class="modal-footer product-modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-primary">Usar en esta factura</button>
            </div>
          </form>
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
                  aria-label="Buscar productos o servicios"
                  placeholder="Buscar por nombre, código o descripción..."
                >
                <button v-if="productSearch" type="button" class="btn btn-outline-secondary" @click="productSearch = ''">Limpiar</button>
              </div>

              <div class="product-results-summary">
                <span>{{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'resultado' : 'resultados' }}</span>
                <small>Solo se muestran artículos activos.</small>
              </div>

              <div v-if="filteredProducts.length" class="table-responsive product-results">
                <table class="table align-middle mb-0 selector-table">
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
                <div class="selector-mobile-list">
                  <article v-for="article in filteredProducts" :key="article.id" class="selector-mobile-card">
                    <div class="selector-mobile-heading"><strong>{{ article.nombreItem }}</strong><span class="product-type-badge">{{ article.indicadorBienoServicio === 2 ? 'Servicio' : 'Bien' }}</span></div>
                    <small>{{ article.codigo || 'Sin código' }}<template v-if="article.descripcionItem"> · {{ article.descripcionItem }}</template></small>
                    <div class="selector-mobile-facts"><span><strong>{{ formatCurrency(article.precioUnitarioItem) }}</strong><small>{{ taxLabel(article.indicadorFacturacion) }}</small></span><span>Existencia: {{ article.indicadorBienoServicio === 2 ? 'No aplica' : article.existencia }}</span></div>
                    <button type="button" class="btn btn-primary" @click="selectProduct(article)"><i class="bi me-2" :class="selectedProductQuantity(article.id) ? 'bi-check-circle' : 'bi-plus-circle'" aria-hidden="true" />{{ selectedProductQuantity(article.id) ? `Agregar otro (${selectedProductQuantity(article.id)})` : 'Agregar a la factura' }}</button>
                  </article>
                </div>
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

    <Teleport to="body">
      <div
        id="custom-product-modal"
        ref="customProductModalElement"
        class="modal fade"
        tabindex="-1"
        aria-labelledby="custom-product-modal-title"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <form class="modal-content catalog-bootstrap-modal" @submit.prevent="saveCustomProduct">
            <div class="modal-header product-modal-header">
              <div>
                <span class="product-modal-eyebrow">{{ isEditingCustomProduct ? 'Editar línea personalizada' : 'Línea personalizada' }}</span>
                <h2 id="custom-product-modal-title">{{ isEditingCustomProduct ? 'Editar producto personalizado' : 'Agregar producto personalizado' }}</h2>
                <p>Este producto se incluirá únicamente en la factura y no se guardará en el inventario.</p>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar" />
            </div>

            <div class="modal-body product-modal-body">
              <div v-if="customProductError" class="alert alert-danger" role="alert">
                {{ customProductError }}
              </div>

              <div class="row g-3">
                <div class="col-12">
                  <label for="custom-product-name" class="form-label">Nombre del producto o servicio <span class="text-danger">*</span></label>
                  <input id="custom-product-name" ref="customProductNameInput" v-model.trim="customProduct.nombreItem" type="text" class="form-control" maxlength="80" required>
                </div>

                <div class="col-md-6">
                  <label for="custom-product-price" class="form-label">Precio unitario <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <span class="input-group-text">RD$</span>
                    <input
                      id="custom-product-price"
                      :value="formatEditableAmount(customProduct.precioUnitarioItem)"
                      type="text"
                      inputmode="decimal"
                      autocomplete="off"
                      class="form-control"
                      required
                      @focus="selectEditableAmount"
                      @input="updateCustomProductPrice"
                    >
                  </div>
                </div>

                <div class="col-md-6">
                  <label for="custom-product-quantity" class="form-label">Cantidad <span class="text-danger">*</span></label>
                  <input id="custom-product-quantity" v-model.number="customProduct.cantidadItem" type="number" class="form-control" min="1" step="1" required>
                  <div class="form-text">La unidad 46 utiliza cantidades enteras.</div>
                </div>

                <div class="col-md-4">
                  <label for="custom-product-kind" class="form-label">Bien o servicio <span class="text-danger">*</span></label>
                  <select id="custom-product-kind" v-model.number="customProduct.indicadorBienServicio" class="form-select" required>
                    <option :value="0" disabled>Seleccione una opción</option>
                    <option :value="1">1 — Bien</option>
                    <option :value="2">2 — Servicio</option>
                  </select>
                </div>

                <div class="col-md-5">
                  <label for="custom-product-billing-indicator" class="form-label">Indicador de facturación <span class="text-danger">*</span></label>
                  <select id="custom-product-billing-indicator" v-model.number="customProduct.indicadorFacturacion" class="form-select" :disabled="!billingIndicators.length" required>
                    <option :value="-1" disabled>Seleccione un indicador</option>
                    <option v-for="indicator in billingIndicators" :key="indicator.id" :value="indicator.codigo">
                      {{ indicator.codigo }} — {{ indicator.descripcion }} ({{ indicator.tasaItbis }}%)
                    </option>
                  </select>
                </div>

                <div class="col-md-3">
                  <label for="custom-product-unit" class="form-label">Unidad de medida</label>
                  <input id="custom-product-unit" type="text" class="form-control" value="46 — Unidad" readonly>
                </div>
              </div>
            </div>

            <div class="modal-footer product-modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="!billingIndicators.length">
                <i class="bi me-2" :class="isEditingCustomProduct ? 'bi-check-circle' : 'bi-plus-circle'" />
                {{ isEditingCustomProduct ? 'Guardar cambios' : 'Agregar a la factura' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div id="invoice-review-modal" ref="reviewModalElement" class="modal fade" tabindex="-1" aria-labelledby="invoice-review-title" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content catalog-bootstrap-modal">
            <div class="modal-header product-modal-header">
              <div>
                <span class="product-modal-eyebrow">Confirmación fiscal</span>
                <h2 id="invoice-review-title">Revisar antes de emitir</h2>
                <p>La secuencia fiscal puede consumirse aunque el proceso falle posteriormente.</p>
              </div>
              <button type="button" class="btn-close" :disabled="submitting" data-bs-dismiss="modal" aria-label="Cerrar" />
            </div>
            <div class="modal-body product-modal-body">
              <div class="row g-3 fiscal-review-grid">
                <div class="col-sm-6"><span>Comprobante</span><strong>E{{ invoice.documentType }} · {{ selectedReceiptType?.ecf }}</strong></div>
                <div class="col-sm-6"><span>Cliente</span><strong>{{ selectedClient?.razonSocialComprador }}</strong></div>
                <div class="col-sm-6"><span>Correo en la factura</span><strong>{{ buyerEmailForInvoice.trim() || 'Sin correo' }}</strong></div>
                <div class="col-sm-6"><span>Fecha</span><strong>{{ invoice.issueDate }}</strong></div>
                <div class="col-sm-6"><span>Líneas</span><strong>{{ invoice.items.length }}</strong></div>
                <div class="col-sm-6"><span>ITBIS</span><strong>{{ formatCurrency(taxTotal) }}</strong></div>
                <div class="col-sm-6"><span>Total</span><strong>{{ formatCurrency(grandTotal) }}</strong></div>
              </div>
              <div class="alert alert-warning mt-4 mb-0">
                <i class="bi bi-exclamation-triangle me-2" aria-hidden="true" />
                No cierres la página ni repitas la operación mientras la factura esté siendo procesada.
              </div>
            </div>
            <div class="modal-footer product-modal-footer">
              <button type="button" class="btn btn-outline-secondary" :disabled="submitting" data-bs-dismiss="modal">Volver a editar</button>
              <button type="button" class="btn btn-primary" :disabled="submitting" @click="confirmInvoiceEmission">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                {{ submitting ? 'Emitiendo...' : 'Emitir factura' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div id="invoice-result-modal" ref="resultModalElement" class="modal fade" tabindex="-1" aria-labelledby="invoice-result-title" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content catalog-bootstrap-modal">
            <div class="modal-header product-modal-header">
              <div>
                <span class="product-modal-eyebrow">Resultado fiscal</span>
                <h2 id="invoice-result-title">{{ resultTitle }}</h2>
                <p>Resultado informado por la WebAPI y la DGII.</p>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar" />
            </div>
            <div class="modal-body product-modal-body">
              <div v-if="fiscalResult" class="fiscal-result-card" :class="`fiscal-result-${fiscalResultStatus}`">
                <i class="bi" :class="resultIcon" aria-hidden="true" />
                <div>
                  <span>{{ fiscalResult.estadoEncf || 'Procesado sin estado concluyente' }}</span>
                  <strong>{{ fiscalResult.encf || 'e-NCF no informado' }}</strong>
                  <small>Secuencia utilizada: {{ fiscalResult.secuenciaUtilizada ? 'Sí' : 'No' }}</small>
                </div>
              </div>

              <dl v-if="fiscalResult" class="fiscal-result-details mt-4">
                <div><dt>Código de seguridad</dt><dd>{{ fiscalResult.codigoSeguridad || 'No informado' }}</dd></div>
                <div><dt>Fecha de firma</dt><dd>{{ fiscalResult.fechaFirma || 'No informada' }}</dd></div>
              </dl>

              <div v-if="fiscalResult?.mensajes.length" class="alert alert-info mt-4 mb-0">
                <strong>Mensajes fiscales</strong>
                <ul class="mb-0 mt-2"><li v-for="message in fiscalResult.mensajes" :key="message">{{ message }}</li></ul>
              </div>
            </div>
            <div class="modal-footer product-modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
              <button v-if="fiscalResult?.encf && canDownloadResultPdf" type="button" class="btn btn-primary" :disabled="downloadingPdf" @click="downloadResultPdf">
                <span v-if="downloadingPdf" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                <i v-else class="bi bi-file-earmark-pdf me-2" aria-hidden="true" />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Article, BillingIndicator } from '~/types/article'
import type {
  Currency,
  IncomeType,
  PaymentMethod,
  PaymentTerm,
  PaymentType,
  ReceiptType,
} from '~/types/billing'
import type { Client, ClientWrite } from '~/types/client'
import type { EcfApiResult, EcfResultStatus } from '~/types/ecf'
import { ApiError } from '~/utils/api'
import {
  buildEcfRequest,
  calculateInvoice,
  classifyEcfResult,
  EcfValidationError,
  isValidInvoiceBuyerEmail,
  mapCompanyProfileToIssuer,
  prepareInvoiceOnlyBuyer,
  type InvoiceDraft,
  type InvoiceOnlyBuyerInput,
  type IssuerConfiguration,
} from '~/utils/ecf'

interface InvoiceItem {
  id: number
  articleId: string
  description: string
  quantity: number
  unitPrice: number
  billingIndicator: number
  customArticle?: Article
}

interface CustomProductForm {
  nombreItem: string
  precioUnitarioItem: number
  cantidadItem: number
  indicadorBienServicio: number
  indicadorFacturacion: number
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
const SALE_RECEIPT_TYPES = new Set([31, 32])
const CUSTOM_PRODUCT_UNIT_CODE = 46
const PENDING_INVOICE_KEY = 'effisort_invoice_pending_client'
const DRAFT_INVOICE_KEY = 'effisort_invoice_draft'

const { getClients } = useClientsApi()
const { getArticles } = useArticlesApi()
const {
  getPaymentMethods,
  getCurrencies,
  getReceiptTypes,
  getBillingIndicators,
  getIncomeTypes,
  getPaymentTypes,
  getPaymentTerms,
} = useBillingCatalogsApi()
const { emitInvoice: sendInvoice, downloadPdf, submitting } = useEcfApi()
const auth = useAuthStore()
const showOptional = ref(false)
const showValidationDetails = ref(false)
const showClientModal = ref(false)
const clientSearch = ref('')
const clientSearchInput = ref<HTMLInputElement | null>(null)
const clientSelectorButton = ref<HTMLButtonElement | null>(null)
const clientModalElement = ref<HTMLElement | null>(null)
let clientModalInstance: BootstrapModalInstance | null = null
const invoiceOnlyClientButton = ref<HTMLButtonElement | null>(null)
const invoiceOnlyClientNameInput = ref<HTMLInputElement | null>(null)
const invoiceOnlyClientModalElement = ref<HTMLElement | null>(null)
let invoiceOnlyClientModalInstance: BootstrapModalInstance | null = null
const invoiceOnlyClientError = ref('')
const invoiceOnlyBuyerForm = reactive<InvoiceOnlyBuyerInput>(emptyInvoiceOnlyBuyerInput())
const showProductModal = ref(false)
const productSearch = ref('')
const productSearchInput = ref<HTMLInputElement | null>(null)
const productSelectorButton = ref<HTMLButtonElement | null>(null)
const productModalElement = ref<HTMLElement | null>(null)
let productModalInstance: BootstrapModalInstance | null = null
const showCustomProductModal = ref(false)
const customProductNameInput = ref<HTMLInputElement | null>(null)
const customProductSelectorButton = ref<HTMLButtonElement | null>(null)
const customProductModalElement = ref<HTMLElement | null>(null)
let customProductModalInstance: BootstrapModalInstance | null = null
const customProductError = ref('')
const customProduct = reactive<CustomProductForm>(createEmptyCustomProduct())
const editingCustomProductId = ref<number | null>(null)
const editingInventoryDescriptionId = ref<number | null>(null)
const inventoryDescriptionDraft = ref('')
const reviewModalElement = ref<HTMLElement | null>(null)
const resultModalElement = ref<HTMLElement | null>(null)
let reviewModalInstance: BootstrapModalInstance | null = null
let resultModalInstance: BootstrapModalInstance | null = null
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
const incomeTypes = ref<IncomeType[]>([])
const paymentTypes = ref<PaymentType[]>([])
const paymentTerms = ref<PaymentTerm[]>([])
const fiscalResult = ref<EcfApiResult | null>(null)
const fiscalResultStatus = ref<EcfResultStatus>('processed')
const unknownResult = ref('')
const downloadingPdf = ref(false)

const invoice = reactive({
  clientId: '',
  customClient: null as ClientWrite | null,
  buyerEmail: null as string | null,
  issueDate: currentDate(),
  dueDate: dateAfterDays(15),
  documentType: '',
  currency: 'DOP',
  exchangeRate: 1,
  incomeType: '',
  paymentType: 0,
  paymentMethod: '',
  paymentTerm: '',
  discount: 0,
  internalReference: '',
  purchaseOrder: '',
  branch: '',
  terms: '',
  notes: '',
  items: [] as InvoiceItem[],
})

const issuer = computed<IssuerConfiguration | null>(() => auth.profile
  ? mapCompanyProfileToIssuer(auth.profile.empresa)
  : null)

onMounted(async () => {
  restorePendingInvoice()
  clientModalElement.value?.addEventListener('shown.bs.modal', handleClientModalShown)
  clientModalElement.value?.addEventListener('hidden.bs.modal', handleClientModalHidden)
  invoiceOnlyClientModalElement.value?.addEventListener('shown.bs.modal', handleInvoiceOnlyClientModalShown)
  invoiceOnlyClientModalElement.value?.addEventListener('hidden.bs.modal', handleInvoiceOnlyClientModalHidden)
  productModalElement.value?.addEventListener('shown.bs.modal', handleProductModalShown)
  productModalElement.value?.addEventListener('hidden.bs.modal', handleProductModalHidden)
  customProductModalElement.value?.addEventListener('shown.bs.modal', handleCustomProductModalShown)
  customProductModalElement.value?.addEventListener('hidden.bs.modal', handleCustomProductModalHidden)
  await loadReferenceData()
})

onBeforeUnmount(() => {
  clientModalElement.value?.removeEventListener('shown.bs.modal', handleClientModalShown)
  clientModalElement.value?.removeEventListener('hidden.bs.modal', handleClientModalHidden)
  invoiceOnlyClientModalElement.value?.removeEventListener('shown.bs.modal', handleInvoiceOnlyClientModalShown)
  invoiceOnlyClientModalElement.value?.removeEventListener('hidden.bs.modal', handleInvoiceOnlyClientModalHidden)
  productModalElement.value?.removeEventListener('shown.bs.modal', handleProductModalShown)
  productModalElement.value?.removeEventListener('hidden.bs.modal', handleProductModalHidden)
  customProductModalElement.value?.removeEventListener('shown.bs.modal', handleCustomProductModalShown)
  customProductModalElement.value?.removeEventListener('hidden.bs.modal', handleCustomProductModalHidden)
  clientModalInstance?.dispose()
  clientModalInstance = null
  invoiceOnlyClientModalInstance?.dispose()
  invoiceOnlyClientModalInstance = null
  productModalInstance?.dispose()
  productModalInstance = null
  customProductModalInstance?.dispose()
  customProductModalInstance = null
  reviewModalInstance?.dispose()
  reviewModalInstance = null
  resultModalInstance?.dispose()
  resultModalInstance = null
})

const selectedClient = computed(() => invoice.customClient ?? clients.value.find(client => client.id === invoice.clientId))
const buyerEmailForInvoice = computed({
  get: () => invoice.buyerEmail ?? selectedClient.value?.correoComprador ?? '',
  set: (value: string) => { invoice.buyerEmail = value },
})
const hasValidBuyerEmail = computed(() => isValidInvoiceBuyerEmail(buyerEmailForInvoice.value))
const selectedReceiptType = computed(() => receiptTypes.value.find(item => String(item.tipo) === invoice.documentType))
const isEditingCustomProduct = computed(() => editingCustomProductId.value !== null)

const hasClient = computed(() => Boolean(selectedClient.value?.razonSocialComprador?.trim()))
const hasValidBuyerRnc = computed(() => invoice.documentType !== '31' || Boolean(selectedClient.value?.rncComprador?.trim()))
const issuerReady = computed(() => Boolean(
  issuer.value?.rnc
  && issuer.value.businessName,
))
const issuerStatusMessage = computed(() => {
  if (auth.profileStatus === 'loading') return 'Estamos cargando la empresa asociada a tu sesión.'
  if (auth.profileStatus === 'missing') return auth.profileError || 'El usuario no tiene una empresa configurada.'
  if (auth.profileStatus === 'error') return auth.profileError || 'No pudimos consultar la empresa de la sesión.'
  if (issuer.value) return 'La empresa debe tener RNC y razón social para poder emitir.'
  return 'No se ha cargado la empresa correspondiente a la sesión.'
})
const hasValidReceiptType = computed(() => receiptTypes.value.some(item => String(item.tipo) === invoice.documentType))
const hasValidCurrency = computed(() => invoice.currency === 'DOP' && currencies.value.some(item => item.codigo === invoice.currency))
const hasValidIncomeType = computed(() => incomeTypes.value.some(item => item.codigo === invoice.incomeType))
const hasValidPaymentType = computed(() => invoice.paymentType === 1
  && paymentTypes.value.some(item => item.codigo === invoice.paymentType))
const hasValidPaymentMethod = computed(() => paymentMethods.value.some(item => item.codigo === invoice.paymentMethod))
const requiresDueDate = computed(() => invoice.paymentType === 2)
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

const invoiceDraft = computed<InvoiceDraft>(() => ({
  documentType: invoice.documentType,
  issueDate: invoice.issueDate,
  dueDate: invoice.dueDate,
  incomeType: invoice.incomeType,
  paymentType: invoice.paymentType,
  paymentMethod: invoice.paymentMethod,
  paymentTerm: invoice.paymentTerm,
  currency: invoice.currency,
  discount: Number(invoice.discount || 0),
  internalReference: invoice.internalReference,
  purchaseOrder: invoice.purchaseOrder,
  notes: invoice.notes,
  client: selectedClient.value,
  buyerEmail: buyerEmailForInvoice.value,
  items: invoice.items.flatMap((item) => {
    const article = articleForItem(item)
    return article ? [{
      article,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }] : []
  }),
}))

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

const invoiceCalculation = computed(() => {
  try {
    return calculateInvoice(invoiceDraft.value, billingIndicators.value)
  } catch {
    return { subtotal: 0, taxableTotal: 0, exemptTotal: 0, nonBillableTotal: 0, taxTotal: 0, total: 0, totals: { montoTotal: 0 } }
  }
})

const subtotal = computed(() => invoiceCalculation.value.subtotal)
const taxTotal = computed(() => invoiceCalculation.value.taxTotal)
const grossTotal = computed(() => subtotal.value + taxTotal.value)
const hasGlobalDiscount = computed(() => Number.isFinite(Number(invoice.discount))
  && Number(invoice.discount) > 0)
const hasValidDiscount = computed(() => Number.isFinite(Number(invoice.discount))
  && Number(invoice.discount) === 0)

const grandTotal = computed(() => invoiceCalculation.value.total)

const isInvoiceReady = computed(() => Boolean(
  hasClient.value
  && hasValidBuyerRnc.value
  && hasValidDates.value
  && hasValidReceiptType.value
  && hasValidCurrency.value
  && issuerReady.value
  && hasValidIncomeType.value
  && hasValidPaymentType.value
  && hasValidPaymentMethod.value
  && hasValidItems.value
  && hasValidBuyerEmail.value
  && hasValidDiscount.value
  && hasValidExchangeRate.value,
))

const pendingRequirements = computed(() => [
  { label: 'Cliente', ready: hasClient.value },
  ...(invoice.documentType === '31' ? [{ label: 'RNC o cédula del comprador para E31', ready: hasValidBuyerRnc.value }] : []),
  { label: 'Fecha de emisión y vencimiento válidos', ready: hasValidDates.value },
  { label: 'Tipo de comprobante', ready: hasValidReceiptType.value },
  { label: 'Datos del emisor', ready: issuerReady.value },
  { label: 'Tipo de ingreso', ready: hasValidIncomeType.value },
  { label: 'Tipo de pago admitido', ready: hasValidPaymentType.value },
  { label: 'Moneda admitida', ready: hasValidCurrency.value },
  { label: 'Forma de pago', ready: hasValidPaymentMethod.value },
  { label: 'Productos o servicios válidos', ready: hasValidItems.value },
  { label: 'Correo de esta factura válido', ready: hasValidBuyerEmail.value },
  ...(requiresExchangeRate.value ? [{ label: 'Tasa de cambio', ready: hasValidExchangeRate.value }] : []),
  { label: 'Descuento fiscal pendiente', ready: hasValidDiscount.value },
].filter(requirement => !requirement.ready))

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

function isEditingInventoryDescription(item: InvoiceItem) {
  return !item.customArticle && editingInventoryDescriptionId.value === item.id
}

function startInventoryDescriptionEdit(item: InvoiceItem) {
  editingInventoryDescriptionId.value = item.id
  inventoryDescriptionDraft.value = item.description
}

function cancelInventoryDescriptionEdit() {
  editingInventoryDescriptionId.value = null
  inventoryDescriptionDraft.value = ''
}

function saveInventoryDescription(item: InvoiceItem) {
  const description = inventoryDescriptionDraft.value.trim()
  if (!description) {
    showNotification('Descripción requerida', 'Escribe una descripción para este producto antes de guardar.', 'info')
    return
  }

  item.description = description
  cancelInventoryDescriptionEdit()
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

function emptyInvoiceOnlyBuyerInput(): InvoiceOnlyBuyerInput {
  return {
    razonSocialComprador: '',
    rncComprador: '',
    identificadorExtranjero: '',
    contactoComprador: '',
    correoComprador: '',
    direccionComprador: '',
    paisComprador: '',
  }
}

async function openInvoiceOnlyClientModal() {
  invoiceOnlyClientError.value = ''
  const client = invoice.customClient
  Object.assign(invoiceOnlyBuyerForm, client ? {
    razonSocialComprador: client.razonSocialComprador,
    rncComprador: client.rncComprador ?? '',
    identificadorExtranjero: client.identificadorExtranjero ?? '',
    contactoComprador: client.contactoComprador ?? '',
    correoComprador: invoice.buyerEmail ?? client.correoComprador ?? '',
    direccionComprador: client.direccionComprador ?? '',
    paisComprador: client.paisComprador ?? '',
  } : emptyInvoiceOnlyBuyerInput())
  await nextTick()
  const modal = getInvoiceOnlyClientModal()
  if (!modal) {
    showNotification('Modal no disponible', 'No pudimos abrir el formulario del cliente.', 'danger')
    return
  }
  modal.show()
}

function getInvoiceOnlyClientModal() {
  if (invoiceOnlyClientModalInstance) return invoiceOnlyClientModalInstance
  const bootstrap = getBootstrapModalConstructor()
  if (!invoiceOnlyClientModalElement.value || !bootstrap) return null

  invoiceOnlyClientModalInstance = bootstrap.getOrCreateInstance(invoiceOnlyClientModalElement.value, {
    backdrop: true,
    keyboard: true,
    focus: true,
  })
  return invoiceOnlyClientModalInstance
}

function handleInvoiceOnlyClientModalShown() {
  invoiceOnlyClientNameInput.value?.focus()
}

function handleInvoiceOnlyClientModalHidden() {
  invoiceOnlyClientError.value = ''
  Object.assign(invoiceOnlyBuyerForm, emptyInvoiceOnlyBuyerInput())
  invoiceOnlyClientButton.value?.focus()
}

function saveInvoiceOnlyClient() {
  try {
    const buyer = prepareInvoiceOnlyBuyer(invoiceOnlyBuyerForm, invoice.documentType)
    invoice.clientId = ''
    invoice.customClient = buyer
    invoice.buyerEmail = null
    getInvoiceOnlyClientModal()?.hide()
    showNotification('Cliente listo', 'Sus datos se usarán solo en esta factura; no se creó un cliente en el directorio.', 'success')
  } catch (error) {
    invoiceOnlyClientError.value = error instanceof EcfValidationError
      ? error.errors.join(' ')
      : 'No pudimos validar los datos del comprador.'
  }
}

function selectClient(client: Client) {
  invoice.clientId = client.id
  invoice.customClient = null
  invoice.buyerEmail = null
  if (client.tipoPago && paymentTypes.value.some(item => item.codigo === client.tipoPago)) {
    invoice.paymentType = client.tipoPago
  }
  if (client.terminoPago && paymentTerms.value.some(item => item.codigo === String(client.terminoPago))) {
    invoice.paymentTerm = String(client.terminoPago)
  }
  closeClientModal()
}

function clientIdentification(client: ClientWrite) {
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

  if (!issuer.value) {
    showNotification('Emisor no disponible', issuerStatusMessage.value, 'danger')
    return
  }

  if (!isInvoiceReady.value) {
    showNotification('Factura incompleta', 'Completa los campos obligatorios antes de continuar.', 'danger')
    return
  }

  try {
    buildEcfRequest(invoiceDraft.value, issuer.value, billingIndicators.value)
    unknownResult.value = ''
    getReviewModal()?.show()
  } catch (error) {
    const message = error instanceof EcfValidationError
      ? error.errors.join(' ')
      : error instanceof Error ? error.message : 'No pudimos validar la factura.'
    showNotification('Factura incompleta', message, 'danger')
  }
}

async function reloadIssuerProfile() {
  try {
    await auth.loadProfile()
    if (issuerReady.value) showNotification('Emisor actualizado', 'Los datos fiscales de la empresa fueron cargados.', 'success')
  } catch (error) {
    showNotification(
      'No pudimos cargar el emisor',
      error instanceof Error ? error.message : 'Verifica tu conexión e inténtalo nuevamente.',
      'danger',
    )
  }
}

async function confirmInvoiceEmission() {
  if (submitting.value) return
  if (!issuer.value) {
    showNotification('Emisor no disponible', 'No es posible emitir sin cargar la empresa de la sesión.', 'danger')
    return
  }

  try {
    const request = buildEcfRequest(invoiceDraft.value, issuer.value, billingIndicators.value)
    const result = await sendInvoice(request)
    fiscalResult.value = result
    fiscalResultStatus.value = classifyEcfResult(result)
    unknownResult.value = ''
    reviewModalInstance?.hide()
    await nextTick()
    getResultModal()?.show()

    if (fiscalResultStatus.value === 'accepted' || fiscalResultStatus.value === 'conditionally-accepted') {
      localStorage.removeItem(DRAFT_INVOICE_KEY)
    } else {
      saveDraftSilently()
    }
  } catch (error) {
    if (error instanceof EcfValidationError) {
      showNotification('Factura incompleta', error.errors.join(' '), 'danger')
      return
    }

    const apiError = error instanceof ApiError ? error : null
    const isUnknownOutcome = apiError?.code === 'TIMEOUT'
      || apiError?.code === 'NETWORK_ERROR'
      || apiError?.status === 500

    if (isUnknownOutcome) {
      saveDraftSilently()
      unknownResult.value = 'No fue posible confirmar el resultado de la emisión y el borrador fue conservado.'
      reviewModalInstance?.hide()
      showNotification('Resultado desconocido', unknownResult.value, 'danger')
      return
    }

    showNotification(
      'No se pudo emitir',
      apiError?.message || (error instanceof Error ? error.message : 'La WebAPI rechazó la solicitud.'),
      'danger',
    )
  }
}

const resultTitle = computed(() => ({
  accepted: 'Factura aceptada',
  'conditionally-accepted': 'Factura aceptada condicionalmente',
  rejected: 'Factura rechazada',
  processed: 'Factura procesada',
})[fiscalResultStatus.value])

const resultIcon = computed(() => ({
  accepted: 'bi-check-circle-fill',
  'conditionally-accepted': 'bi-exclamation-circle-fill',
  rejected: 'bi-x-circle-fill',
  processed: 'bi-info-circle-fill',
})[fiscalResultStatus.value])

const canDownloadResultPdf = computed(() => Boolean(
  fiscalResult.value?.encf
  && fiscalResult.value.secuenciaUtilizada
  && fiscalResultStatus.value !== 'rejected',
))

async function downloadResultPdf() {
  const encf = fiscalResult.value?.encf
  if (!encf || downloadingPdf.value) return

  downloadingPdf.value = true
  try {
    const blob = await downloadPdf(encf)
    downloadBlob(blob, `${encf}.pdf`)
  } catch (error) {
    showNotification(
      'PDF no disponible',
      error instanceof Error ? error.message : 'No pudimos descargar el documento fiscal.',
      'danger',
    )
  } finally {
    downloadingPdf.value = false
  }
}

function cancelInvoice() {
  localStorage.removeItem(DRAFT_INVOICE_KEY)
  sessionStorage.removeItem(PENDING_INVOICE_KEY)
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
    getIncomeTypes(),
    getPaymentTypes(),
    getPaymentTerms(),
  ])

  const [paymentResult, currencyResult, receiptResult, indicatorResult, incomeResult, paymentTypeResult, paymentTermResult] = results
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
  if (incomeResult.status === 'fulfilled') {
    incomeTypes.value = activeCatalog(incomeResult.value).sort((a, b) => a.codigo.localeCompare(b.codigo))
  }
  if (paymentTypeResult.status === 'fulfilled') {
    paymentTypes.value = activeCatalog(paymentTypeResult.value).sort((a, b) => a.codigo - b.codigo)
  }
  if (paymentTermResult.status === 'fulfilled') {
    paymentTerms.value = activeCatalog(paymentTermResult.value).sort((a, b) => a.codigo.localeCompare(b.codigo))
  }

  const failedCatalogs = [
    paymentResult.status === 'rejected' && 'formas de pago',
    currencyResult.status === 'rejected' && 'monedas',
    receiptResult.status === 'rejected' && 'tipos de comprobante',
    indicatorResult.status === 'rejected' && 'indicadores de facturación',
    incomeResult.status === 'rejected' && 'tipos de ingreso',
    paymentTypeResult.status === 'rejected' && 'tipos de pago',
    paymentTermResult.status === 'rejected' && 'términos de pago',
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

async function openCustomProductModal() {
  editingCustomProductId.value = null
  Object.assign(customProduct, createEmptyCustomProduct())
  customProduct.indicadorFacturacion = preferredBillingIndicator()
  customProductError.value = ''
  showCustomProductModal.value = true
  await nextTick()
  const modal = getCustomProductModal()
  if (!modal) {
    showCustomProductModal.value = false
    showNotification('Modal no disponible', 'No pudimos inicializar el componente de Bootstrap.', 'danger')
    return
  }
  modal.show()
}

async function openCustomProductEditor(item: InvoiceItem) {
  const article = item.customArticle
  if (!article) return

  editingCustomProductId.value = item.id
  Object.assign(customProduct, {
    nombreItem: item.description,
    precioUnitarioItem: item.unitPrice,
    cantidadItem: item.quantity,
    indicadorBienServicio: article.indicadorBienoServicio,
    indicadorFacturacion: item.billingIndicator,
  } satisfies CustomProductForm)
  customProductError.value = ''
  showCustomProductModal.value = true
  await nextTick()
  const modal = getCustomProductModal()
  if (!modal) {
    showCustomProductModal.value = false
    showNotification('Modal no disponible', 'No pudimos inicializar el editor del producto.', 'danger')
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

function getCustomProductModal() {
  if (customProductModalInstance) return customProductModalInstance
  const bootstrap = getBootstrapModalConstructor()
  if (!customProductModalElement.value || !bootstrap) return null

  customProductModalInstance = bootstrap.getOrCreateInstance(customProductModalElement.value, {
    backdrop: true,
    keyboard: true,
    focus: true,
  })
  return customProductModalInstance
}

function getReviewModal() {
  if (reviewModalInstance) return reviewModalInstance
  const bootstrap = getBootstrapModalConstructor()
  if (!reviewModalElement.value || !bootstrap) return null

  reviewModalInstance = bootstrap.getOrCreateInstance(reviewModalElement.value, {
    backdrop: 'static',
    keyboard: false,
    focus: true,
  })
  return reviewModalInstance
}

function getResultModal() {
  if (resultModalInstance) return resultModalInstance
  const bootstrap = getBootstrapModalConstructor()
  if (!resultModalElement.value || !bootstrap) return null

  resultModalInstance = bootstrap.getOrCreateInstance(resultModalElement.value, {
    backdrop: true,
    keyboard: true,
    focus: true,
  })
  return resultModalInstance
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

function handleCustomProductModalShown() {
  showCustomProductModal.value = true
  customProductNameInput.value?.focus()
}

function handleCustomProductModalHidden() {
  showCustomProductModal.value = false
  customProductError.value = ''
  editingCustomProductId.value = null
  customProductSelectorButton.value?.focus()
}

function createEmptyCustomProduct(): CustomProductForm {
  return {
    nombreItem: '',
    precioUnitarioItem: 0,
    cantidadItem: 1,
    indicadorBienServicio: 0,
    indicadorFacturacion: -1,
  }
}

function preferredBillingIndicator() {
  return billingIndicators.value.find(indicator => indicator.codigo === 1)?.codigo
    ?? billingIndicators.value.find(indicator => indicator.codigo !== 0)?.codigo
    ?? billingIndicators.value[0]?.codigo
    ?? -1
}

function numericAmount(value: string) {
  const normalized = value.replace(/,/g, '').replace(/[^0-9.]/g, '')
  const [integer = '', ...decimals] = normalized.split('.')
  const amount = Number(`${integer}.${decimals.join('')}`)
  return Number.isFinite(amount) ? amount : 0
}

function formatEditableAmount(value: number | string | null | undefined) {
  const source = String(value ?? '').replace(/,/g, '').replace(/[^0-9.]/g, '')
  if (!source || source === '.') return ''

  const [integerPart = '', decimalPart = ''] = source.split('.')
  const integer = integerPart.replace(/^0+(?=\d)/, '') || '0'
  const groupedInteger = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(integer))
  return `${groupedInteger}.${decimalPart.slice(0, 2).padEnd(2, '0')}`
}

function selectEditableAmount(event: FocusEvent) {
  const input = event.target as HTMLInputElement
  input.select()
}

function updateCustomProductPrice(event: Event) {
  const input = event.target as HTMLInputElement
  const typedValue = input.value
  const cursor = input.selectionStart ?? typedValue.length
  const decimalPosition = typedValue.indexOf('.')
  const integerDigitsBeforeCursor = typedValue.slice(0, decimalPosition === -1 ? cursor : Math.min(cursor, decimalPosition)).replace(/\D/g, '').length
  const decimalsBeforeCursor = decimalPosition !== -1 && cursor > decimalPosition
    ? Math.min(2, typedValue.slice(decimalPosition + 1, cursor).replace(/\D/g, '').length)
    : 0
  const formattedValue = formatEditableAmount(typedValue)

  customProduct.precioUnitarioItem = numericAmount(typedValue)
  input.value = formattedValue

  nextTick(() => {
    if (!formattedValue) {
      input.setSelectionRange(0, 0)
      return
    }

    const formattedDecimalPosition = formattedValue.indexOf('.')
    let nextCursor = formattedDecimalPosition

    if (decimalPosition !== -1 && cursor > decimalPosition) {
      nextCursor = formattedDecimalPosition + 1 + decimalsBeforeCursor
    } else {
      let seenDigits = 0
      for (let index = 0; index < formattedDecimalPosition; index += 1) {
        if (/\d/.test(formattedValue[index] ?? '')) seenDigits += 1
        if (seenDigits === integerDigitsBeforeCursor) {
          nextCursor = index + 1
          break
        }
      }
      if (integerDigitsBeforeCursor === 0) nextCursor = 0
    }

    input.setSelectionRange(nextCursor, nextCursor)
  })
}

function saveCustomProduct() {
  const name = customProduct.nombreItem.trim()
  const unitPrice = Number(customProduct.precioUnitarioItem)
  const quantity = Number(customProduct.cantidadItem)
  const itemKind = Number(customProduct.indicadorBienServicio)
  const billingIndicator = Number(customProduct.indicadorFacturacion)

  if (!name) {
    customProductError.value = 'El nombre del producto o servicio es obligatorio.'
    return
  }
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    customProductError.value = 'El precio unitario debe ser mayor que cero.'
    return
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    customProductError.value = 'La cantidad debe ser un número entero mayor que cero para la unidad 46.'
    return
  }
  if (![1, 2].includes(itemKind)) {
    customProductError.value = 'Selecciona si la línea corresponde a un bien o a un servicio.'
    return
  }
  if (!billingIndicators.value.some(indicator => indicator.codigo === billingIndicator)) {
    customProductError.value = 'Selecciona un indicador de facturación disponible.'
    return
  }

  const editingItem = editingCustomProductId.value === null
    ? undefined
    : invoice.items.find(item => item.id === editingCustomProductId.value && item.customArticle)

  if (editingItem?.customArticle) {
    editingItem.description = name
    editingItem.quantity = quantity
    editingItem.unitPrice = unitPrice
    editingItem.billingIndicator = billingIndicator
    Object.assign(editingItem.customArticle, {
      nombreItem: name,
      precioUnitarioItem: unitPrice,
      indicadorFacturacion: billingIndicator,
      indicadorBienoServicio: itemKind,
    })
    getCustomProductModal()?.hide()
    showNotification('Producto actualizado', `${name} fue actualizado en esta factura.`, 'success')
    return
  }

  const nextId = Math.max(...invoice.items.map(item => item.id), 0) + 1
  const articleId = `custom-${Date.now()}-${nextId}`
  const article: Article = {
    id: articleId,
    tenantId: auth.profile?.empresa.tenantId ?? '',
    codigo: null,
    tipoCodigo: null,
    indicadorFacturacion: billingIndicator,
    nombreItem: name,
    indicadorBienoServicio: itemKind,
    descripcionItem: null,
    unidadMedida: CUSTOM_PRODUCT_UNIT_CODE,
    precioUnitarioItem: unitPrice,
    existencia: 0,
    codigoImpuesto: null,
    cantidadReferencia: null,
    unidadReferencia: null,
    gradosAlcohol: null,
    precioUnitarioReferencia: null,
    activo: true,
  }

  invoice.items.push({
    id: nextId,
    articleId,
    description: name,
    quantity,
    unitPrice,
    billingIndicator,
    customArticle: article,
  })
  getCustomProductModal()?.hide()
  showNotification('Producto agregado', `${name} fue agregado únicamente a esta factura.`, 'success')
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
  return item.customArticle ?? articles.value.find(article => article.id === item.articleId)
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
    invoice.paymentMethod = paymentMethods.value.find(item => item.codigo === '1')?.codigo ?? paymentMethods.value[0]?.codigo ?? ''
  }
  if (!incomeTypes.value.some(item => item.codigo === invoice.incomeType)) {
    invoice.incomeType = incomeTypes.value.find(item => item.codigo === '01')?.codigo ?? incomeTypes.value[0]?.codigo ?? ''
  }
  if (!paymentTypes.value.some(item => item.codigo === invoice.paymentType)) {
    invoice.paymentType = paymentTypes.value.find(item => item.codigo === 1)?.codigo ?? paymentTypes.value[0]?.codigo ?? 0
  }
  if (invoice.paymentType === 2 && !paymentTerms.value.some(item => item.codigo === invoice.paymentTerm)) {
    invoice.paymentTerm = paymentTerms.value[0]?.codigo ?? ''
  }
}

function saveDraftSilently() {
  localStorage.setItem(DRAFT_INVOICE_KEY, JSON.stringify(invoice))
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
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
  const savedDraft = localStorage.getItem(DRAFT_INVOICE_KEY)
  const invoiceToRestore = pendingInvoice || savedDraft
  if (!invoiceToRestore) return

  try {
    const restored = JSON.parse(invoiceToRestore) as Partial<typeof invoice>
    Object.assign(invoice, restored, {
      items: Array.isArray(restored.items) ? restored.items : [],
    })
    if (!pendingInvoice && savedDraft) {
      showNotification('Borrador recuperado', 'Restauramos la factura guardada en este navegador.', 'info')
    }
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

.client-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 1.1rem;
}

.link-action {
  border: 0;
  background: transparent;
  padding: 0;
  color: #0d6efd;
  font-size: 0.84rem;
  font-weight: 600;
}

.link-action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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

.fiscal-review-grid > div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.9rem;
  border: 1px solid #e5eaf2;
  border-radius: 12px;
  background: #f8fafc;
}

.fiscal-review-grid span,
.fiscal-result-details dt {
  color: #667085;
  font-size: 0.75rem;
  font-weight: 600;
}

.fiscal-result-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #d8e7ff;
  border-radius: 14px;
  color: #0d6efd;
  background: #f3f8ff;
}

.fiscal-result-card > i {
  font-size: 2rem;
}

.fiscal-result-card > div {
  display: flex;
  flex-direction: column;
}

.fiscal-result-card strong {
  color: #101828;
  font-size: 1.1rem;
}

.fiscal-result-card small {
  color: #667085;
}

.fiscal-result-accepted {
  border-color: #b7e4ca;
  color: #198754;
  background: #f0fff6;
}

.fiscal-result-conditionally-accepted {
  border-color: #ffe69c;
  color: #997404;
  background: #fff9e6;
}

.fiscal-result-rejected {
  border-color: #f5c2c7;
  color: #dc3545;
  background: #fff5f6;
}

.fiscal-result-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 0;
}

.fiscal-result-details > div {
  padding: 0.85rem;
  border: 1px solid #e5eaf2;
  border-radius: 12px;
}

.fiscal-result-details dd {
  margin: 0.2rem 0 0;
  color: #101828;
  font-weight: 600;
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

.line-description-editor {
  display: flex;
  min-width: 250px;
  align-items: center;
  gap: 0.35rem;
}

.line-description-editor .table-input {
  min-width: 0;
  flex: 1 1 auto;
}

.line-edit-save,
.line-edit-cancel {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #fff;
  font-size: 1.1rem;
}

.line-edit-save:focus-visible,
.line-edit-cancel:focus-visible {
  outline: 2px solid #101828;
  outline-offset: 2px;
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

.action-btn + .action-btn {
  margin-left: 0.35rem;
}

.action-btn:not(.danger):hover:not(:disabled) {
  border-color: #b9d3ff;
  background: #f1f6ff;
  color: #0d6efd;
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

.line-add-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.mobile-invoice-items,
.selector-mobile-list {
  display: none;
}

.custom-line-button {
  border-style: solid;
  border-color: #c9d5e7;
  background: #fff;
  color: #344054;
}

.custom-line-button:hover {
  border-color: #9dbce8;
  background: #f8fbff;
  color: #175cd3;
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

.summary-card .side-card-title {
  margin-bottom: 1rem;
}

.summary-status {
  display: block;
  margin-top: .2rem;
  color: #667085;
  font-size: .75rem;
}

.summary-status i {
  margin-right: .35rem;
  color: #d97706;
  font-size: .42rem;
  vertical-align: middle;
}

.summary-section {
  margin-top: 1.1rem;
  padding-top: 1.1rem;
  border-top: 1px solid #e5eaf2;
}

.summary-section h3 {
  margin: 0 0 .9rem;
  color: #101828;
  font-size: .9rem;
  font-weight: 700;
}

.summary-section h3 i {
  margin-right: .5rem;
  color: #0d6efd;
}

.summary-readiness {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-top: 1rem;
  padding: .7rem .8rem;
  border-radius: 10px;
  font-size: .82rem;
  font-weight: 650;
}

.summary-readiness.has-pending {
  color: #92400e;
  background: #fffbeb;
}

.summary-readiness.is-ready {
  color: #067647;
  background: #ecfdf3;
}

.validation-toggle {
  display: flex;
  width: 100%;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  padding: .35rem .15rem 0;
  border: 0;
  background: transparent;
  color: #175cd3;
  font-size: .81rem;
  font-weight: 650;
  text-align: left;
}

.validation-toggle:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

.validation-toggle + .validation-list {
  margin: .15rem 0 0;
  padding: .65rem .8rem;
  border-radius: 10px;
  background: #f8fafc;
}

.validation-toggle + .validation-list li {
  margin-bottom: .45rem;
  font-size: .8rem;
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

@media (max-width: 767.98px) {
  .invoice-items-table,
  .selector-table {
    display: none;
  }

  .mobile-invoice-items,
  .selector-mobile-list {
    display: grid;
    gap: .75rem;
  }

  .mobile-invoice-item,
  .selector-mobile-card {
    min-width: 0;
    padding: 1rem;
    border: 1px solid #e5eaf2;
    border-radius: 12px;
    background: #fff;
  }

  .mobile-item-heading,
  .selector-mobile-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: .6rem;
  }

  .mobile-item-heading {
    flex-wrap: wrap;
  }

  .mobile-item-description,
  .selector-mobile-heading strong {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .mobile-item-description {
    flex: 1 1 170px;
  }

  .mobile-item-description .line-description-editor {
    min-width: 0;
  }

  .mobile-item-heading .tax-badge {
    flex: 0 0 auto;
  }

  .mobile-item-details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .8rem;
    margin: .9rem 0;
  }

  .mobile-item-details label,
  .mobile-item-details > div {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: .25rem;
    color: #667085;
    font-size: .76rem;
    font-weight: 500;
  }

  .mobile-item-details strong {
    color: #344054;
    font-size: .86rem;
    overflow-wrap: anywhere;
  }

  .mobile-item-details label small {
    font-size: .68rem;
  }

  .mobile-item-details .quantity-input {
    width: 100%;
    max-width: 110px;
    text-align: left;
  }

  .mobile-item-amount {
    grid-column: 1 / -1;
    padding-top: .7rem;
    border-top: 1px solid #edf0f5;
  }

  .mobile-item-amount strong {
    color: #101828;
    font-size: 1rem;
  }

  .mobile-item-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .5rem;
  }

  .mobile-item-actions .btn,
  .selector-mobile-card .btn {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    gap: .4rem;
    font-size: .8rem;
  }

  .selector-mobile-card {
    display: flex;
    flex-direction: column;
    gap: .35rem;
  }

  .selector-mobile-card.is-selected {
    border-color: #b9d3ff;
    background: #f8fbff;
  }

  .selector-mobile-card > strong,
  .selector-mobile-card .selector-mobile-heading > strong {
    color: #101828;
    font-size: .9rem;
  }

  .selector-mobile-card small {
    color: #667085;
    font-size: .75rem;
    overflow-wrap: anywhere;
  }

  .selector-mobile-facts {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: .75rem;
    margin: .45rem 0;
    font-size: .75rem;
  }

  .selector-mobile-facts > span:first-child {
    display: flex;
    flex-direction: column;
  }

  .selector-mobile-facts strong {
    color: #344054;
    font-size: .9rem;
  }

  .selector-mobile-card .btn {
    width: 100%;
    margin-top: .35rem;
  }

  .product-results {
    border: 0;
  }

  .product-modal-body .product-search-wrap {
    position: sticky;
    top: 0;
    z-index: 2;
    padding-bottom: .6rem;
    background: #fff;
  }
}

@media (max-width: 399.98px) {
  .mobile-item-actions {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 575.98px) {
  .line-add-actions {
    grid-template-columns: 1fr;
  }

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

  .summary-row,
  .summary-exchange {
    flex-wrap: wrap;
  }

  .summary-row strong,
  .summary-total strong,
  .summary-exchange strong {
    max-width: 100%;
    overflow-wrap: anywhere;
    white-space: normal;
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
    align-self: flex-end;
    width: auto;
  }

  .product-search-wrap > i {
    top: .85rem;
  }
}
</style>
