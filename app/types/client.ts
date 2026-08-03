export interface Client {
  id: string
  tenantId: string
  rncComprador: string | null
  identificadorExtranjero: string | null
  razonSocialComprador: string
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
  codigoInternoComprador: string | null
  responsablePago: string | null
  informacionAdicionalComprador: string | null
  tipoPrecio: number | null
  tipoPago: number | null
  terminoPago: number | null
  activo: boolean
}

export type ClientWrite = Omit<Client, 'id' | 'tenantId'>
