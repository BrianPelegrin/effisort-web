import { defineStore } from 'pinia'
import type { AuthUser, JwtSessionClaims } from '~/types/auth'

type JwtPayload = JwtSessionClaims & {
  sub?: string
  name?: string
}

const EMAIL_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
const ID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = decodeURIComponent(
      atob(base64)
        .split('')
        .map(character => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )

    return JSON.parse(decoded) as JwtPayload
  } catch {
    return null
  }
}

function getStringClaim(payload: JwtPayload, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string') return value
  }

  return ''
}

function getRoles(payload: JwtPayload) {
  const claim = payload.role ?? payload[ROLE_CLAIM]
  const values = Array.isArray(claim) ? claim : typeof claim === 'string' ? [claim] : []

  return values
    .flatMap(value => value.split(','))
    .map(value => value.trim())
    .filter(Boolean)
}

function userFromPayload(payload: JwtPayload): AuthUser {
  const email = getStringClaim(payload, 'email', EMAIL_CLAIM)
  const name = getStringClaim(payload, 'unique_name', 'name', NAME_CLAIM) || email

  return {
    id: getStringClaim(payload, 'nameid', 'sub', ID_CLAIM),
    tenantId: getStringClaim(payload, 'Tenant_ID', 'tenantId'),
    name,
    email,
    userName: email,
    roles: getRoles(payload),
    avatar: '',
  }
}

function isUsableSessionPayload(payload: JwtPayload | null): payload is JwtPayload & { exp: number; Tenant_ID: string } {
  return Boolean(
    payload
    && typeof payload.exp === 'number'
    && payload.exp * 1000 > Date.now()
    && getStringClaim(payload, 'Tenant_ID'),
  )
}

export const useAuthStore = defineStore('authStore', () => {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const token = useState<string | null>('auth-token', () => null)
  const expiresAt = useState<number | null>('auth-expires-at', () => null)
  const isInitialized = useState<boolean>('auth-initialized', () => false)

  const isAuthenticated = computed(() => {
    if (!token.value || !expiresAt.value || !user.value?.tenantId) return false
    return expiresAt.value > Date.now()
  })

  function clearStoredSession() {
    if (import.meta.server) return

    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem('token')
      storage.removeItem('user')
    }
  }

  function clearSession() {
    token.value = null
    user.value = null
    expiresAt.value = null
    clearStoredSession()
  }

  function restoreToken(tokenToRestore: string | null) {
    if (!tokenToRestore) return false

    const payload = decodeJwtPayload(tokenToRestore)
    if (!isUsableSessionPayload(payload)) return false

    token.value = tokenToRestore
    expiresAt.value = payload.exp * 1000
    user.value = userFromPayload(payload)
    return true
  }

  function initFromStorage() {
    if (import.meta.server || isInitialized.value) return

    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!restoreToken(storedToken)) clearSession()
    isInitialized.value = true
  }

  function setSession(tokenToSet: string, remember: boolean) {
    const payload = decodeJwtPayload(tokenToSet)

    if (!isUsableSessionPayload(payload)) {
      throw new Error('El servidor devolvió una sesión inválida, vencida o sin tenant.')
    }

    clearStoredSession()
    token.value = tokenToSet
    expiresAt.value = payload.exp * 1000
    user.value = userFromPayload(payload)
    isInitialized.value = true

    if (import.meta.server) return

    const storage = remember ? localStorage : sessionStorage
    storage.setItem('token', tokenToSet)
  }

  async function logout() {
    clearSession()
    await navigateTo('/auth/login')
  }

  return {
    isAuthenticated,
    user,
    token,
    expiresAt,
    isInitialized,
    initFromStorage,
    setSession,
    clearSession,
    logout,
  }
})
