import { TENANT_USER_ROLES } from '~/types/tenant-user'
import type { CreateTenantUserRequest, SuccessMessageResponse, TenantUser, TenantUserRole } from '~/types/tenant-user'
import { ApiError } from '~/utils/api'

export interface CreateTenantUserFields {
  firstName: string
  lastName: string
  email: string
  userName: string
  password: string
  roles: TenantUserRole[]
}

export class UnknownUserMutationError extends Error {
  constructor() {
    super('La API respondió, pero no pudimos confirmar el resultado de la operación.')
    this.name = 'UnknownUserMutationError'
  }
}

export function passwordPolicyError(password: string) {
  if (password.length < 6) return 'Usa al menos 6 caracteres.'
  if (!/[A-Z]/.test(password)) return 'Incluye al menos una mayúscula.'
  if (!/[a-z]/.test(password)) return 'Incluye al menos una minúscula.'
  if (!/\d/.test(password)) return 'Incluye al menos un dígito.'
  if (!/[\p{P}\p{S}]/u.test(password)) return 'Incluye al menos un carácter especial.'
  return ''
}

export function prepareCreateTenantUser(fields: CreateTenantUserFields) {
  const request: CreateTenantUserRequest = {
    firstName: fields.firstName.trim(),
    lastName: fields.lastName.trim(),
    email: fields.email.trim().toLowerCase(),
    userName: fields.userName.trim(),
    password: fields.password,
    roles: [...new Set(fields.roles)],
  }
  const errors: Partial<Record<keyof CreateTenantUserRequest, string>> = {}

  if (!request.firstName) errors.firstName = 'Escribe el nombre.'
  if (!request.lastName) errors.lastName = 'Escribe el apellido.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) errors.email = 'Escribe un correo válido.'
  if (!request.userName || !/^[A-Za-z0-9._@+-]+$/.test(request.userName)) errors.userName = 'Usa letras, números o - . _ @ +.'
  errors.password = passwordPolicyError(request.password) || undefined
  if (!request.roles.length || request.roles.some(role => !TENANT_USER_ROLES.includes(role))) {
    errors.roles = 'Selecciona al menos un rol permitido.'
  }

  return { request, errors, valid: !Object.values(errors).some(Boolean) }
}

export function validateTenantUser(value: unknown): TenantUser {
  if (!isRecord(value)
    || !isNonEmptyString(value.id)
    || !isNonEmptyString(value.tenantId)
    || typeof value.userName !== 'string'
    || typeof value.email !== 'string'
    || typeof value.displayName !== 'string'
    || !Array.isArray(value.roles)
    || !value.roles.every(role => typeof role === 'string')) {
    throw new Error('La API devolvió un usuario inválido.')
  }
  return value as unknown as TenantUser
}

export function validateTenantUserList(value: unknown): TenantUser[] {
  if (!Array.isArray(value)) throw new Error('La API no devolvió una lista de usuarios válida.')
  return value.map(validateTenantUser)
}

export function validateSuccessMessage(value: unknown): SuccessMessageResponse {
  if (!isRecord(value) || !isNonEmptyString(value.message)) {
    throw new Error('La API no devolvió una confirmación válida.')
  }
  return { message: value.message }
}

export function isUnknownUserMutationResult(error: unknown) {
  return error instanceof UnknownUserMutationError
    || (error instanceof ApiError
      && (error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR' || error.status >= 500))
}

export function matchesTenantUserIdentity(user: TenantUser, email: string, userName: string) {
  return user.email.toLowerCase() === email.trim().toLowerCase()
    || user.userName.toLowerCase() === userName.trim().toLowerCase()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}
