import { describe, expect, it, vi } from 'vitest'
import { TENANT_USER_ROLES } from '~/types/tenant-user'
import { ApiError, createApiClient } from '~/utils/api'
import { createTenantUsersApi } from '~/utils/tenant-users-api'
import {
  isUnknownUserMutationResult,
  matchesTenantUserIdentity,
  passwordPolicyError,
  prepareCreateTenantUser,
  validateTenantUserList,
} from '~/utils/tenant-users'

const user = {
  id: 'user-1', tenantId: 'tenant-1', userName: 'maria.ventas', email: 'maria@empresa.test',
  displayName: 'María Pérez', roles: ['FacUser'],
}

describe('usuarios del tenant', () => {
  it('normaliza el alta y valida los roles de la lista cerrada', () => {
    const prepared = prepareCreateTenantUser({
      firstName: ' María ', lastName: ' Pérez ', email: ' MARIA@EMPRESA.TEST ', userName: ' maria.ventas ',
      password: 'ClaveSegura1!', roles: ['FacUser', 'FacUser'],
    })
    expect(prepared.valid).toBe(true)
    expect(prepared.request).toEqual({
      firstName: 'María', lastName: 'Pérez', email: 'maria@empresa.test', userName: 'maria.ventas',
      password: 'ClaveSegura1!', roles: ['FacUser'],
    })
    expect(TENANT_USER_ROLES).not.toContain('SuperAdmin')
    expect(TENANT_USER_ROLES).not.toContain('PrdUser')
  })

  it('rechaza campos vacíos, username inválido, contraseña débil y rol ajeno', () => {
    const prepared = prepareCreateTenantUser({
      firstName: ' ', lastName: '', email: 'incorrecto', userName: 'usuario con espacios',
      password: 'clave', roles: ['SuperAdmin' as never],
    })
    expect(prepared.valid).toBe(false)
    expect(Object.keys(prepared.errors)).toEqual(expect.arrayContaining(['firstName', 'lastName', 'email', 'userName', 'password', 'roles']))
    expect(passwordPolicyError('Abcdef1!')).toBe('')
    expect(passwordPolicyError('abcdef1!')).toMatch(/mayúscula/)
    expect(passwordPolicyError('ABCDEF1!')).toMatch(/minúscula/)
    expect(passwordPolicyError('Abcdef!')).toMatch(/dígito/)
    expect(passwordPolicyError('Abcdef1')).toMatch(/especial/)
    expect(passwordPolicyError('Abcdef1á')).toMatch(/especial/)
  })

  it('acepta lista vacía y reconoce email o username tras una respuesta ambigua', () => {
    expect(validateTenantUserList([])).toEqual([])
    expect(matchesTenantUserIdentity(user, 'MARIA@EMPRESA.TEST', '')).toBe(true)
    expect(matchesTenantUserIdentity(user, '', 'MARIA.VENTAS')).toBe(true)
    expect(matchesTenantUserIdentity(user, 'otro@empresa.test', 'otro')).toBe(false)
  })

  it('usa solo los cinco POST documentados con Bearer y cuerpos JSON apropiados', async () => {
    const responses = [null, [user], user, { message: 'Actualizada.' }, { message: 'Reiniciada.' }]
    const fetchImplementation = vi.fn(async (_url: string | URL | Request) => new Response(JSON.stringify(responses.shift()), {
      status: responses.length === 2 ? 201 : 200,
      headers: { 'content-type': 'application/json' },
    }))
    const client = createApiClient({ baseURL: 'https://api.example.test', getToken: () => 'jwt-token', fetchImplementation })
    const api = createTenantUsersApi(client)

    expect(await api.getCurrentUser()).toBeNull()
    expect(await api.listTenantUsers()).toEqual([user])
    expect(await api.createTenantUser({ firstName: 'María', lastName: 'Pérez', email: user.email, userName: user.userName, password: 'ClaveSegura1!', roles: ['FacUser'] })).toEqual(user)
    expect(await api.changeOwnPassword({ currentPassword: 'Actual1!', newPassword: 'Nueva2!' })).toEqual({ message: 'Actualizada.' })
    expect(await api.resetTenantUserPassword({ userId: user.id, newPassword: 'Nueva2!' })).toEqual({ message: 'Reiniciada.' })

    expect(fetchImplementation.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual([
      '/api/auth/get-user', '/api/auth/get-tenant-users', '/api/auth/add-users',
      '/api/auth/change-password', '/api/auth/users/reset-password',
    ])
    for (const [, init] of fetchImplementation.mock.calls as unknown as [string, RequestInit][]) {
      expect(init.method).toBe('POST')
      expect(new Headers(init.headers).get('Authorization')).toBe('Bearer jwt-token')
    }
    const createBody = JSON.parse(String((fetchImplementation.mock.calls as unknown as [string, RequestInit][])[2]?.[1].body))
    expect(new Headers((fetchImplementation.mock.calls as unknown as [string, RequestInit][])[2]?.[1].headers).get('Content-Type')).toBe('application/json')
    expect(createBody).not.toHaveProperty('tenantId')
    expect(createBody).not.toHaveProperty('id')
    expect(JSON.parse(String((fetchImplementation.mock.calls as unknown as [string, RequestInit][])[3]?.[1].body))).not.toHaveProperty('userId')
  })

  it('mantiene 403 y no repite una mutación cuyo resultado es incierto', async () => {
    const forbiddenClient = createApiClient({ baseURL: 'https://api.example.test', getToken: () => 'jwt-token', fetchImplementation: vi.fn(async () => new Response('Forbidden', { status: 403 })) })
    await expect(createTenantUsersApi(forbiddenClient).listTenantUsers()).rejects.toMatchObject({ status: 403 })

    const fetchImplementation = vi.fn(async () => new Response('<h1>Error</h1>', { status: 500, headers: { 'content-type': 'text/html' } }))
    const client = createApiClient({ baseURL: 'https://api.example.test', getToken: () => 'jwt-token', fetchImplementation })
    const error = await createTenantUsersApi(client).resetTenantUserPassword({ userId: user.id, newPassword: 'Nueva2!' }).catch(value => value)
    expect(error).toBeInstanceOf(ApiError)
    expect(isUnknownUserMutationResult(error)).toBe(true)
    expect(fetchImplementation).toHaveBeenCalledOnce()

    const malformedClient = createApiClient({ baseURL: 'https://api.example.test', getToken: () => 'jwt-token', fetchImplementation: vi.fn(async () => new Response('{}', { status: 201, headers: { 'content-type': 'application/json' } })) })
    const malformedResult = await createTenantUsersApi(malformedClient).createTenantUser({ firstName: 'María', lastName: 'Pérez', email: user.email, userName: user.userName, password: 'ClaveSegura1!', roles: ['FacUser'] }).catch(value => value)
    expect(isUnknownUserMutationResult(malformedResult)).toBe(true)
  })
})
