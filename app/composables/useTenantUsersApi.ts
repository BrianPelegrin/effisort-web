import { createTenantUsersApi } from '~/utils/tenant-users-api'

export function useTenantUsersApi() {
  return createTenantUsersApi(useNuxtApp().$api)
}
