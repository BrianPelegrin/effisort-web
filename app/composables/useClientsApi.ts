import type { Client, ClientWrite } from '~/types/client'

export function useClientsApi() {
  const { $api } = useNuxtApp()
  const auth = useAuthStore()

  async function getClients(includeInactive = false) {
    if (!auth.isAuthenticated) {
      auth.clearSession()
      await navigateTo('/auth/login')
      throw createError({
        statusCode: 401,
        statusMessage: 'La sesión venció o dejó de ser válida.',
      })
    }

    return $api<Client[]>('/api/clientes', {
      method: 'GET',
      query: {
        incluirInactivos: includeInactive,
      },
    })
  }

  function getClient(id: string) {
    return $api<Client>(`/api/clientes/${id}`, {
      method: 'GET',
    })
  }

  function createClient(client: ClientWrite) {
    return $api<Client>('/api/clientes', {
      method: 'POST',
      body: client,
    })
  }

  function updateClient(id: string, client: ClientWrite) {
    return $api<Client>(`/api/clientes/${id}`, {
      method: 'PUT',
      body: client,
    })
  }

  function deactivateClient(id: string) {
    return $api<void>(`/api/clientes/${id}`, {
      method: 'DELETE',
    })
  }

  return {
    getClients,
    getClient,
    createClient,
    updateClient,
    deactivateClient,
  }
}
