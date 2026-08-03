/**
 * Contratos derivados del código actual de la WebAPI.
 * Los tipos describen el transporte; las reglas fiscales adicionales dependen
 * del XSD del tipo e-CF.
 */

export type Guid = string;

// ---------------------------------------------------------------------------
// Infraestructura y auth
// ---------------------------------------------------------------------------

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

export interface ValidationProblemDetails extends ProblemDetails {
  errors?: Record<string, string[]>;
  traceId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

/**
 * El registro se envía como FormData, no como JSON.
 * Los nombres de las propiedades deben convertirse a PascalCase en FormData.
 */
export interface RegisterForm {
  rnc: string;
  razonSocial: string;
  actividadEconomica: string;
  provinciaId: string;
  municipioId: string;
  fullName: string;
  phoneNumber: string;
  userName: string;
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  logoEmpresa?: File | null;
  certificadoFirmaDigital?: File | null;
  passwordCertificadoFirmaDigital?: string;
}

/** Resultado pretendido por AuthService.Registrar cuando el controlador lo espere correctamente. */
export interface RegisterIntendedResult {
  id: string;
  userName: string | null;
  email: string | null;
  /** @deprecated Fuga actual del backend. Ignorar y no persistir. */
  password: string | null;
  message: string;
}

/**
 * Contrato HTTP vigente: inestable porque el controlador envuelve Task en Ok
 * sin hacer await. Validar con unknown hasta corregir el backend.
 */
export type RegisterResponse = unknown;

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetCode: string;
  newPassword: string;
}

export interface JwtSessionClaims {
  nameid?: string;
  email?: string;
  unique_name?: string;
  role?: string | string[];
  Tenant_ID?: Guid;
  exp?: number;
  iss?: string;
  aud?: string | string[];
  [claim: string]: unknown;
}

export interface ClaimValue {
  type: string;
  value: string;
}

export interface TokenCheckResponse {
  isAuthenticated: boolean;
  userName: string | null;
  claims: ClaimValue[];
}

export interface IdentityUserRole {
  userId: string;
  roleId: string;
}

export interface ApplicationRole {
  id: string;
  name: string | null;
  normalizedName: string | null;
  concurrencyStamp: string | null;
  userRoles?: IdentityUserRole[] | null;
}

// ---------------------------------------------------------------------------
// Clientes y artículos
// ---------------------------------------------------------------------------

export interface Cliente {
  id: Guid;
  tenantId: Guid;
  rncComprador: string | null;
  identificadorExtranjero: string | null;
  razonSocialComprador: string;
  contactoComprador: string | null;
  correoComprador: string | null;
  direccionComprador: string | null;
  municipioComprador: string | null;
  provinciaComprador: string | null;
  paisComprador: string | null;
  fechaEntrega: string | null;
  contactoEntrega: string | null;
  direccionEntrega: string | null;
  telefonoAdicional: string | null;
  codigoInternoComprador: string | null;
  responsablePago: string | null;
  informacionAdicionalComprador: string | null;
  tipoPrecio: number | null;
  tipoPago: number | null;
  terminoPago: number | null;
  activo: boolean;
}

export type ClienteWrite = Omit<
  Cliente,
  "id" | "tenantId"
>;

export interface Articulo {
  id: Guid;
  tenantId: Guid;
  codigo: string | null;
  tipoCodigo: string | null;
  indicadorFacturacion: number;
  nombreItem: string;
  indicadorBienoServicio: number;
  descripcionItem: string | null;
  unidadMedida: number;
  precioUnitarioItem: number;
  existencia: number;
  codigoImpuesto: string | null;
  cantidadReferencia: number | null;
  unidadReferencia: number | null;
  gradosAlcohol: number | null;
  precioUnitarioReferencia: number | null;
  activo: boolean;
}

export type ArticuloWrite = Omit<
  Articulo,
  "id" | "tenantId"
>;

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

export interface CatalogBase {
  id: Guid;
  tenantId: Guid;
  activo: boolean;
}

export interface FormaPago extends CatalogBase {
  codigo: string;
  descripcion: string;
}

