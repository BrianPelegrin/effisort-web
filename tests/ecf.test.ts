import { describe, expect, it } from 'vitest'
import {
  classifyEcfResult,
  buildEcfRequest,
  calculateInvoice,
  createPdfBlob,
  createSubmissionLock,
  DuplicateSubmissionError,
  mapCompanyProfileToIssuer,
  mapFacturacionResponse,
  prepareInvoiceOnlyBuyer,
  validateFacturacionApiResponse,
} from '~/utils/ecf'
import type { Article, BillingIndicator } from '~/types/article'
import type { Client } from '~/types/client'

const rawResponse = {
  Encf: 'E310000000001',
  FechaEmision: '07-08-2026',
  FechaVencimientoSecuencia: '31-12-2028',
  FechaFirma: '07-08-2026 14:35:20',
  CodigoSeguridad: 'ABC123',
  EstadoEncf: 'Aceptado (1)',
  SecuenciaUtilizada: true,
  UrlVerificacionDGII: 'https://dgii.example.test',
  UrlDocumentoPdf: 'E310000000001.pdf',
  Mensajes: { Mensaje: ['Procesado'] },
  DocumentoB64: null,
}

function findUndefinedPaths(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findUndefinedPaths(item, `${path}[${index}]`))
  }
  if (!value || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([key, item]) => item === undefined
    ? [`${path}.${key}`]
    : findUndefinedPaths(item, `${path}.${key}`))
}

describe('respuesta fiscal', () => {
  it('valida y normaliza PascalCase a EcfApiResult', () => {
    const result = mapFacturacionResponse(validateFacturacionApiResponse(rawResponse))
    expect(result).toMatchObject({
      encf: 'E310000000001',
      estadoEncf: 'Aceptado (1)',
      secuenciaUtilizada: true,
      mensajes: ['Procesado'],
      documentoB64: null,
    })
  })

  it('rechaza una respuesta crítica con contrato incorrecto', () => {
    expect(() => validateFacturacionApiResponse({ ...rawResponse, SecuenciaUtilizada: 'true' })).toThrow(/SecuenciaUtilizada/)
  })

  it.each([
    ['Aceptado (1)', 'accepted'],
    ['Aceptado Condicional', 'conditionally-accepted'],
    ['Rechazado', 'rejected'],
  ] as const)('clasifica %s', (estadoEncf, expected) => {
    const result = mapFacturacionResponse(validateFacturacionApiResponse({ ...rawResponse, EstadoEncf: estadoEncf }))
    expect(classifyEcfResult(result)).toBe(expected)
  })
})

describe('protección de emisión', () => {
  it('bloquea un segundo submit mientras el primero está pendiente', async () => {
    const lock = createSubmissionLock()
    let resolveFirst!: () => void
    const first = lock.run(() => new Promise<void>((resolve) => { resolveFirst = resolve }))

    await expect(lock.run(async () => undefined)).rejects.toBeInstanceOf(DuplicateSubmissionError)
    resolveFirst()
    await first
    await expect(lock.run(async () => 'ok')).resolves.toBe('ok')
  })
})

