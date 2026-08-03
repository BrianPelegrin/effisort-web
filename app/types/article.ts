export interface Article {
  id: string
  tenantId: string
  codigo: string | null
  tipoCodigo: string | null
  indicadorFacturacion: number
  nombreItem: string
  indicadorBienoServicio: number
  descripcionItem: string | null
  unidadMedida: number
  precioUnitarioItem: number
  existencia: number
  codigoImpuesto: string | null
  cantidadReferencia: number | null
  unidadReferencia: number | null
  gradosAlcohol: number | null
  precioUnitarioReferencia: number | null
  activo: boolean
}

export type ArticleWrite = Omit<Article, 'id' | 'tenantId'>

export interface BillingIndicator {
  id: string
  codigo: number
  descripcion: string
  tasaItbis: number
  activo: boolean
}

export interface MeasurementUnit {
  id: string
  codigo: string
  abreviatura: string
  medidaNombre: string
  activo: boolean
}
