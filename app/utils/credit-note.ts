import type { Article, BillingIndicator } from '~/types/article'
import type { Client } from '~/types/client'
import type { EcfBuyer, EcfIssuer, EcfRequest, EcfTotals } from '~/types/ecf'
import {
  calculateInvoice,
  EcfValidationError,
  roundMoney,
  toFiscalDate,
  type InvoiceDraftItem,
  type IssuerConfiguration,
} from '~/utils/ecf'

const DEFAULT_ISSUER_ADDRESS = 'Santo Domingo, Distrito Nacional, Republica Dominicana'

export type CreditNoteModificationCode = 1 | 2 | 3

export interface CreditNoteSource {
  id: number
  encf: string
  documentType: string
  issueDate: string
  buyerRnc: string | null
  total: number | null
}

export interface CreditNoteDraft {
  source: CreditNoteSource
  issueDate: string
  incomeType: string
  paymentType: number
  modificationCode: CreditNoteModificationCode
  reason: string
  internalReference?: string
  notes?: string
  client?: Client
  items: InvoiceDraftItem[]
}

export interface CreditNoteCalculation {
  subtotal: number
  taxTotal: number
  total: number
  taxCreditAllowed: boolean
  daysSinceOriginal: number
  indicator: 0 | 1
  totals: EcfTotals
}

export function calculateCreditNote(
  draft: CreditNoteDraft,
  billingIndicators: BillingIndicator[],
): CreditNoteCalculation {
  const daysSinceOriginal = calendarDaysBetween(draft.source.issueDate, draft.issueDate)
  const indicator = daysSinceOriginal > 30 ? 1 : 0
  const invoiceCalculation = calculateInvoice({
    documentType: '34',
    issueDate: draft.issueDate,
    incomeType: draft.incomeType,
    paymentType: draft.paymentType,
    paymentMethod: '',
    currency: 'DOP',
    discount: 0,
    client: draft.client,
    items: draft.items,
  }, billingIndicators)

  if (indicator === 0) {
    return {
      subtotal: invoiceCalculation.subtotal,
      taxTotal: invoiceCalculation.taxTotal,
      total: invoiceCalculation.total,
      taxCreditAllowed: true,
      daysSinceOriginal,
      indicator,
      totals: invoiceCalculation.totals,
    }
  }

  const totalWithoutTax = invoiceCalculation.subtotal
  return {
    subtotal: invoiceCalculation.subtotal,
    taxTotal: 0,
    total: totalWithoutTax,
    taxCreditAllowed: false,
    daysSinceOriginal,
    indicator,
    totals: {
      ...invoiceCalculation.totals,
      totalITBIS: null,
      totalITBIS1: null,
      totalITBIS2: null,
      totalITBIS3: null,
      montoTotal: totalWithoutTax,
      valorPagar: totalWithoutTax,
    },
  }
}

export function buildCreditNoteRequest(
  draft: CreditNoteDraft,
  issuer: IssuerConfiguration,
  billingIndicators: BillingIndicator[],
): EcfRequest {
  const errors = validateCreditNoteDraft(draft, issuer, billingIndicators)
  if (errors.length) throw new EcfValidationError(errors)

  const calculation = calculateCreditNote(draft, billingIndicators)

  return {
    ecf: {
      encabezado: {
        version: '1.0',
        idDoc: {
          tipoeCF: '34',
          eNCF: null,
          fechaVencimientoSecuencia: null,
          indicadorNotaCredito: calculation.indicator,
          indicadorEnvioDiferido: null,
          indicadorMontoGravado: 0,
          indicadorServicioTodoIncluido: null,
          tipoIngresos: formatIncomeType(draft.incomeType),
          tipoPago: draft.paymentType,
          fechaLimitePago: null,
          terminoPago: null,
          tablaFormasPago: null,
          tipoCuentaPago: null,
          numeroCuentaPago: null,
          bancoPago: null,
          fechaDesde: null,
          fechaHasta: null,
          totalPaginas: null,
        },
        emisor: createIssuer(draft, issuer),
        comprador: createBuyer(draft.client, draft.source.buyerRnc),
        informacionesAdicionales: null,
        transporte: null,
        totales: calculation.totals,
        otraMoneda: null,
      },
      detallesItems: {
        item: draft.items.map((draftItem, index) => createItem(draftItem.article, draftItem.quantity, draftItem.unitPrice, index)),
      },
      subtotales: null,
      descuentosORecargos: null,
      paginacion: null,
      informacionReferencia: {
        ncfModificado: draft.source.encf.trim(),
        rncOtroContribuyente: null,
        fechaNCFModificado: toFiscalDate(draft.source.issueDate),
        codigoModificacion: draft.modificationCode,
        razonModificacion: nullableText(draft.reason),
      },
      fechaHoraFirma: null,
    },
  }
}