describe('constructor y cálculos e-CF', () => {
  const article: Article = {
    id: 'article-1', tenantId: 'tenant-1', codigo: 'SERV-0001', tipoCodigo: 'Interno',
    indicadorFacturacion: 1, nombreItem: 'SERVICIO DE CONSULTORÍA', indicadorBienoServicio: 2,
    descripcionItem: 'Servicio profesional', unidadMedida: 43, precioUnitarioItem: 1000,
    existencia: 0, codigoImpuesto: null, cantidadReferencia: null, unidadReferencia: null,
    gradosAlcohol: null, precioUnitarioReferencia: null, activo: true,
  }
  const client: Client = {
    id: 'client-1', tenantId: 'tenant-1', rncComprador: '131234567', identificadorExtranjero: null,
    razonSocialComprador: 'CLIENTE EJEMPLO SRL', contactoComprador: null, correoComprador: null,
    direccionComprador: null, municipioComprador: null, provinciaComprador: null, paisComprador: null,
    fechaEntrega: null, contactoEntrega: null, direccionEntrega: null, telefonoAdicional: null,
    codigoInternoComprador: null, responsablePago: null, informacionAdicionalComprador: null,
    tipoPrecio: null, tipoPago: null, terminoPago: null, activo: true,
  }
  const indicators: BillingIndicator[] = [{
    id: 'indicator-1', codigo: 1, descripcion: 'Gravado 18%', tasaItbis: 18, activo: true,
  }]
  const draft = {
    documentType: '31', issueDate: '2026-08-07', dueDate: '2026-08-22', incomeType: '1',
    paymentType: 1, paymentMethod: '1', paymentTerm: '', currency: 'DOP', discount: 0,
    client, items: [{ article, quantity: 1, unitPrice: 1000 }],
  }

  it('agrupa base, ITBIS y total usando la tasa del catálogo', () => {
    expect(calculateInvoice(draft, indicators)).toMatchObject({
      subtotal: 1000,
      taxableTotal: 1000,
      taxTotal: 180,
      total: 1180,
      totals: { montoGravadoI1: 1000, totalITBIS1: 180, montoTotal: 1180, valorPagar: 1180 },
    })
  })

  it('genera el request camelCase compatible con el ejemplo E31', () => {
    const request = buildEcfRequest(draft, {
      rnc: '101234567', businessName: 'EMPRESA EJEMPLO SRL', address: 'AV. EJEMPLO 123',
    }, indicators)

    expect(request.ecf.encabezado).toMatchObject({
      version: '1.0',
      idDoc: {
        tipoeCF: '31', tipoIngresos: '01', tipoPago: 1,
        tablaFormasPago: { formaDePago: [{ formaPago: 1, montoPago: 1180 }] },
      },
      emisor: { rncEmisor: '101234567', fechaEmision: '07-08-2026' },
      comprador: { rncComprador: '131234567' },
      totales: { montoTotal: 1180 },
    })
    expect(request.ecf.detallesItems.item[0]).toMatchObject({
      numeroLinea: 1, indicadorFacturacion: 1, cantidadItem: '1', precioUnitarioItem: 1000, montoItem: 1000,
    })
    expect(typeof request.ecf.detallesItems.item[0]?.cantidadItem).toBe('string')
  })

  it('usa la descripción editada de la línea sin modificar el artículo de inventario', () => {
    const request = buildEcfRequest({
      ...draft,
      items: [{ ...draft.items[0]!, description: 'SERVICIO DE CONSULTORÍA - PROYECTO ESPECIAL' }],
    }, {
      rnc: '101234567', businessName: 'EMPRESA EJEMPLO SRL', address: 'AV. EJEMPLO 123',
    }, indicators)

    expect(request.ecf.detallesItems.item[0]?.nombreItem).toBe('SERVICIO DE CONSULTORÍA - PROYECTO ESPECIAL')
    expect(article.nombreItem).toBe('SERVICIO DE CONSULTORÍA')
  })

  it('mapea la empresa autenticada y combina sus teléfonos', () => {
    const issuer = mapCompanyProfileToIssuer({
      tenantId: 'tenant-1', nombreRazonSocial: ' EMPRESA EJEMPLO SRL ', nombreComercial: ' EJEMPLO ',
      sucursal: null, rnc: ' 101234567 ', direccion: ' AV. EJEMPLO 123 ', telefono: '8095550100',
      telefono2: '8095550101', municipioId: '010100', provinciaId: '010000',
      correo: 'facturacion@empresa.test', webSite: null, actividadEconomica: 'SERVICIOS',
    })

    expect(issuer).toMatchObject({
      rnc: '101234567', businessName: 'EMPRESA EJEMPLO SRL', tradeName: 'EJEMPLO',
      phones: ['809-555-0100', '809-555-0101'],
    })
  })

  it('envía la tabla de teléfonos en null cuando la empresa no tiene teléfonos', () => {
    const issuer = mapCompanyProfileToIssuer({
      tenantId: 'tenant-1', nombreRazonSocial: 'EMPRESA EJEMPLO SRL', nombreComercial: null,
      sucursal: null, rnc: '101234567', direccion: 'AV. EJEMPLO 123', telefono: null,
      telefono2: null, municipioId: null, provinciaId: null, correo: null, webSite: null,
      actividadEconomica: null,
    })
    const request = buildEcfRequest(draft, issuer, indicators)

    expect(request.ecf.encabezado.emisor.tablaTelefonoEmisor).toBeNull()
  })

  it('usa una dirección predeterminada cuando la empresa no tiene una registrada', () => {
    const issuer = mapCompanyProfileToIssuer({
      tenantId: 'tenant-1', nombreRazonSocial: 'EMPRESA EJEMPLO SRL', nombreComercial: null,
      sucursal: null, rnc: '101234567', direccion: null, telefono: null, telefono2: null,
      municipioId: '010100', provinciaId: '010000', correo: null, webSite: null,
      actividadEconomica: null,
    })
    const request = buildEcfRequest(draft, issuer, indicators)

    expect(request.ecf.encabezado.emisor.direccionEmisor).toBe('Santo Domingo, Distrito Nacional, Republica Dominicana')
  })

  it('bloquea la emisión cuando faltan datos fiscales obligatorios de la empresa', () => {
    const issuer = mapCompanyProfileToIssuer({
      tenantId: 'tenant-1', nombreRazonSocial: null, nombreComercial: null, sucursal: null,
      rnc: '101234567', direccion: null, telefono: null, telefono2: null, municipioId: null,
      provinciaId: null, correo: null, webSite: null, actividadEconomica: null,
    })

    expect(() => buildEcfRequest(draft, issuer, indicators)).toThrow(/empresa de la sesión/i)
  })

  it('envía en null los campos opcionales de referencia que tienen valor cero', () => {
    const request = buildEcfRequest({
      ...draft,
      items: [{
        article: {
          ...article,
          unidadReferencia: 0,
          gradosAlcohol: 0,
          precioUnitarioReferencia: 0,
        },
        quantity: 1,
        unitPrice: 1000,
      }],
    }, {
      rnc: '101234567', businessName: 'EMPRESA EJEMPLO SRL', address: 'AV. EJEMPLO 123',
    }, indicators)

    expect(request.ecf.detallesItems.item[0]).toMatchObject({
      unidadReferencia: null,
      gradosAlcohol: null,
      precioUnitarioReferencia: null,
    })
  })

  it('incluye todas las propiedades del contrato y representa las ausentes con null', () => {
    const request = buildEcfRequest(draft, {
      rnc: '101234567', businessName: 'EMPRESA EJEMPLO SRL', address: 'AV. EJEMPLO 123',
    }, indicators)

    expect(request.ecf).toMatchObject({
      subtotales: null,
      descuentosORecargos: null,
      paginacion: null,
      informacionReferencia: null,
      fechaHoraFirma: null,
      encabezado: {
        informacionesAdicionales: null,
        transporte: null,
        otraMoneda: null,
        idDoc: {
          eNCF: null,
          fechaVencimientoSecuencia: null,
          indicadorNotaCredito: null,
          indicadorEnvioDiferido: null,
          indicadorServicioTodoIncluido: null,
          tipoCuentaPago: null,
          numeroCuentaPago: null,
          bancoPago: null,
          fechaDesde: null,
          fechaHasta: null,
          totalPaginas: null,
        },
        emisor: {
          direccionEmisor: 'AV. EJEMPLO 123',
          nombreComercial: null,
          sucursal: null,
          tablaTelefonoEmisor: null,
          codigoVendedor: null,
          numeroPedidoInterno: null,
          zonaVenta: null,
          rutaVenta: null,
        },
        comprador: {
          identificadorExtranjero: null,
          contactoComprador: null,
          fechaOrdenCompra: null,
          responsablePago: null,
        },
        totales: {
          montoGravadoI2: null,
          montoGravadoI3: null,
          montoExento: null,
          montoImpuestoAdicional: null,
          impuestosAdicionales: null,
          montoPeriodo: null,
          saldoAnterior: null,
          montoAvancePago: null,
          totalITBISRetenido: null,
          totalISRRetencion: null,
          totalITBISPercepcion: null,
          totalISRPercepcion: null,
        },
      },
    })

    expect(request.ecf.detallesItems.item[0]).toMatchObject({
      retencion: null,
      tablaSubcantidad: null,
      fechaElaboracion: null,
      fechaVencimientoItem: null,
      descuentoMonto: null,
      tablaSubDescuento: null,
      recargoMonto: null,
      tablaSubRecargo: null,
      tablaImpuestoAdicional: null,
      otraMonedaDetalle: null,
    })
    expect(findUndefinedPaths(request)).toEqual([])
  })

  it('normaliza la identificación y el contacto del comprador y usa su correo en la factura', () => {
    const request = buildEcfRequest({
      ...draft,
      client: {
        ...client,
        rncComprador: '131-234-567',
        contactoComprador: '(809) 555-0100',
        correoComprador: 'correo-real@ejemplo.com',
        municipioComprador: '010100',
        provinciaComprador: '010000',
      },
    }, {
      rnc: '101234567', businessName: 'EMPRESA EJEMPLO SRL', address: 'AV. EJEMPLO 123',
    }, indicators)

    expect(request.ecf.encabezado.comprador).toMatchObject({
      rncComprador: '131234567',
      contactoComprador: '8095550100',
      correoComprador: 'correo-real@ejemplo.com',
      municipioComprador: '010100',
      provinciaComprador: '010000',
    })
  })

  it('permite un correo exclusivo de la factura sin modificar el cliente', () => {
    const originalEmail = client.correoComprador
    const request = buildEcfRequest({
      ...draft,
      buyerEmail: '  factura@ejemplo.com  ',
    }, {
      rnc: '101234567', businessName: 'EMPRESA EJEMPLO SRL', address: 'AV. EJEMPLO 123',
    }, indicators)

    expect(request.ecf.encabezado.comprador?.correoComprador).toBe('factura@ejemplo.com')
    expect(client.correoComprador).toBe(originalEmail)
  })

  it('permite dejar el correo de esta factura vacío y rechaza uno inválido', () => {
    const issuer = { rnc: '101234567', businessName: 'EMPRESA EJEMPLO SRL', address: 'AV. EJEMPLO 123' }
    const request = buildEcfRequest({ ...draft, buyerEmail: '' }, issuer, indicators)
    expect(request.ecf.encabezado.comprador?.correoComprador).toBeNull()
    expect(() => buildEcfRequest({ ...draft, buyerEmail: 'incorrecto' }, issuer, indicators)).toThrow(/correo válido/i)
  })

  it('emite con un comprador solo de esta factura, sin ID ni registro de cliente', () => {
    const buyer = prepareInvoiceOnlyBuyer({
      razonSocialComprador: '  CLIENTE OCASIONAL  ',
      rncComprador: '131-234-567',
      identificadorExtranjero: '',
      contactoComprador: ' Ana ',
      correoComprador: ' ocasional@ejemplo.com ',
      direccionComprador: ' Calle Principal 1 ',
      paisComprador: ' DO ',
    }, '31')
    const request = buildEcfRequest({ ...draft, client: buyer }, {
      rnc: '101234567', businessName: 'EMPRESA EJEMPLO SRL', address: 'AV. EJEMPLO 123',
    }, indicators)

    expect(buyer).not.toHaveProperty('id')
    expect(buyer).not.toHaveProperty('tenantId')
    expect(request.ecf.encabezado.comprador).toMatchObject({
      razonSocialComprador: 'CLIENTE OCASIONAL',
      rncComprador: '131234567',
      contactoComprador: 'Ana',
      correoComprador: 'ocasional@ejemplo.com',
      direccionComprador: 'Calle Principal 1',
      paisComprador: 'DO',
    })
  })

  it('valida los datos fiscales del comprador ocasional según el comprobante', () => {
    const input = {
      razonSocialComprador: 'Cliente ocasional', rncComprador: '', identificadorExtranjero: '',
      contactoComprador: '', correoComprador: '', direccionComprador: '', paisComprador: '',
    }
    expect(() => prepareInvoiceOnlyBuyer(input, '31')).toThrow(/E31 requiere el RNC/i)
    expect(prepareInvoiceOnlyBuyer(input, '32').rncComprador).toBeNull()
    expect(() => prepareInvoiceOnlyBuyer({ ...input, correoComprador: 'inválido' }, '32')).toThrow(/correo válido/i)
  })

  it('rechaza nombres en lugar de códigos de provincia y municipio', () => {
    expect(() => buildEcfRequest({
      ...draft,
      client: {
        ...client,
        municipioComprador: 'Santo Domingo',
        provinciaComprador: 'Distrito Nacional',
      },
    }, {
      rnc: '101234567', businessName: 'EMPRESA EJEMPLO SRL', address: 'AV. EJEMPLO 123',
    }, indicators)).toThrow(/código de seis dígitos/i)
  })
})

describe('descarga PDF', () => {
  it('convierte el Base64 de la API en un Blob PDF', async () => {
    const blob = createPdfBlob('JVBERi0xLjQ=')
    expect(blob.type).toBe('application/pdf')
    expect(new TextDecoder().decode(await blob.arrayBuffer())).toBe('%PDF-1.4')
  })

  it('rechaza un PDF Base64 inválido', () => {
    expect(() => createPdfBlob('%%%')).toThrow(/Base64 inválido/i)
  })
})
