import type { Article, BillingIndicator } from '~/types/article'
import type { ClientWrite } from '~/types/client'
import type { CompanyProfile } from '~/types/auth'
import type {
  EcfApiResult,
  EcfBuyer,
  EcfIssuer,
  EcfRequest,
  EcfResultStatus,
  EcfTotals,
  FacturacionApiResponse,
} from '~/types/ecf'

const DEFAULT_ISSUER_ADDRESS = 'Santo Domingo, Distrito Nacional, Republica Dominicana'

export interface IssuerConfiguration {
  rnc: string
  businessName: string
  tradeName?: string
  address?: string
  municipality?: string
  province?: string
  phones?: string[]
  email?: string
  website?: string
  economicActivity?: string
  branch?: string
}

export function mapCompanyProfileToIssuer(company: CompanyProfile): IssuerConfiguration {
  const phones = [...new Set([company.telefono, company.telefono2]
    .map(normalizeIssuerPhone)
    .filter((value): value is string => Boolean(value)))]

  return {
    rnc: company.rnc?.trim() ?? '',
    businessName: company.nombreRazonSocial?.trim() ?? '',
    ...optionalIssuerField('address', company.direccion),
    ...optionalIssuerField('tradeName', company.nombreComercial),
    ...optionalIssuerField('branch', company.sucursal),
    ...optionalIssuerField('municipality', company.municipioId),
    ...optionalIssuerField('province', company.provinciaId),
    ...(phones.length ? { phones } : {}),
    ...optionalIssuerField('email', company.correo),
    ...optionalIssuerField('website', company.webSite),
    ...optionalIssuerField('economicActivity', company.actividadEconomica),
  }
}

export interface InvoiceDraftItem {
  article: Article
  description?: string
  quantity: number
  unitPrice: number
}

export interface InvoiceDraft {
  documentType: string
  issueDate: string
  dueDate?: string
  incomeType: string
  paymentType: number
  paymentMethod: string
  paymentTerm?: string
  currency: string
  discount: number
  internalReference?: string
  purchaseOrder?: string
  notes?: string
  client?: ClientWrite
  buyerEmail?: string | null
  items: InvoiceDraftItem[]
}

export interface InvoiceOnlyBuyerInput {
  razonSocialComprador: string
  rncComprador: string
  identificadorExtranjero: string
  contactoComprador: string
  correoComprador: string
  direccionComprador: string
  paisComprador: string
}

export function prepareInvoiceOnlyBuyer(input: InvoiceOnlyBuyerInput, documentType: string): ClientWrite {
  const name = input.razonSocialComprador.trim()
  const rnc = input.rncComprador.replace(/[\s-]/g, '')
  const foreignId = input.identificadorExtranjero.trim()
  const contact = input.contactoComprador.trim()
  const email = input.correoComprador.trim()
  const address = input.direccionComprador.trim()
  const country = input.paisComprador.trim()
  const errors: string[] = []

  if (!name || name.length > 150) errors.push('Escribe el nombre o razón social del comprador (máximo 150 caracteres).')
  if (documentType === '31' && !rnc) errors.push('El comprobante E31 requiere el RNC o cédula del comprador.')
  if (rnc && !/^(?:\d{9}|\d{11})$/.test(rnc)) errors.push('El RNC o cédula debe tener 9 u 11 dígitos.')
  if (foreignId.length > 20) errors.push('El identificador extranjero no puede superar 20 caracteres.')
  if (contact.length > 80) errors.push('El contacto no puede superar 80 caracteres.')
  if (!isValidInvoiceBuyerEmail(email)) errors.push('Escribe un correo válido de hasta 80 caracteres.')
  if (address.length > 100) errors.push('La dirección no puede superar 100 caracteres.')
  if (country.length > 60) errors.push('El país no puede superar 60 caracteres.')
  if (errors.length) throw new EcfValidationError(errors)

  return {
    razonSocialComprador: name,
    rncComprador: rnc || null,
    identificadorExtranjero: foreignId || null,
    contactoComprador: contact || null,
    correoComprador: email || null,
    direccionComprador: address || null,
    paisComprador: country || null,
    municipioComprador: null,
    provinciaComprador: null,
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
  }
}

