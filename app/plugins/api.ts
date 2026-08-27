import { ApiError, createApiClient, type ApiRequestOptions } from '~/utils/api'

export default defineNuxtPlugin({
  name: 'api',
  setup() {
    const config = useRuntimeConfig()
    const auth = useAuthStore()

    async function clearExpiredSession() {
      auth.clearSession()
      await navigateTo('/auth/login')
    }

    const request = createApiClient({
      baseURL: String(config.public.apiBase),
      getToken: () => auth.token,
      defaultTimeoutMs: 30_000,
      async onUnauthorized(path) {
        const isLoginRequest = path.includes('/api/auth/login')
        if (!isLoginRequest && auth.token) await clearExpiredSession()
      },
    })

    async function api<T>(path: string, options: ApiRequestOptions = {}) {
      if (!auth.isInitialized && import.meta.client) auth.initFromStorage()

      const publicAuthPaths = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
      ]
      const isPublicAuthRequest = publicAuthPaths.some(publicPath => path.startsWith(publicPath))
      if (!isPublicAuthRequest && auth.token && !auth.isAuthenticated) {
        await clearExpiredSession()
        throw new ApiError(401, 'La sesión venció o dejó de ser válida.', 'text/plain')
      }

      return request<T>(path, options)
    }

    return {
      provide: {
        api,
      },
    }
  },
})