export interface IndicadorFacturacion extends CatalogBase {
  codigo: number;
  descripcion: string;
  tasaItbis: number;
}

export interface IndicadorRetencion extends CatalogBase {
  codigo: number;
  nombre: string;
}

export interface Medida extends CatalogBase {
  codigo: string;
  abreviatura: string;
  medidaNombre: string;
}

export interface Moneda extends CatalogBase {
  codigo: string;
  descripcion: string;
}

export interface Municipio extends CatalogBase {
  codigo: string;
  nombre: string;
  provinciaCodigo: string;
}

export interface Pais extends CatalogBase {
  codigo: string;
  nombre: string;
}

export interface Provincia extends CatalogBase {
  codigo: string;
  nombre: string;
}

export interface TerminoPago extends CatalogBase {
  codigo: string;
  nombre: string;
}

export interface TipoAjuste extends CatalogBase {
  codigo: string;
  nombre: string;
}

export interface TipoComprobante extends CatalogBase {
  tipo: number;
  ecf: string;
}

export interface TipoImpuestoAdicional extends CatalogBase {
  codigo: string;
  tipoImpuesto: string;
  abreviatura: string;
  descripcion: string;
  tasa: number;
  tipoMontoPorcentaje: string;
}

export interface TipoIngreso extends CatalogBase {
  codigo: string;
  descripcion: string;
}

export interface TipoModificacion extends CatalogBase {
  codigo: number;
  descripcion: string;
}

export interface TipoPago extends CatalogBase {
  codigo: number;
  nombre: string;
}

// ---------------------------------------------------------------------------
// Contratos fuente DGII (no disponibles en el build actual: el controlador
// está excluido por webapi.csproj). No usarlos como API activa.
// ---------------------------------------------------------------------------

export interface RncDgii {
  rnc: string | null;
  razonSocial: string | null;
  actividadEconomica: string | null;
  fechaInicioOperaciones: string | null;
  estado: string | null;
  regimenPago: string | null;
}

export interface ProvinciaDgii {
  codigo: string | null;
  nombre: string | null;
}

export interface MunicipioDgii extends ProvinciaDgii {
  provinciaCodigo: string | null;
}

// ---------------------------------------------------------------------------
// Empresas y documentos fiscales
// ---------------------------------------------------------------------------

export interface Empresa {
  id: Guid;
  tenantId: Guid;
  nombreComercial: string | null;
  nombreRazonSocial: string | null;
  sucursal: string | null;
  rnc: string | null;
  direccion: string | null;
  municipioId: string | null;
  provinciaId: string | null;
  urlBaseEcf: string | null;
  urlBaseCf: string | null;
  correo: string | null;
  webSite: string | null;
  telefono: string | null;
  telefono2: string | null;
  bancoPago: string | null;
  cuentaPago: string | null;
  tipoCuentaPago: string | null;
  actividadEconomica: string | null;
  indicadorEnvioDiferido: boolean | null;
  indicadorMontoGravado: boolean | null;
  archivoCertificado: string | null;
  passwordCertificado: string | null;
  logoEmpresa: string | null;
  ambienteTrabajo: string | null;
  emailSender: string | null;
  emailAlias: string | null;
  emailUser: string | null;
  emailPassword: string | null;
  smtpServer: string | null;
  smtpPort: string | null;
  agregarValorPagar: boolean | null;
  documentoFiscalRequiereFormaPago: boolean | null;
  agregarSubtotalInformativo: boolean | null;
  mostrarSoloProductosActivos: boolean | null;
  ingresarDescuentoPorMonto: boolean | null;
  ingresarRecargoPorMonto: boolean | null;
}