export function isValidInvoiceBuyerEmail(email: string) {
  const normalized = email.trim()
  return !normalized || (normalized.length <= 80 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
}

export interface InvoiceCalculation {
  subtotal: number
  taxableTotal: number
  exemptTotal: number
  nonBillableTotal: number
  taxTotal: number
  total: number
  totals: EcfTotals
}

export class EcfValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(errors[0] ?? 'La factura contiene información fiscal inválida.')
    this.name = 'EcfValidationError'
  }
}

export class DuplicateSubmissionError extends Error {
  constructor() {
    super('La factura ya se está enviando.')
    this.name = 'DuplicateSubmissionError'
  }
}

export function createSubmissionLock() {
  let locked = false

  return {
    isLocked: () => locked,
    async run<T>(operation: () => Promise<T>) {
      if (locked) throw new DuplicateSubmissionError()
      locked = true
      try {
        return await operation()
      } finally {
        locked = false
      }
    },
  }
}

export function validateFacturacionApiResponse(value: unknown): FacturacionApiResponse {
  if (!isRecord(value)) throw new Error('La API devolvió una respuesta de facturación inválida.')

  const nullableStringKeys = [
    'Encf',
    'FechaEmision',
    'FechaVencimientoSecuencia',
    'FechaFirma',
    'CodigoSeguridad',
    'EstadoEncf',
    'UrlVerificacionDGII',
    'UrlDocumentoPdf',
    'DocumentoB64',
  ] as const

  for (const key of nullableStringKeys) {
    if (!(key in value) || (value[key] !== null && typeof value[key] !== 'string')) {
      throw new Error(`La respuesta de facturación no contiene un ${key} válido.`)
    }
  }

  if (typeof value.SecuenciaUtilizada !== 'boolean') {
    throw new Error('La respuesta de facturación no contiene una SecuenciaUtilizada válida.')
  }

  if (value.Mensajes !== null) {
    if (!isRecord(value.Mensajes) || !('Mensaje' in value.Mensajes)) {
      throw new Error('La respuesta de facturación contiene Mensajes inválidos.')
    }

    const messages = value.Mensajes.Mensaje
    if (messages !== null && (!Array.isArray(messages) || messages.some(message => typeof message !== 'string'))) {
      throw new Error('La respuesta de facturación contiene una lista de mensajes inválida.')
    }
  }

  return value as unknown as FacturacionApiResponse
}

export function mapFacturacionResponse(raw: FacturacionApiResponse): EcfApiResult {
  return {
    encf: normalizeNullableLiteral(raw.Encf),
    fechaEmision: normalizeNullableLiteral(raw.FechaEmision),
    fechaVencimientoSecuencia: normalizeNullableLiteral(raw.FechaVencimientoSecuencia),
    fechaFirma: normalizeNullableLiteral(raw.FechaFirma),
    codigoSeguridad: normalizeNullableLiteral(raw.CodigoSeguridad),
    estadoEncf: normalizeNullableLiteral(raw.EstadoEncf),
    secuenciaUtilizada: raw.SecuenciaUtilizada,
    urlVerificacionDGII: normalizeNullableLiteral(raw.UrlVerificacionDGII),
    urlDocumentoPdf: normalizeNullableLiteral(raw.UrlDocumentoPdf),
    mensajes: raw.Mensajes?.Mensaje?.filter(message => Boolean(message?.trim())) ?? [],
    documentoB64: normalizeNullableLiteral(raw.DocumentoB64),
  }
}

export function classifyEcfResult(result: EcfApiResult): EcfResultStatus {
  const status = result.estadoEncf?.toLocaleLowerCase('es') ?? ''
  if (status.includes('aceptado condicional')) return 'conditionally-accepted'
  if (status.includes('rechazado') || status.includes('no aceptado')) return 'rejected'
  if (status.includes('aceptado')) return 'accepted'
  return 'processed'
}

