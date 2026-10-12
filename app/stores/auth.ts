import { defineStore } from 'pinia'
import type { AuthUser, JwtSessionClaims, ProfileStatus, UserProfile } from '~/types/auth'
import type { TenantUser } from '~/types/tenant-user'
import { ApiError } from '~/utils/api'
import { validateUserProfile } from '~/utils/auth'

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
  const profile = useState<UserProfile | null>('auth-profile', () => null)
  const profileStatus = useState<ProfileStatus>('auth-profile-status', () => 'idle')
  const profileError = useState<string>('auth-profile-error', () => '')
  const currentTenantUser = useState<TenantUser | null>('auth-current-tenant-user', () => null)
  const currentUserStatus = useState<'idle' | 'loading' | 'ready' | 'error'>('auth-current-user-status', () => 'idle')
  const currentUserError = useState<string>('auth-current-user-error', () => '')

  const isAuthenticated = computed(() => {
    if (!token.value || !expiresAt.value || !user.value?.tenantId) return false
    return expiresAt.value > Date.now()
  })

  const hasCompanyContext = computed(() => Boolean(
    isAuthenticated.value
    && profileStatus.value === 'ready'
    && profile.value?.empresa.tenantId === user.value?.tenantId,
  ))
  const isTenantAdmin = computed(() => Boolean(isAuthenticated.value && user.value?.roles.includes('TenantAdmin')))

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
    profile.value = null
    profileStatus.value = 'idle'
    profileError.value = ''
    currentTenantUser.value = null
    currentUserStatus.value = 'idle'
    currentUserError.value = ''
    clearStoredSession()
  }

  function restoreToken(tokenToRestore: string | null) {
    if (!tokenToRestore) return false

    const payload = decodeJwtPayload(tokenToRestore)
    if (!isUsableSessionPayload(payload)) return false

    token.value = tokenToRestore
    expiresAt.value = payload.exp * 1000
    user.value = userFromPayload(payload)
    profile.value = null
    profileStatus.value = 'idle'
    profileError.value = ''
    currentTenantUser.value = null
    currentUserStatus.value = 'idle'
    currentUserError.value = ''
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
    profile.value = null
    profileStatus.value = 'idle'
    profileError.value = ''
    currentTenantUser.value = null
    currentUserStatus.value = 'idle'
    currentUserError.value = ''
    isInitialized.value = true

    if (import.meta.server) return

    const storage = remember ? localStorage : sessionStorage
    storage.setItem('token', tokenToSet)
  }

  async function loadProfile() {
    if (!isAuthenticated.value) {
      throw new Error('No existe una sesión válida para consultar el perfil.')
    }

    profileStatus.value = 'loading'
    profileError.value = ''

    try {
      const { $api } = useNuxtApp()
      const loadedProfile = validateUserProfile(await $api<unknown>('/api/auth/perfil', {
        method: 'GET',
        accept: 'application/json',
      }))
      const sessionUser = user.value

      if (!sessionUser || loadedProfile.empresa.tenantId !== sessionUser.tenantId) {
        clearSession()
        throw new Error('El tenant del perfil no coincide con el tenant de la sesión.')
      }

      profile.value = loadedProfile
      profileStatus.value = 'ready'
      user.value = {
        ...sessionUser,
        id: loadedProfile.id,
        name: currentTenantUser.value?.displayName || loadedProfile.userName || loadedProfile.email || sessionUser.name,
        userName: loadedProfile.userName || sessionUser.userName,
        email: loadedProfile.email || sessionUser.email,
      }
      return loadedProfile
    } catch (error) {
      profile.value = null

      if (error instanceof ApiError && error.status === 404) {
        profileStatus.value = 'missing'
        profileError.value = error.message
        return null
      }

      if (error instanceof ApiError && error.status === 401) {
        clearSession()
        throw error
      }

      if (!token.value) throw error

      profileStatus.value = 'error'
      profileError.value = error instanceof Error
        ? error.message
        : 'No pudimos cargar el perfil y la empresa de la sesión.'
      throw error
    }
  }

  async function loadCurrentUser() {
    if (!isAuthenticated.value) throw new Error('No existe una sesión válida para consultar el usuario.')

    currentUserStatus.value = 'loading'
    currentUserError.value = ''
    try {
      const loadedUser = await useTenantUsersApi().getCurrentUser()
      if (!loadedUser || loadedUser.tenantId !== user.value?.tenantId || loadedUser.id !== user.value.id) {
        await logout()
        throw new Error('La sesión no corresponde a un usuario activo. Inicia sesión nuevamente.')
      }

      currentTenantUser.value = loadedUser
      currentUserStatus.value = 'ready'
      user.value = {
        ...user.value,
        name: loadedUser.displayName || loadedUser.userName,
        email: loadedUser.email,
        userName: loadedUser.userName,
      }
      return loadedUser
    } catch (error) {
      if (!token.value) throw error
      currentTenantUser.value = null
      currentUserStatus.value = 'error'
      currentUserError.value = error instanceof Error ? error.message : 'No pudimos consultar el usuario autenticado.'
      throw error
    }
  }

  async function logout() {
    clearSession()
    await navigateTo('/auth/login')
  }

  return {
    isAuthenticated,
    hasCompanyContext,
    isTenantAdmin,
    user,
    token,
    expiresAt,
    isInitialized,
    profile,
    profileStatus,
    profileError,
    currentTenantUser,
    currentUserStatus,
    currentUserError,
    initFromStorage,
    setSession,
    loadProfile,
    loadCurrentUser,
    clearSession,
    logout,
  }
})