export interface DocumentoFiscal {
  id: number;
  tenantId: Guid;
  encfTipo: string;
  encf: string | null;
  rncEmisor: string | null;
  rncComprador: string | null;
  idExtranjero: string | null;
  firmaDigital: string | null;
  fechaFirma: string | null;
  codigoSeguridad: string | null;
  montoTotal: number | null;
  fechaEmision: string | null;
  encabezado_Id: number | null;
  trackId: string | null;
  estadoEncf: string | null;
  secuenciaUtilizada: boolean | null;
  fechaRecepcion: string | null;
  aprobacionComercialEstado: string | null;
  aprobacionComercialCodigo: number | null;
  mensaje: string | null;
  createdAt: string;
  updatedAt: string | null;
  ambienteTrabajo: string | null;
  correoComprador: string | null;
  fechaVencimientoSecuencia: string | null;
  timbreQr: string | null;
  archivoEcf: string | null;
  linkDescarga: string | null;
  archivoFullPath: string | null;
  activo: boolean;
}

export interface DocumentoFiscalSearchParams {
  tenantId?: string;
  encfTipo?: string;
  rncEmisor?: string;
  rncComprador?: string;
  idExtranjero?: string;
  fechaEmision?: string;
  correoComprador?: string;
  estadoEncf?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PagedResponse<T> {
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  items: T[];
}

// ---------------------------------------------------------------------------
// Emisión e-CF desde JSON
// ---------------------------------------------------------------------------

export interface EcfRequest {
  ecf: Ecf;
}

export interface Ecf {
  encabezado?: Encabezado;
  detallesItems?: DetallesItems;
  subtotales?: Subtotales;
  descuentosORecargos?: DescuentosORecargos;
  paginacion?: Paginacion;
  informacionReferencia?: InformacionReferencia;
  fechaHoraFirma?: string;
}

export interface Encabezado {
  version?: string;
  idDoc?: IdDoc;
  emisor?: Emisor;
  comprador?: Comprador;
  informacionesAdicionales?: InformacionesAdicionales;
  transporte?: Transporte;
  totales?: Totales;
  otraMoneda?: OtraMoneda;
}

export interface IdDoc {
  tipoeCF: string;
  eNCF?: string;
  fechaVencimientoSecuencia?: string;
  indicadorNotaCredito?: number;
  indicadorEnvioDiferido?: number;
  indicadorMontoGravado?: number;
  tipoIngresos?: string;
  tipoPago?: number;
  fechaLimitePago?: string;
  terminoPago?: string;
  tablaFormasPago?: TablaFormasPago;
  tipoCuentaPago?: string;
  numeroCuentaPago?: string;
  bancoPago?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  totalPaginas?: number;
}

export interface TablaFormasPago {
  formaDePago: FormaDePago[];
}

export interface FormaDePago {
  formaPago: number;
  montoPago: number;
}

export interface Emisor {
  rncEmisor: string;
  razonSocialEmisor: string;
  nombreComercial?: string;
  sucursal?: string;
  direccionEmisor: string;
  municipio?: string;
  provincia?: string;
  tablaTelefonoEmisor?: {
    telefonoEmisor: string[];
  };
  correoEmisor?: string;
  webSite?: string;
  actividadEconomica?: string;
  codigoVendedor?: string;
  numeroFacturaInterna?: string;
  numeroPedidoInterno?: string;
  zonaVenta?: string;
  rutaVenta?: string;
  informacionAdicionalEmisor?: string;
  fechaEmision?: string;
}

export interface Comprador {
  rncComprador?: string;
  identificadorExtranjero?: string;
  razonSocialComprador?: string;
  contactoComprador?: string;
  correoComprador?: string;
  direccionComprador?: string;
  municipioComprador?: string;
  provinciaComprador?: string;
  paisComprador?: string;
  fechaEntrega?: string;
  contactoEntrega?: string;
  direccionEntrega?: string;
  telefonoAdicional?: string;
  fechaOrdenCompra?: string;
  numeroOrdenCompra?: string;
  codigoInternoComprador?: string;
  responsablePago?: string;
  informacionAdicionalComprador?: string;
}

export interface InformacionesAdicionales {
  fechaEmbarque?: string;
  numeroEmbarque?: string;
  numeroContenedor?: string;
  numeroReferencia?: string;
  nombrePuertoEmbarque?: string;
  condicionesEntrega?: string;
  totalFob?: number;
  seguro?: number;
  flete?: number;
  otrosGastos?: number;
  totalCif?: number;
  regimenAduanero?: string;
  nombrePuertoSalida?: string;
  nombrePuertoDesembarque?: string;
  pesoBruto?: number;
  pesoNeto?: number;
  unidadPesoBruto?: number;
  unidadPesoNeto?: number;
  cantidadBulto?: number;
  unidadBulto?: number;
  volumenBulto?: number;
  unidadVolumen?: number;
}

export interface Transporte {
  viaTransporte?: string;
  paisOrigen?: string;
  direccionDestino?: string;
  paisDestino?: string;
  rncIdentificacionCompaniaTransportista?: string;
  nombreCompaniaTransportista?: string;
  numeroViaje?: string;
  conductor?: string;
  documentoTransporte?: number;
  ficha?: string;
  placa?: string;
  rutaTransporte?: string;
  zonaTransporte?: string;
  numeroAlbaran?: string;
}

export interface Totales {
  montoGravadoTotal?: number;
  montoGravadoI1?: number;
  montoGravadoI2?: number;
  montoGravadoI3?: number;
  montoExento?: number;
  /** Camel case real de la propiedad C# ITBIS1. */
  itbiS1?: number;
  itbiS2?: number;
  itbiS3?: number;
  totalITBIS?: number;
  totalITBIS1?: number;
  totalITBIS2?: number;
  totalITBIS3?: number;
  montoImpuestoAdicional?: number;
  impuestosAdicionales?: ImpuestosAdicionales;
  montoTotal?: number;
  montoNoFacturable?: number;
  montoPeriodo?: number;
  saldoAnterior?: number;
  montoAvancePago?: number;
  valorPagar?: number;
  totalITBISRetenido?: number;
  totalISRRetencion?: number;
  totalITBISPercepcion?: number;
  totalISRPercepcion?: number;
}

export interface ImpuestosAdicionales {
  impuestoAdicional: ImpuestoAdicional[];
}

export interface ImpuestoAdicional {
  tipoImpuesto?: string;
  tasaImpuestoAdicional?: number;
  montoImpuestoSelectivoConsumoEspecifico?: number;
  montoImpuestoSelectivoConsumoAdvalorem?: number;
  otrosImpuestosAdicionales?: number;
}

export interface OtraMoneda {
  tipoMoneda?: string;
  tipoCambio?: number;
  montoGravadoTotalOtraMoneda?: number;
  montoGravado1OtraMoneda?: number;
  montoGravado2OtraMoneda?: number;
  montoGravado3OtraMoneda?: number;
  montoExentoOtraMoneda?: number;
  totalITBISOtraMoneda?: number;
  totalITBIS1OtraMoneda?: number;
  totalITBIS2OtraMoneda?: number;
  totalITBIS3OtraMoneda?: number;
  montoImpuestoAdicionalOtraMoneda?: number;
  impuestosAdicionalesOtraMoneda?: {
    impuestoAdicionalOtraMoneda: ImpuestoAdicionalOtraMoneda[];
  };
  montoTotalOtraMoneda?: number;
}

export interface ImpuestoAdicionalOtraMoneda {
  tipoImpuestoOtraMoneda: string;
  tasaImpuestoAdicionalOtraMoneda: number;
  montoImpuestoSelectivoConsumoEspecificoOtraMoneda?: number;
  montoImpuestoSelectivoConsumoAdvaloremOtraMoneda?: number;
  otrosImpuestosAdicionalesOtraMoneda?: number;
}

export interface DetallesItems {
  item: Item[];
}

export interface Item {
  numeroLinea: number;
  tablaCodigosItem?: {
    codigosItem: CodigoItem[];
  };
  indicadorFacturacion: number;
  retencion?: Retencion;
  nombreItem: string;
  indicadorBienoServicio: number;
  descripcionItem?: string;
  cantidadItem?: number;
  unidadMedida?: number;
  cantidadReferencia?: number;
  unidadReferencia?: number;
  tablaSubcantidad?: {
    subcantidadItem: SubcantidadItem[];
  };
  gradosAlcohol?: number;
  precioUnitarioReferencia?: number;
  fechaElaboracion?: string;
  fechaVencimientoItem?: string;
  precioUnitarioItem?: number;
  descuentoMonto?: number;
  tablaSubDescuento?: {
    subDescuento: SubDescuento[];
  };
  recargoMonto?: number;
  tablaSubRecargo?: {
    subRecargo: SubRecargo[];
  };
  tablaImpuestoAdicional?: {
    impuestoAdicional: ImpuestoAdicional[];
  };
  otraMonedaDetalle?: OtraMonedaDetalle;
  montoItem?: number;
}

export interface CodigoItem {
  tipoCodigo: string;
  codigoItem: string;
}

export interface Retencion {
  indicadorAgenteRetencionoPercepcion?: string;
  montoITBISRetenido?: number;
  montoISRRetenido?: number;
}

export interface SubcantidadItem {
  subcantidad?: number;
  codigoSubcantidad?: number;
}

export interface SubDescuento {
  tipoSubDescuento: string;
  subDescuentoPorcentaje?: number;
  montoSubDescuento?: number;
}

export interface SubRecargo {
  tipoSubRecargo?: string;
  subRecargoPorcentaje?: number;
  montoSubRecargo?: number;
}

export interface OtraMonedaDetalle {
  precioOtraMoneda?: number;
  descuentoOtraMoneda?: number;
  recargoOtraMoneda?: number;
  montoItemOtraMoneda?: number;
}

export interface Subtotales {
  subtotal: Subtotal[];
}

export interface Subtotal {
  numeroSubTotal?: number;
  descripcionSubtotal?: string;
  orden?: number;
  subTotalMontoGravadoTotal?: number;
  subTotalMontoGravadoI1?: number;
  subTotalMontoGravadoI2?: number;
  subTotalMontoGravadoI3?: number;
  subTotaITBIS?: number;
  subTotaITBIS1?: number;
  subTotaITBIS2?: number;
  subTotaITBIS3?: number;
  subTotalImpuestoAdicional?: number;
  subTotalExento?: number;
  montoSubTotal?: number;
  lineas?: number;
}

export interface DescuentosORecargos {
  descuentoORecargo: DescuentoORecargo[];
}

export interface DescuentoORecargo {
  numeroLinea: number;
  tipoAjuste: string;
  indicadorNorma1007?: number;
  descripcionDescuentooRecargo?: string;
  tipoValor?: string;
  valorDescuentooRecargo?: number;
  montoDescuentooRecargo?: number;
  montoDescuentooRecargoOtraMoneda?: number;
  indicadorFacturacionDescuentooRecargo?: number;
}

export interface Paginacion {
  pagina: Pagina[];
}

export interface Pagina {
  paginaNo: number;
  noLineaDesde?: number;
  noLineaHasta?: number;
  subtotalMontoGravadoPagina?: number;
  subtotalMontoGravado1Pagina?: number;
  subtotalMontoGravado2Pagina?: number;
  subtotalMontoGravado3Pagina?: number;
  subtotalExentoPagina?: number;
  subtotalItbisPagina?: number;
  subtotalItbis1Pagina?: number;
  subtotalItbis2Pagina?: number;
  subtotalItbis3Pagina?: number;
  subtotalImpuestoAdicionalPagina?: number;
  subtotalImpuestoAdicional?: {
    subtotalImpuestoSelectivoConsumoEspecificoPagina?: number;
    subtotalOtrosImpuesto?: number;
  };
  montoSubtotalPagina?: number;
  subtotalMontoNoFacturablePagina?: number;
}

export interface InformacionReferencia {
  ncfModificado?: string;
  rncOtroContribuyente?: string;
  fechaNCFModificado?: string;
  codigoModificacion?: number;
  razonModificacion?: string;
}

export interface AcEcfEmisionRequest {
  rncEmisor: string;
  rncComprador: string;
  encf: string;
}

export interface GenerarPdfRequest {
  tenantId: Guid;
  encf: string;
}
