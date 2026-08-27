interface LocationCatalogBase {
  id: string
  tenantId: string
  codigo: string
  nombre: string
  activo: boolean
}

export type Province = LocationCatalogBase

export interface Municipality extends LocationCatalogBase {
  provinciaCodigo: string
}