export function validateCreditNoteDraft(
  draft: CreditNoteDraft,
  issuer: IssuerConfiguration,
  billingIndicators: BillingIndicator[],
) {
  const errors: string[] = []
  const sourceNcf = draft.source.encf.trim()
  const reason = draft.reason.trim()

  if (!issuer.rnc.trim() || !issuer.businessName.trim()) errors.push('La empresa de la sesión debe tener RNC y razón social para emitir la nota de crédito.')
  if (!/^[A-Za-z0-9]{11}$|^[A-Za-z0-9]{13}$|^[A-Za-z0-9]{19}$/.test(sourceNcf)) errors.push('El NCF modificado debe tener 11, 13 o 19 caracteres alfanuméricos.')
  if (!['31', '32'].includes(draft.source.documentType)) errors.push('Por seguridad, este flujo permite afectar únicamente facturas E31 o E32.')
  if (!isIsoDate(draft.source.issueDate)) errors.push('La factura original no tiene una fecha de emisión válida.')
  if (!isIsoDate(draft.issueDate)) errors.push('La fecha de emisión de la nota es obligatoria.')
  if (isIsoDate(draft.source.issueDate) && isIsoDate(draft.issueDate) && calendarDaysBetween(draft.source.issueDate, draft.issueDate) < 0) errors.push('La nota de crédito no puede tener una fecha anterior a la factura afectada.')
  if (![1, 2, 3].includes(draft.modificationCode)) errors.push('Selecciona un código de modificación válido para E34.')
  if (!reason) errors.push('Describe la razón de la nota de crédito.')
  if (reason.length > 90) errors.push('La razón de modificación no puede superar 90 caracteres.')
  if (!/^0[1-6]$/.test(formatIncomeType(draft.incomeType))) errors.push('Selecciona un tipo de ingreso válido.')
  if (![1, 2, 3].includes(Number(draft.paymentType))) errors.push('Selecciona un tipo de pago válido.')
  const sourceBuyerRnc = normalizeRnc(draft.source.buyerRnc)
  const clientRnc = normalizeRnc(draft.client?.rncComprador)
  if (draft.source.documentType === '31' && !sourceBuyerRnc) errors.push('La factura E31 original no contiene el RNC necesario para conservar el comprador.')
  if (sourceBuyerRnc && !/^\d{9}$|^\d{11}$/.test(sourceBuyerRnc)) errors.push('El RNC o cédula del comprador original no tiene un formato válido.')
  if (sourceBuyerRnc && draft.client && clientRnc !== sourceBuyerRnc) errors.push('La nota de crédito debe emitirse al mismo comprador de la factura original.')
  if (draft.modificationCode !== 2 && (draft.source.total === null || !Number.isFinite(draft.source.total) || draft.source.total < 0)) errors.push('La factura original no contiene un total válido para verificar el monto acreditado.')
  if (!draft.items.length) errors.push('Agrega al menos una línea a la nota de crédito.')

  draft.items.forEach((draftItem, index) => {
    const line = index + 1
    const article = draftItem.article
    if (!article.nombreItem.trim()) errors.push(`La línea ${line} no tiene nombre.`)
    if (!Number.isFinite(draftItem.quantity) || draftItem.quantity <= 0) errors.push(`La cantidad de la línea ${line} debe ser mayor que cero.`)
    if (!Number.isFinite(draftItem.unitPrice) || draftItem.unitPrice < 0) errors.push(`El precio de la línea ${line} es inválido.`)
    if (draft.modificationCode !== 2 && draftItem.unitPrice <= 0) errors.push(`El precio de la línea ${line} debe ser mayor que cero.`)
    if (![1, 2].includes(Number(article.indicadorBienoServicio))) errors.push(`La línea ${line} no define si es un bien o servicio.`)
    if (article.unidadMedida && (!Number.isInteger(Number(article.unidadMedida)) || Number(article.unidadMedida) <= 0)) errors.push(`La línea ${line} no tiene una unidad de medida válida.`)
    if (!billingIndicators.some(indicator => indicator.codigo === article.indicadorFacturacion)) errors.push(`La línea ${line} no tiene un indicador de facturación disponible.`)
  })

  if (!errors.length) {
    const calculation = calculateCreditNote(draft, billingIndicators)
    if (draft.modificationCode === 2 && calculation.total !== 0) errors.push('Una corrección de texto no debe modificar el monto de la factura.')
    if (draft.modificationCode === 3 && draft.source.total !== null && calculation.total > draft.source.total + 0.01) errors.push('El monto acreditado no puede superar el total de la factura original.')
    if (draft.modificationCode === 1 && calculation.taxCreditAllowed && draft.source.total !== null && Math.abs(calculation.total - draft.source.total) > 0.01) errors.push('La anulación total debe coincidir con el total de la factura original.')
  }

  return [...new Set(errors)]
}

