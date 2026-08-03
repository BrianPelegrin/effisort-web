export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  async function clearExpiredSession() {
    auth.clearSession()
    await navigateTo('/auth/login')
  }

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    headers: {
      Accept: 'application/json',
    },
    async onRequest({ request, options }) {
      if (!auth.isInitialized && import.meta.client) auth.initFromStorage()

      const isAuthRequest = String(request).includes('/api/auth/')

      if (!isAuthRequest && auth.token && !auth.isAuthenticated) {
        await clearExpiredSession()
        throw createError({
          statusCode: 401,
          statusMessage: 'La sesión venció o dejó de ser válida.',
        })
      }

      if (auth.token) {
        const headers = new Headers(options.headers)
        headers.set('Authorization', `Bearer ${auth.token}`)
        options.headers = headers
      }
    },
    async onResponseError({ request, response }) {
      const isLoginRequest = String(request).includes('/api/auth/login')

      if (response.status === 401 && !isLoginRequest && auth.token) {
        await clearExpiredSession()
      }
    },
  })

  return {
    provide: {
      api,
    },
  }
})
