export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface UserProfile {
  id: string
  userName: string | null
  email: string | null
  phoneNumber: string | null
  empresa: CompanyProfile
}

export interface CompanyProfile {
  tenantId: string
  nombreRazonSocial: string | null
  nombreComercial: string | null
  sucursal: string | null
  rnc: string | null
  direccion: string | null
  telefono: string | null
  telefono2: string | null
  municipioId: string | null
  provinciaId: string | null
  correo: string | null
  webSite: string | null
  actividadEconomica: string | null
}

export interface ApiMessageResponse {
  mensaje: string
}

export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'error'

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  [key: string]: unknown
}

export interface ValidationProblemDetails extends ProblemDetails {
  traceId?: string
  errors?: Record<string, string[]>
}

export interface JwtSessionClaims {
  nameid?: string
  email?: string
  unique_name?: string
  role?: string | string[]
  Tenant_ID?: string
  exp?: number
  iss?: string
  aud?: string | string[]
  [claim: string]: unknown
}

export interface AuthUser {
  id: string
  tenantId: string
  name: string
  email: string
  userName: string
  roles: string[]
  avatar: string
}
