import { describe, expect, it } from 'vitest'
import type { Article, BillingIndicator } from '~/types/article'
import type { Client } from '~/types/client'
import {
  buildCreditNoteRequest,
  calculateCreditNote,
  calendarDaysBetween,
  type CreditNoteDraft,
} from '~/utils/credit-note'

const article: Article = {
  id: 'article-1', tenantId: 'tenant-1', codigo: 'ITEM-1', tipoCodigo: 'Interno',
  indicadorFacturacion: 1, nombreItem: 'Producto acreditado', indicadorBienoServicio: 1,
  descripcionItem: null, unidadMedida: 46, precioUnitarioItem: 1000, existencia: 10,
  codigoImpuesto: null, cantidadReferencia: null, unidadReferencia: null,
  gradosAlcohol: null, precioUnitarioReferencia: null, activo: true,
}

const client: Client = {
  id: 'client-1', tenantId: 'tenant-1', rncComprador: '131234567', identificadorExtranjero: null,
  razonSocialComprador: 'CLIENTE EJEMPLO SRL', contactoComprador: null, correoComprador: null,
  direccionComprador: null, municipioComprador: '010100', provinciaComprador: '010000',
  paisComprador: null, fechaEntrega: null, contactoEntrega: null, direccionEntrega: null,
  telefonoAdicional: null, codigoInternoComprador: null, responsablePago: null,
  informacionAdicionalComprador: null, tipoPrecio: null, tipoPago: null, terminoPago: null, activo: true,
}

const indicators: BillingIndicator[] = [
  { id: 'indicator-1', codigo: 1, descripcion: 'Gravado 18%', tasaItbis: 18, activo: true },
  { id: 'indicator-4', codigo: 4, descripcion: 'Exento', tasaItbis: 0, activo: true },
]

const issuer = { rnc: '101234567', businessName: 'EMPRESA EJEMPLO SRL', address: 'AV. EJEMPLO 123' }

function createDraft(overrides: Partial<CreditNoteDraft> = {}): CreditNoteDraft {
  return {
    source: {
      id: 10,
      encf: 'E310000000001',
      documentType: '31',
      issueDate: '2026-08-01',
      buyerRnc: '131234567',
      total: 1180,
    },
    issueDate: '2026-08-31',
    incomeType: '01',
    paymentType: 1,
    modificationCode: 1,
    reason: 'Anulación total de la operación',
    client,
    items: [{ article, quantity: 1, unitPrice: 1000 }],
    ...overrides,
  }
}

describe('constructor E34', () => {
  it('considera el día 30 dentro del plazo para acreditar ITBIS', () => {
    const calculation = calculateCreditNote(createDraft(), indicators)
    expect(calendarDaysBetween('2026-08-01', '2026-08-31')).toBe(30)
    expect(calculation).toMatchObject({ indicator: 0, taxCreditAllowed: true, taxTotal: 180, total: 1180 })
  })

  it('marca el día 31 fuera de plazo y no acredita ITBIS', () => {
    const calculation = calculateCreditNote(createDraft({
      issueDate: '2026-09-01',
      modificationCode: 3,
    }), indicators)
    expect(calculation).toMatchObject({ indicator: 1, taxCreditAllowed: false, taxTotal: 0, total: 1000 })
    expect(calculation.totals.totalITBIS).toBeNull()
  })

  it('genera la referencia obligatoria y omite formas de pago en E34', () => {
    const request = buildCreditNoteRequest(createDraft(), issuer, indicators)
    expect(request.ecf.encabezado.idDoc).toMatchObject({
      tipoeCF: '34',
      indicadorNotaCredito: 0,
      tipoIngresos: '01',
      tipoPago: 1,
      tablaFormasPago: null,
      fechaVencimientoSecuencia: null,
    })
    expect(request.ecf.informacionReferencia).toEqual({
      ncfModificado: 'E310000000001',
      rncOtroContribuyente: null,
      fechaNCFModificado: '01-08-2026',
      codigoModificacion: 1,
      razonModificacion: 'Anulación total de la operación',
    })
    expect(request.ecf.detallesItems.item[0]).toMatchObject({ cantidadItem: '1', unidadMedida: 46 })
  })

  it('rechaza un comprador diferente al de la factura original', () => {
    expect(() => buildCreditNoteRequest(createDraft({
      client: { ...client, rncComprador: '101111111' },
    }), issuer, indicators)).toThrow(/mismo comprador/i)
  })

  it('conserva el RNC original aunque el cliente ya no exista en el mantenimiento', () => {
    const request = buildCreditNoteRequest(createDraft({ client: undefined }), issuer, indicators)
    expect(request.ecf.encabezado.comprador).toMatchObject({
      rncComprador: '131234567',
      razonSocialComprador: null,
      correoComprador: null,
    })
  })

  it('permite una E32 original sin comprador identificado', () => {
    const request = buildCreditNoteRequest(createDraft({
      client: undefined,
      source: { ...createDraft().source, documentType: '32', buyerRnc: null },
    }), issuer, indicators)
    expect(request.ecf.encabezado.comprador).toBeNull()
  })

  it('permite una corrección de texto únicamente con monto cero', () => {
    const textArticle = { ...article, indicadorFacturacion: 4, precioUnitarioItem: 0 }
    const request = buildCreditNoteRequest(createDraft({
      modificationCode: 2,
      reason: 'Corrección de la descripción',
      items: [{ article: textArticle, quantity: 1, unitPrice: 0 }],
      source: { ...createDraft().source, total: 1180 },
    }), issuer, indicators)
    expect(request.ecf.encabezado.totales.montoTotal).toBe(0)
  })
})
