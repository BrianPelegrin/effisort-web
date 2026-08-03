import type {
  Article,
  ArticleWrite,
  BillingIndicator,
  MeasurementUnit,
} from '~/types/article'

export function useArticlesApi() {
  const { $api } = useNuxtApp()
  const auth = useAuthStore()

  async function ensureSession() {
    if (auth.isAuthenticated) return

    auth.clearSession()
    await navigateTo('/auth/login')
    throw createError({
      statusCode: 401,
      statusMessage: 'La sesión venció o dejó de ser válida.',
    })
  }

  async function getArticles(includeInactive = false) {
    await ensureSession()
    return $api<Article[]>('/api/articulos', {
      method: 'GET',
      query: { incluirInactivos: includeInactive },
    })
  }

  function getArticle(id: string) {
    return $api<Article>(`/api/articulos/${id}`, { method: 'GET' })
  }

  function createArticle(article: ArticleWrite) {
    return $api<Article>('/api/articulos', { method: 'POST', body: article })
  }

  function updateArticle(id: string, article: ArticleWrite) {
    return $api<Article>(`/api/articulos/${id}`, { method: 'PUT', body: article })
  }

  function deactivateArticle(id: string) {
    return $api<void>(`/api/articulos/${id}`, { method: 'DELETE' })
  }

  async function getArticleCatalogs() {
    const [billingIndicators, measurementUnits] = await Promise.all([
      $api<BillingIndicator[]>('/api/indicadoresfacturacion'),
      $api<MeasurementUnit[]>('/api/medidas'),
    ])

    return { billingIndicators, measurementUnits }
  }

  return {
    getArticles,
    getArticle,
    createArticle,
    updateArticle,
    deactivateArticle,
    getArticleCatalogs,
  }
}
