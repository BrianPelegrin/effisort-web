export interface EcfRequest {
  ecf: EcfDocument
}

export interface EcfDocument {
  encabezado: EcfHeader
  detallesItems: EcfItemDetails
  subtotales: Record<string, unknown> | null
  descuentosORecargos: EcfAdjustments | null
  paginacion: Record<string, unknown> | null
  informacionReferencia: Record<string, unknown> | null
  fechaHoraFirma: string | null
}

export interface EcfHeader {
  version: string
  idDoc: EcfDocumentId
  emisor: EcfIssuer
  comprador: EcfBuyer | null
  informacionesAdicionales: Record<string, unknown> | null
  transporte: Record<string, unknown> | null
  totales: EcfTotals
  otraMoneda: Record<string, unknown> | null
}

export interface EcfDocumentId {
  tipoeCF: string
  eNCF: string | null
  fechaVencimientoSecuencia: string | null
  indicadorNotaCredito: number | null
  indicadorEnvioDiferido: number | null
  indicadorMontoGravado: number | null
  tipoIngresos: string | null
  tipoPago: number | null
  fechaLimitePago: string | null
  terminoPago: string | null
  tablaFormasPago: { formaDePago: EcfPayment[] } | null
  tipoCuentaPago: string | null
  numeroCuentaPago: string | null
  bancoPago: string | null
  fechaDesde: string | null
  fechaHasta: string | null
  totalPaginas: number | null
}

export interface EcfPayment {
  formaPago: number
  montoPago: number
}

export interface EcfIssuer {
  rncEmisor: string
  razonSocialEmisor: string
  nombreComercial: string | null
  sucursal: string | null
  direccionEmisor: string
  municipio: string | null
  provincia: string | null
  tablaTelefonoEmisor: { telefonoEmisor: string[] } | null
  correoEmisor: string | null
  webSite: string | null
  actividadEconomica: string | null
  codigoVendedor: string | null
  numeroFacturaInterna: string | null
  numeroPedidoInterno: string | null
  zonaVenta: string | null
  rutaVenta: string | null
  informacionAdicionalEmisor: string | null
  fechaEmision: string
}

export interface EcfBuyer {
  rncComprador: string | null
  identificadorExtranjero: string | null
  razonSocialComprador: string | null
  contactoComprador: string | null
  correoComprador: string | null
  direccionComprador: string | null
  municipioComprador: string | null
  provinciaComprador: string | null
  paisComprador: string | null
  fechaEntrega: string | null
  contactoEntrega: string | null
  direccionEntrega: string | null
  telefonoAdicional: string | null
  fechaOrdenCompra: string | null
  numeroOrdenCompra: string | null
  codigoInternoComprador: string | null
  responsablePago: string | null
  informacionAdicionalComprador: string | null
}

export interface EcfTotals {
  montoGravadoTotal: number | null
  montoGravadoI1: number | null
  montoGravadoI2: number | null
  montoGravadoI3: number | null
  montoExento: number | null
  itbiS1: number | null
  itbiS2: number | null
  itbiS3: number | null
  totalITBIS: number | null
  totalITBIS1: number | null
  totalITBIS2: number | null
  totalITBIS3: number | null
  montoImpuestoAdicional: number | null
  impuestosAdicionales: Record<string, unknown> | null
  montoTotal: number
  montoNoFacturable: number | null
  montoPeriodo: number | null
  saldoAnterior: number | null
  montoAvancePago: number | null
  valorPagar: number | null
  totalITBISRetenido: number | null
  totalISRRetencion: number | null
  totalITBISPercepcion: number | null
  totalISRPercepcion: number | null
}

export interface EcfItemDetails {
  item: EcfItem[]
}

export interface EcfItem {
  numeroLinea: number
  tablaCodigosItem: {
    codigosItem: Array<{ tipoCodigo: string; codigoItem: string }>
  } | null
  indicadorFacturacion: number
  retencion: Record<string, unknown> | null
  nombreItem: string
  indicadorBienoServicio: number
  descripcionItem: string | null
  cantidadItem: string
  unidadMedida: number
  cantidadReferencia: number | null
  unidadReferencia: number | null
  tablaSubcantidad: Record<string, unknown> | null
  gradosAlcohol: number | null
  precioUnitarioReferencia: number | null
  fechaElaboracion: string | null
  fechaVencimientoItem: string | null
  precioUnitarioItem: number
  descuentoMonto: number | null
  tablaSubDescuento: Record<string, unknown> | null
  recargoMonto: number | null
  tablaSubRecargo: Record<string, unknown> | null
  tablaImpuestoAdicional: Record<string, unknown> | null
  otraMonedaDetalle: Record<string, unknown> | null
  montoItem: number
}

export interface EcfAdjustments {
  descuentoORecargo: Array<{
    numeroLinea: number
    tipoAjuste: string
    indicadorNorma1007: number | null
    descripcionDescuentooRecargo: string | null
    tipoValor: string | null
    valorDescuentooRecargo: number | null
    montoDescuentooRecargo: number | null
    montoDescuentooRecargoOtraMoneda: number | null
    indicadorFacturacionDescuentooRecargo: number | null
  }>
}

export interface FacturacionApiResponse {
  Encf: string | null
  FechaEmision: string | null
  FechaVencimientoSecuencia: string | null
  FechaFirma: string | null
  CodigoSeguridad: string | null
  EstadoEncf: string | null
  SecuenciaUtilizada: boolean
  UrlVerificacionDGII: string | null
  UrlDocumentoPdf: string | null
  Mensajes: { Mensaje: string[] | null } | null
  DocumentoB64: string | null
}

export interface EcfApiResult {
  encf: string | null
  fechaEmision: string | null
  fechaVencimientoSecuencia: string | null
  fechaFirma: string | null
  codigoSeguridad: string | null
  estadoEncf: string | null
  secuenciaUtilizada: boolean
  urlVerificacionDGII: string | null
  urlDocumentoPdf: string | null
  mensajes: string[]
  documentoB64: string | null
}

export type EcfResultStatus = 'accepted' | 'conditionally-accepted' | 'rejected' | 'processed'

export interface FiscalDocument {
  id: number
  tenantId: string
  encfTipo: string
  encf: string | null
  rncEmisor: string | null
  rncComprador: string | null
  idExtranjero: string | null
  firmaDigital: string | null
  fechaFirma: string | null
  codigoSeguridad: string | null
  montoTotal: number | null
  fechaEmision: string | null
  encabezado_Id: number | null
  trackId: string | null
  estadoEncf: string | null
  secuenciaUtilizada: boolean | null
  fechaRecepcion: string | null
  aprobacionComercialEstado: string | null
  aprobacionComercialCodigo: number | null
  mensaje: string | null
  createdAt: string
  updatedAt: string | null
  ambienteTrabajo: string | null
  correoComprador: string | null
  fechaVencimientoSecuencia: string | null
  timbreQr: string | null
  archivoEcf: string | null
  linkDescarga: string | null
  archivoFullPath: string | null
  activo: boolean
}

export interface FiscalDocumentSearchParams {
  encfTipo?: string
  encf?: string
  rncEmisor?: string
  rncComprador?: string
  idExtranjero?: string
  fechaEmision?: string
  correoComprador?: string
  estadoEncf?: string
  pageNumber?: number
  pageSize?: number
}

export interface PagedResponse<T> {
  totalItems: number
  pageNumber: number
  pageSize: number
  totalPages: number
  items: T[]
}
