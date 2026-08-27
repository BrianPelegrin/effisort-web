interface BillingCatalogBase {
  id: string
  tenantId: string
  activo: boolean
}

export interface PaymentMethod extends BillingCatalogBase {
  codigo: string
  descripcion: string
}

export interface Currency extends BillingCatalogBase {
  codigo: string
  descripcion: string
}

export interface ReceiptType extends BillingCatalogBase {
  tipo: number
  ecf: string
}

export interface IncomeType extends BillingCatalogBase {
  codigo: string
  descripcion: string
}

export interface PaymentType extends BillingCatalogBase {
  codigo: number
  nombre: string
}

export interface PaymentTerm extends BillingCatalogBase {
  codigo: string
  nombre: string
}