export function calculateInvoice(
  draft: InvoiceDraft,
  billingIndicators: BillingIndicator[],
): InvoiceCalculation {
  const groups = new Map<number, { base: number; tax: number; rate: number }>()

  for (const draftItem of draft.items) {
    const indicator = billingIndicators.find(item => item.codigo === draftItem.article.indicadorFacturacion)
    if (!indicator) throw new EcfValidationError([`No existe el indicador fiscal de ${draftItem.article.nombreItem}.`])

    const base = roundMoney(draftItem.quantity * draftItem.unitPrice)
    const tax = roundMoney(base * Number(indicator.tasaItbis || 0) / 100)
    const current = groups.get(indicator.codigo) ?? { base: 0, tax: 0, rate: Number(indicator.tasaItbis || 0) }
    current.base = roundMoney(current.base + base)
    current.tax = roundMoney(current.tax + tax)
    groups.set(indicator.codigo, current)
  }

  const group1 = groups.get(1)
  const group2 = groups.get(2)
  const group3 = groups.get(3)
  const exempt = groups.get(4)?.base ?? 0
  const nonBillable = groups.get(0)?.base ?? 0
  const taxableTotal = roundMoney((group1?.base ?? 0) + (group2?.base ?? 0) + (group3?.base ?? 0))
  const taxTotal = roundMoney((group1?.tax ?? 0) + (group2?.tax ?? 0) + (group3?.tax ?? 0))
  const subtotal = roundMoney(taxableTotal + exempt + nonBillable)
  const total = roundMoney(taxableTotal + exempt + taxTotal - Number(draft.discount || 0))

  const totals: EcfTotals = {
    montoGravadoTotal: taxableTotal > 0 ? taxableTotal : null,
    montoGravadoI1: group1?.base ?? null,
    montoGravadoI2: group2?.base ?? null,
    montoGravadoI3: group3?.base ?? null,
    montoExento: exempt > 0 ? exempt : null,
    itbiS1: group1?.rate ?? null,
    itbiS2: group2?.rate ?? null,
    itbiS3: group3?.rate ?? null,
    totalITBIS: taxableTotal > 0 ? taxTotal : null,
    totalITBIS1: group1?.tax ?? null,
    totalITBIS2: group2?.tax ?? null,
    totalITBIS3: group3?.tax ?? null,
    montoImpuestoAdicional: null,
    impuestosAdicionales: null,
    montoTotal: total,
    montoNoFacturable: nonBillable > 0 ? nonBillable : null,
    montoPeriodo: null,
    saldoAnterior: null,
    montoAvancePago: null,
    valorPagar: total,
    totalITBISRetenido: null,
    totalISRRetencion: null,
    totalITBISPercepcion: null,
    totalISRPercepcion: null,
  }

  return { subtotal, taxableTotal, exemptTotal: exempt, nonBillableTotal: nonBillable, taxTotal, total, totals }
}

