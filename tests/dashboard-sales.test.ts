import { describe, expect, it } from 'vitest'
import type { FiscalDocument } from '~/types/ecf'
import {
  getFiscalDateParts,
  normalizeFiscalAmount,
  summarizeMonthlySales,
} from '~/utils/dashboard-sales'

function document(overrides: Partial<FiscalDocument> = {}) {
  return {
    id: 1,
    tenantId: 'tenant-1',
    encfTipo: '31',
    encf: 'E310000000001',
    montoTotal: 1180,
    fechaEmision: '08-10-2026',
    createdAt: '2026-10-08T12:00:00Z',
    estadoEncf: 'Aceptado',
    activo: true,
    ...overrides,
  } as FiscalDocument
}

describe('resumen de ventas del dashboard', () => {
  it('reconoce la fecha fiscal DD-MM-YYYY usada por la API', () => {
    expect(getFiscalDateParts('08-10-2026')).toEqual({ year: 2026, month: 10 })
  })

  it('suma las facturas emitidas durante el mes actual', () => {
    const summary = summarizeMonthlySales([
      document({ id: 1, montoTotal: 1180 }),
      document({ id: 2, fechaEmision: '20-10-2026', montoTotal: 236 }),
      document({ id: 3, fechaEmision: '30-09-2026', montoTotal: 500 }),
    ], new Date(2026, 9, 8))

    expect(summary).toEqual({ count: 2, total: 1416 })
  })

  it('usa createdAt cuando la fecha de emisión no es válida', () => {
    const summary = summarizeMonthlySales([
      document({ fechaEmision: 'sin-fecha', createdAt: '2026-10-02T10:00:00Z' }),
    ], new Date(2026, 9, 8))

    expect(summary).toEqual({ count: 1, total: 1180 })
  })

  it('excluye documentos inactivos, rechazados y notas de crédito', () => {
    const summary = summarizeMonthlySales([
      document({ id: 1, activo: false }),
      document({ id: 2, estadoEncf: 'Rechazado' }),
      document({ id: 3, encfTipo: 'E34' }),
    ], new Date(2026, 9, 8))

    expect(summary).toEqual({ count: 0, total: 0 })
  })

  it('normaliza montos numéricos recibidos como texto', () => {
    expect(normalizeFiscalAmount('RD$ 1,180.50')).toBe(1180.5)
    expect(normalizeFiscalAmount('1.180,50')).toBe(1180.5)
    expect(normalizeFiscalAmount(null)).toBe(0)
  })
})
