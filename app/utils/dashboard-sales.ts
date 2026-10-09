import type { FiscalDocument } from '~/types/ecf'

export interface MonthlySalesSummary {
  count: number
  total: number
}

export function summarizeMonthlySales(
  documents: FiscalDocument[],
  referenceDate = new Date(),
): MonthlySalesSummary {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() + 1

  return documents.reduce<MonthlySalesSummary>((summary, document) => {
    if (!isSaleFromMonth(document, year, month)) return summary

    summary.count += 1
    summary.total += normalizeFiscalAmount(document.montoTotal)
    return summary
  }, { count: 0, total: 0 })
}

export function getFiscalDateParts(value: string | null | undefined) {
  if (!value) return null

  const yearFirst = /^(\d{4})[-/](\d{2})[-/](\d{2})/.exec(value)
  if (yearFirst) return validDateParts(Number(yearFirst[1]), Number(yearFirst[2]), Number(yearFirst[3]))

  const dayFirst = /^(\d{2})[-/](\d{2})[-/](\d{4})/.exec(value)
  if (dayFirst) return validDateParts(Number(dayFirst[3]), Number(dayFirst[2]), Number(dayFirst[1]))

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return null

  return {
    year: parsedDate.getFullYear(),
    month: parsedDate.getMonth() + 1,
  }
}

export function normalizeFiscalAmount(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0

  let normalized = value.trim().replace(/(?:RD\$|DOP|\$|\s)/gi, '')
  if (!normalized) return 0

  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.lastIndexOf(',') > normalized.lastIndexOf('.')
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '')
  } else if (normalized.includes(',')) {
    normalized = /^-?\d{1,3}(,\d{3})+$/.test(normalized)
      ? normalized.replace(/,/g, '')
      : normalized.replace(',', '.')
  }

  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : 0
}

function isSaleFromMonth(document: FiscalDocument, year: number, month: number) {
  if (document.activo === false || isRejected(document.estadoEncf) || isCreditNote(document.encfTipo)) {
    return false
  }

  const dateParts = getFiscalDateParts(document.fechaEmision) ?? getFiscalDateParts(document.createdAt)
  return dateParts?.year === year && dateParts.month === month
}

function isRejected(status: string | null) {
  const normalizedStatus = status?.toLocaleLowerCase('es') || ''
  return normalizedStatus.includes('rechazado') || normalizedStatus.includes('no aceptado')
}

function isCreditNote(documentType: string) {
  return documentType.replace(/^e/i, '') === '34'
}

function validDateParts(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return { year, month }
}
