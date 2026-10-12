import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin({
  name: 'auth-init',
  dependsOn: ['api'],
  async setup() {
    const auth = useAuthStore()
    auth.initFromStorage()

    if (auth.isAuthenticated && auth.currentUserStatus === 'idle') {
      try {
        await auth.loadCurrentUser()
      } catch {
        // A transient error is kept in the store; a null user clears the session.
      }
    }

    if (auth.isAuthenticated && auth.profileStatus === 'idle') {
      try {
        await auth.loadProfile()
      } catch {
        // The store preserves the actionable profile state for the UI.
      }
    }
  },
})
