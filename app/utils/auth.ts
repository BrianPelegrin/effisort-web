import type { CompanyProfile, LoginResponse, UserProfile } from '~/types/auth'

export function validateLoginResponse(value: unknown): LoginResponse {
  if (
    typeof value !== 'object'
    || value === null
    || !('token' in value)
    || typeof value.token !== 'string'
    || !value.token.trim()
  ) {
    throw new Error('La respuesta del servidor no contiene una sesión válida.')
  }

  return { token: value.token }
}

export function validateUserProfile(value: unknown): UserProfile {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isRecord(value.empresa)) {
    throw new Error('La API devolvió un perfil de usuario inválido.')
  }

  const company = value.empresa
  if (!isNonEmptyString(company.tenantId)) {
    throw new Error('El perfil no contiene una empresa con tenant válido.')
  }

  assertNullableStrings(value, ['userName', 'email', 'phoneNumber'], 'perfil')
  assertNullableStrings(company, [
    'nombreRazonSocial',
    'nombreComercial',
    'sucursal',
    'rnc',
    'direccion',
    'telefono',
    'telefono2',
    'municipioId',
    'provinciaId',
    'correo',
    'webSite',
    'actividadEconomica',
  ], 'empresa')

  return {
    id: value.id,
    userName: value.userName as string | null,
    email: value.email as string | null,
    phoneNumber: value.phoneNumber as string | null,
    empresa: company as unknown as CompanyProfile,
  }
}

function assertNullableStrings(value: Record<string, unknown>, keys: string[], scope: string) {
  for (const key of keys) {
    if (!(key in value) || (value[key] !== null && typeof value[key] !== 'string')) {
      throw new Error(`El ${scope} no contiene un ${key} válido.`)
    }
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