export function buildEcfRequest(
  draft: InvoiceDraft,
  issuer: IssuerConfiguration,
  billingIndicators: BillingIndicator[],
): EcfRequest {
  const errors = validateInvoiceDraft(draft, issuer, billingIndicators)
  if (errors.length) throw new EcfValidationError(errors)

  const calculation = calculateInvoice(draft, billingIndicators)
  const paymentMethod = Number(draft.paymentMethod)
  const buyer: EcfBuyer | null = draft.client ? {
    rncComprador: normalizeBuyerRnc(draft.client.rncComprador),
    identificadorExtranjero: nullableText(draft.client.identificadorExtranjero),
    razonSocialComprador: nullableText(draft.client.razonSocialComprador),
    contactoComprador: normalizeBuyerContact(draft.client.contactoComprador),
    correoComprador: nullableText(draft.buyerEmail ?? draft.client.correoComprador),
    direccionComprador: nullableText(draft.client.direccionComprador),
    municipioComprador: nullableText(draft.client.municipioComprador),
    provinciaComprador: nullableText(draft.client.provinciaComprador),
    paisComprador: nullableText(draft.client.paisComprador),
    fechaEntrega: normalizeOptionalFiscalDate(draft.client.fechaEntrega),
    contactoEntrega: nullableText(draft.client.contactoEntrega),
    direccionEntrega: nullableText(draft.client.direccionEntrega),
    telefonoAdicional: nullableText(draft.client.telefonoAdicional),
    fechaOrdenCompra: null,
    numeroOrdenCompra: nullableText(draft.purchaseOrder),
    codigoInternoComprador: nullableText(draft.client.codigoInternoComprador),
    responsablePago: nullableText(draft.client.responsablePago),
    informacionAdicionalComprador: nullableText(draft.client.informacionAdicionalComprador),
  } : null

  const ecfIssuer: EcfIssuer = {
    rncEmisor: issuer.rnc,
    razonSocialEmisor: issuer.businessName,
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

  return {
    ecf: {
      encabezado: {
        version: '1.0',
        idDoc: {
          tipoeCF: draft.documentType,
          eNCF: null,
          fechaVencimientoSecuencia: null,
          indicadorNotaCredito: null,
          indicadorEnvioDiferido: null,
          indicadorMontoGravado: 0,
          indicadorServicioTodoIncluido: null,
          tipoIngresos: formatIncomeType(draft.incomeType),
          tipoPago: draft.paymentType,
          fechaLimitePago: draft.paymentType === 2 && draft.dueDate ? toFiscalDate(draft.dueDate) : null,
          terminoPago: nullableText(draft.paymentTerm),
          tablaFormasPago: {
            formaDePago: [{ formaPago: paymentMethod, montoPago: calculation.total }],
          },
          tipoCuentaPago: null,
          numeroCuentaPago: null,
          bancoPago: null,
          fechaDesde: null,
          fechaHasta: null,
          totalPaginas: null,
        },
        emisor: ecfIssuer,
        comprador: buyer,
        informacionesAdicionales: null,
        transporte: null,
        totales: calculation.totals,
        otraMoneda: null,
      },
      detallesItems: {
        item: draft.items.map((draftItem, index) => {
          const article = draftItem.article
          const itemName = draftItem.description?.trim() || article.nombreItem
          return {
            numeroLinea: index + 1,
            tablaCodigosItem: article.codigo && article.tipoCodigo
              ? { codigosItem: [{ tipoCodigo: article.tipoCodigo, codigoItem: article.codigo }] }
              : null,
            indicadorFacturacion: article.indicadorFacturacion,
            retencion: null,
            nombreItem: itemName,
            indicadorBienoServicio: article.indicadorBienoServicio,
            descripcionItem: nullableText(article.descripcionItem),
            cantidadItem: String(draftItem.quantity),
            unidadMedida: article.unidadMedida,
            cantidadReferencia: article.cantidadReferencia ?? null,
            unidadReferencia: nullablePositiveInteger(article.unidadReferencia),
            tablaSubcantidad: null,
            gradosAlcohol: nullablePositiveNumber(article.gradosAlcohol),
            precioUnitarioReferencia: nullablePositiveNumber(article.precioUnitarioReferencia),
            fechaElaboracion: null,
            fechaVencimientoItem: null,
            precioUnitarioItem: draftItem.unitPrice,
            descuentoMonto: null,
            tablaSubDescuento: null,
            recargoMonto: null,
            tablaSubRecargo: null,
            tablaImpuestoAdicional: null,
            otraMonedaDetalle: null,
            montoItem: roundMoney(draftItem.quantity * draftItem.unitPrice),
          }
        }),
      },
      subtotales: null,
      descuentosORecargos: null,
      paginacion: null,
      informacionReferencia: null,
      fechaHoraFirma: null,
    },
  }
}

export function validateInvoiceDraft(
  draft: InvoiceDraft,
  issuer: IssuerConfiguration,
  billingIndicators: BillingIndicator[],
) {
  const errors: string[] = []
  if (!['31', '32'].includes(draft.documentType)) errors.push('La primera integración permite únicamente comprobantes E31 y E32.')
  if (!issuer.rnc.trim() || !issuer.businessName.trim()) errors.push('La empresa de la sesión debe tener RNC y razón social para poder emitir.')
  if (!draft.issueDate) errors.push('La fecha de emisión es obligatoria.')
  if (!draft.incomeType) errors.push('El tipo de ingreso es obligatorio.')
  if (Number(draft.paymentType) !== 1) errors.push('La primera integración permite únicamente el tipo de pago 1, cubierto por el ejemplo fiscal vigente.')
  if (draft.paymentType === 2 && !draft.dueDate) errors.push('La fecha límite de pago es obligatoria para ventas a crédito.')
  if (!Number.isInteger(Number(draft.paymentMethod)) || Number(draft.paymentMethod) < 1 || Number(draft.paymentMethod) > 8) errors.push('Selecciona una forma de pago válida.')
  if (draft.currency !== 'DOP') errors.push('La primera integración fiscal sólo permite facturas en DOP.')
  if (Number(draft.discount || 0) !== 0) errors.push('El descuento global debe ser cero hasta implementar su distribución fiscal por indicador.')
  if (!draft.client) errors.push('Selecciona un cliente.')
  if (draft.client && !draft.client.razonSocialComprador?.trim()) errors.push('Escribe el nombre o razón social del comprador.')
  if (!isValidInvoiceBuyerEmail(draft.buyerEmail ?? draft.client?.correoComprador ?? '')) errors.push('Escribe un correo válido de hasta 80 caracteres para esta factura.')
  if (draft.documentType === '31' && !draft.client?.rncComprador?.trim()) errors.push('El comprobante E31 requiere el RNC del comprador.')
  if (draft.client?.municipioComprador && !/^\d{6}$/.test(draft.client.municipioComprador.trim())) errors.push('El municipio del comprador debe ser un código de seis dígitos.')
  if (draft.client?.provinciaComprador && !/^\d{6}$/.test(draft.client.provinciaComprador.trim())) errors.push('La provincia del comprador debe ser un código de seis dígitos.')
  if (!draft.items.length) errors.push('Agrega al menos un artículo o servicio.')

  draft.items.forEach((draftItem, index) => {
    const line = index + 1
    if (!(draftItem.description?.trim() || draftItem.article.nombreItem.trim())) errors.push(`La línea ${line} no tiene nombre.`)
    if (!Number.isFinite(draftItem.quantity) || draftItem.quantity <= 0) errors.push(`La cantidad de la línea ${line} debe ser mayor que cero.`)
    if (!Number.isFinite(draftItem.unitPrice) || draftItem.unitPrice < 0) errors.push(`El precio de la línea ${line} es inválido.`)
    if (![1, 2].includes(Number(draftItem.article.indicadorBienoServicio))) errors.push(`La línea ${line} no define si es un bien o servicio.`)
    if (!Number.isInteger(Number(draftItem.article.unidadMedida)) || Number(draftItem.article.unidadMedida) <= 0) errors.push(`La línea ${line} no tiene una unidad de medida válida.`)
    if (!billingIndicators.some(indicator => indicator.codigo === draftItem.article.indicadorFacturacion)) errors.push(`La línea ${line} no tiene un indicador de facturación disponible.`)
    if (draftItem.article.indicadorFacturacion === 0) errors.push(`La línea ${line} usa el indicador no facturable, todavía no habilitado para emisión.`)
  })

  return [...new Set(errors)]
}

export function toFiscalDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) throw new EcfValidationError([`La fecha ${isoDate || '(vacía)'} no tiene formato yyyy-MM-dd.`])
  return `${match[3]}-${match[2]}-${match[1]}`
}