export function calendarDaysBetween(originalDate: string, creditDate: string) {
  if (!isIsoDate(originalDate) || !isIsoDate(creditDate)) return Number.NaN
  const original = Date.parse(`${originalDate}T00:00:00Z`)
  const credit = Date.parse(`${creditDate}T00:00:00Z`)
  return Math.round((credit - original) / 86_400_000)
}

export function fiscalDocumentDateToIso(value: string | null | undefined) {
  if (!value) return null
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const fiscal = /^(\d{2})-(\d{2})-(\d{4})/.exec(value)
  if (fiscal) return `${fiscal[3]}-${fiscal[2]}-${fiscal[1]}`
  return null
}

function createIssuer(draft: CreditNoteDraft, issuer: IssuerConfiguration): EcfIssuer {
  return {
    rncEmisor: issuer.rnc.trim(),
    razonSocialEmisor: issuer.businessName.trim(),
    nombreComercial: nullableText(issuer.tradeName),
    sucursal: nullableText(issuer.branch),
    direccionEmisor: nullableText(issuer.address) ?? DEFAULT_ISSUER_ADDRESS,
    municipio: nullableText(issuer.municipality),
    provincia: nullableText(issuer.province),
    tablaTelefonoEmisor: issuer.phones?.length ? { telefonoEmisor: issuer.phones } : null,
    correoEmisor: nullableText(issuer.email),
    webSite: nullableText(issuer.website),
    actividadEconomica: nullableText(issuer.economicActivity),
    codigoVendedor: null,
    numeroFacturaInterna: nullableText(draft.internalReference),
    numeroPedidoInterno: null,
    zonaVenta: null,
    rutaVenta: null,
    informacionAdicionalEmisor: nullableText(draft.notes),
    fechaEmision: toFiscalDate(draft.issueDate),
  }
}

function createBuyer(client: Client | undefined, sourceBuyerRnc: string | null): EcfBuyer | null {
  const preservedRnc = normalizeRnc(sourceBuyerRnc)
  if (!client && !preservedRnc) return null
  return {
    rncComprador: preservedRnc,
    identificadorExtranjero: nullableText(client?.identificadorExtranjero),
    razonSocialComprador: nullableText(client?.razonSocialComprador),
    contactoComprador: normalizeContact(client?.contactoComprador),
    correoComprador: null,
    direccionComprador: nullableText(client?.direccionComprador),
    municipioComprador: nullableText(client?.municipioComprador),
    provinciaComprador: nullableText(client?.provinciaComprador),
    paisComprador: nullableText(client?.paisComprador),
    fechaEntrega: null,
    contactoEntrega: null,
    direccionEntrega: null,
    telefonoAdicional: nullableText(client?.telefonoAdicional),
    fechaOrdenCompra: null,
    numeroOrdenCompra: null,
    codigoInternoComprador: nullableText(client?.codigoInternoComprador),
    responsablePago: nullableText(client?.responsablePago),
    informacionAdicionalComprador: nullableText(client?.informacionAdicionalComprador),
  }
}

function createItem(article: Article, quantity: number, unitPrice: number, index: number) {
  return {
    numeroLinea: index + 1,
    tablaCodigosItem: article.codigo && article.tipoCodigo
      ? { codigosItem: [{ tipoCodigo: article.tipoCodigo, codigoItem: article.codigo }] }
      : null,
    indicadorFacturacion: article.indicadorFacturacion,
    retencion: null,
    nombreItem: article.nombreItem,
    indicadorBienoServicio: article.indicadorBienoServicio,
    descripcionItem: nullableText(article.descripcionItem),
    cantidadItem: String(quantity),
    unidadMedida: article.unidadMedida || 46,
    cantidadReferencia: article.cantidadReferencia ?? null,
    unidadReferencia: positiveIntegerOrNull(article.unidadReferencia),
    tablaSubcantidad: null,
    gradosAlcohol: positiveNumberOrNull(article.gradosAlcohol),
    precioUnitarioReferencia: positiveNumberOrNull(article.precioUnitarioReferencia),
    fechaElaboracion: null,
    fechaVencimientoItem: null,
    precioUnitarioItem: unitPrice,
    descuentoMonto: null,
    tablaSubDescuento: null,
    recargoMonto: null,
    tablaSubRecargo: null,
    tablaImpuestoAdicional: null,
    otraMonedaDetalle: null,
    montoItem: roundMoney(quantity * unitPrice),
  }
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
}

function nullableText(value: string | null | undefined) {
  return value?.trim() || null
}

function normalizeRnc(value: string | null | undefined) {
  return value?.replace(/[\s-]/g, '') || null
}

function normalizeContact(value: string | null | undefined) {
  return value?.replace(/[\s()-]/g, '') || null
}

function formatIncomeType(value: string) {
  const normalized = value.trim()
  return normalized.length === 1 ? normalized.padStart(2, '0') : normalized
}

function positiveIntegerOrNull(value: number | null | undefined) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

function positiveNumberOrNull(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}
