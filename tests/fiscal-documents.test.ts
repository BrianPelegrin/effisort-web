import { describe, expect, it } from 'vitest'
import type { FiscalDocument } from '~/types/ecf'
import {
  createFiscalDocumentSearchQuery,
  ensureFiscalDocumentsDescending,
  validateFiscalDocumentSearchResponse,
} from '~/utils/fiscal-documents'

describe('bandeja fiscal', () => {
  it('construye la búsqueda sin enviar tenantId', () => {
    const query = createFiscalDocumentSearchQuery({
      encf: 'E3100',
      pageNumber: 1,
      ...({ tenantId: 'otro-tenant' } as Record<string, string | number>),
    })

    expect(query.encf).toBe('E3100')
    expect(query).not.toHaveProperty('tenantId')
  })

  it('valida una respuesta paginada del search', () => {
    const response = validateFiscalDocumentSearchResponse({
      totalItems: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      items: [{ id: 1, tenantId: 'tenant-1', encfTipo: '31', encf: 'E310000000001' }],
    })

    expect(response.items[0]?.encf).toBe('E310000000001')
  })

  it('rechaza una respuesta que no respeta la paginación documentada', () => {
    expect(() => validateFiscalDocumentSearchResponse({
      totalItems: 0,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 0,
      items: 'invalid',
    })).toThrow(/lista de documentos válida/i)
  })

  it('ordena en memoria desde el último registro creado hasta el primero', () => {
    const items = [
      { id: 1, tenantId: 'tenant-1', encfTipo: '31', encf: 'E3101', fechaEmision: '03-08-2026', createdAt: '2026-08-03T09:00:00Z' },
      { id: 2, tenantId: 'tenant-1', encfTipo: '31', encf: 'E3102', fechaEmision: '01-08-2026', createdAt: '2026-08-03T11:00:00Z' },
    ] as FiscalDocument[]

    expect(ensureFiscalDocumentsDescending(items).map(item => item.id)).toEqual([2, 1])
  })

  it('usa la fecha de emisión y luego el ID cuando no existe fecha de creación', () => {
    const items = [
      { id: 1, tenantId: 'tenant-1', encfTipo: '31', encf: 'E3101', fechaEmision: '01-08-2026' },
      { id: 2, tenantId: 'tenant-1', encfTipo: '31', encf: 'E3102', fechaEmision: '03-08-2026' },
    ] as FiscalDocument[]

    expect(ensureFiscalDocumentsDescending(items).map(item => item.id)).toEqual([2, 1])
  })

  it('conserva el mismo arreglo cuando ya viene ordenado de forma descendente', () => {
    const items = [
      { id: 2, tenantId: 'tenant-1', encfTipo: '31', encf: 'E3102', fechaEmision: '2026-08-03' },
      { id: 1, tenantId: 'tenant-1', encfTipo: '31', encf: 'E3101', fechaEmision: '2026-08-01' },
    ] as FiscalDocument[]

    expect(ensureFiscalDocumentsDescending(items)).toBe(items)
  })
})