export function decodeBase64Pdf(base64: string) {
  const normalized = base64.replace(/^data:application\/pdf;base64,/, '').replace(/\s/g, '')
  if (!normalized) throw new Error('La API devolvió un PDF vacío.')

  try {
    const binary = atob(normalized)
    return Uint8Array.from(binary, character => character.charCodeAt(0))
  } catch {
    throw new Error('La API devolvió un PDF Base64 inválido.')
  }
}

export function createPdfBlob(base64: string) {
  return new Blob([decodeBase64Pdf(base64)], { type: 'application/pdf' })
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function optionalIssuerField<Key extends keyof IssuerConfiguration>(key: Key, value: string | null) {
  const normalizedValue = value?.trim()
  return normalizedValue ? { [key]: normalizedValue } as Pick<IssuerConfiguration, Key> : {}
}

function normalizeNullableLiteral(value: string | null) {
  if (value === null || value.trim() === '' || value.trim().toLocaleLowerCase('en') === 'none') return null
  return value
}

function nullableText(value: string | null | undefined) {
  const normalizedValue = value?.trim()
  return normalizedValue || null
}

function formatIncomeType(value: string) {
  const normalizedValue = value.trim()
  return normalizedValue.length === 1 ? normalizedValue.padStart(2, '0') : normalizedValue
}

function normalizeIssuerPhone(value: string | null) {
  const digits = value?.replace(/\D/g, '') ?? ''
  if (!/^\d{10}$/.test(digits)) return null
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

function nullablePositiveInteger(value: number | null | undefined) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

function nullablePositiveNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function normalizeBuyerRnc(value: string | null | undefined) {
  const normalizedValue = value?.replace(/[\s-]/g, '')
  return normalizedValue || null
}

function normalizeBuyerContact(value: string | null | undefined) {
  const normalizedValue = value?.replace(/[\s()-]/g, '')
  return normalizedValue || null
}

function normalizeOptionalFiscalDate(value: string | null | undefined) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return toFiscalDate(value)
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
