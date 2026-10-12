import type { FiscalDocument, FiscalDocumentSearchParams, PagedResponse } from '~/types/ecf'

export function createFiscalDocumentSearchQuery(params: FiscalDocumentSearchParams) {
  return {
    encfTipo: params.encfTipo,
    encf: params.encf,
    rncEmisor: params.rncEmisor,
    rncComprador: params.rncComprador,
    idExtranjero: params.idExtranjero,
    fechaEmision: params.fechaEmision,
    correoComprador: params.correoComprador,
    estadoEncf: params.estadoEncf,
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
  }
}

export function ensureFiscalDocumentsDescending(items: FiscalDocument[]) {
  if (items.every((document, index) => index === 0 || compareFiscalDocumentsDescending(items[index - 1]!, document) <= 0)) {
    return items
  }

  return [...items].sort(compareFiscalDocumentsDescending)
}

export function filterFiscalDocumentsByIssueDateRange(items: FiscalDocument[], fromDate: string, toDate: string) {
  if (!fromDate && !toDate) return items

  return items.filter(document => {
    const date = fiscalDocumentDateToIso(document.fechaEmision)
    return date !== null && (!fromDate || date >= fromDate) && (!toDate || date <= toDate)
  })
}

function fiscalDocumentDateToIso(value: string | null) {
  if (!value) return null
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const fiscal = /^(\d{2})-(\d{2})-(\d{4})/.exec(value)
  return fiscal ? `${fiscal[3]}-${fiscal[2]}-${fiscal[1]}` : null
}

export function validateFiscalDocumentSearchResponse(value: unknown): PagedResponse<FiscalDocument> {
  if (!isRecord(value)) throw new Error('La API devolvió una bandeja fiscal inválida.')

  for (const key of ['totalItems', 'totalPages'] as const) {
    if (!Number.isInteger(value[key]) || Number(value[key]) < 0) {
      throw new Error(`La bandeja fiscal no contiene un ${key} válido.`)
    }
  }

  for (const key of ['pageNumber', 'pageSize'] as const) {
    if (!Number.isInteger(value[key]) || Number(value[key]) < 1) {
      throw new Error(`La bandeja fiscal no contiene un ${key} válido.`)
    }
  }

  if (!Array.isArray(value.items) || !value.items.every(isFiscalDocument)) {
    throw new Error('La bandeja fiscal no contiene una lista de documentos válida.')
  }

  return value as unknown as PagedResponse<FiscalDocument>
}

function isFiscalDocument(value: unknown): value is FiscalDocument {
  return isRecord(value)
    && Number.isInteger(value.id)
    && typeof value.tenantId === 'string'
    && typeof value.encfTipo === 'string'
    && (value.encf === null || typeof value.encf === 'string')
}

function compareFiscalDocumentsDescending(left: FiscalDocument, right: FiscalDocument) {
  for (const field of ['createdAt', 'fechaEmision', 'fechaRecepcion', 'fechaFirma'] as const) {
    const leftTimestamp = parseFiscalDocumentDate(left[field]) ?? Number.NEGATIVE_INFINITY
    const rightTimestamp = parseFiscalDocumentDate(right[field]) ?? Number.NEGATIVE_INFINITY
    const difference = rightTimestamp - leftTimestamp
    if (difference) return difference
  }

  return right.id - left.id
}

function parseFiscalDocumentDate(value: string | null | undefined) {
  if (!value) return null

  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const timestamp = Date.parse(value)
    if (Number.isFinite(timestamp)) return timestamp
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (isoMatch) return Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))

  const fiscalMatch = /^(\d{2})-(\d{2})-(\d{4})/.exec(value)
  if (fiscalMatch) return Date.UTC(Number(fiscalMatch[3]), Number(fiscalMatch[2]) - 1, Number(fiscalMatch[1]))

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
