import type { ApiRequestOptions } from '~/utils/api'
import type {
  ChangePasswordRequest,
  CreateTenantUserRequest,
  ResetTenantUserPasswordRequest,
  SuccessMessageResponse,
  TenantUser,
} from '~/types/tenant-user'
import { UnknownUserMutationError, validateSuccessMessage, validateTenantUser, validateTenantUserList } from '~/utils/tenant-users'

export type TenantUserRequest = <T>(path: string, options: ApiRequestOptions) => Promise<T>

export function createTenantUsersApi(request: TenantUserRequest) {
  return {
    async getCurrentUser(): Promise<TenantUser | null> {
      const value = await request<unknown>('/api/auth/get-user', { method: 'POST' })
      return value === null ? null : validateTenantUser(value)
    },
    async listTenantUsers(): Promise<TenantUser[]> {
      return validateTenantUserList(await request<unknown>('/api/auth/get-tenant-users', { method: 'POST' }))
    },
    async createTenantUser(body: CreateTenantUserRequest): Promise<TenantUser> {
      const value = await request<unknown>('/api/auth/add-users', { method: 'POST', body })
      try { return validateTenantUser(value) }
      catch { throw new UnknownUserMutationError() }
    },
    async changeOwnPassword(body: ChangePasswordRequest): Promise<SuccessMessageResponse> {
      const value = await request<unknown>('/api/auth/change-password', { method: 'POST', body })
      try { return validateSuccessMessage(value) }
      catch { throw new UnknownUserMutationError() }
    },
    async resetTenantUserPassword(body: ResetTenantUserPasswordRequest): Promise<SuccessMessageResponse> {
      const value = await request<unknown>('/api/auth/users/reset-password', { method: 'POST', body })
      try { return validateSuccessMessage(value) }
      catch { throw new UnknownUserMutationError() }
    },
  }
}
