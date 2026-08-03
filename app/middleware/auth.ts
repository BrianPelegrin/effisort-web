export default defineNuxtRouteMiddleware((to) => {
    if (!to.path.startsWith('/admin')) return

    const authStore = useAuthStore()
    if (import.meta.client && !authStore.isInitialized) authStore.initFromStorage()

    if (!authStore.isAuthenticated) {
        authStore.clearSession()
        return navigateTo('/auth/login')
    }
})
