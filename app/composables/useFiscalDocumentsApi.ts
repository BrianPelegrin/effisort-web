import type { FiscalDocumentSearchParams } from '~/types/ecf'
import { createFiscalDocumentSearchQuery, validateFiscalDocumentSearchResponse } from '~/utils/fiscal-documents'

export function useFiscalDocumentsApi() {
  const { $api } = useNuxtApp()

  async function searchDocuments(params: FiscalDocumentSearchParams = {}) {
    const response = await $api<unknown>('/api/documentosfiscales/search', {
      method: 'GET',
      query: createFiscalDocumentSearchQuery(params),
    })
    return validateFiscalDocumentSearchResponse(response)
  }

  async function searchAllDocuments(params: FiscalDocumentSearchParams = {}) {
    const pageSize = 25
    const firstPage = await searchDocuments({ ...params, pageNumber: 1, pageSize })
    const documentsById = new Map(firstPage.items.map(document => [document.id, document]))

    for (let pageNumber = 2; pageNumber <= firstPage.totalPages; pageNumber += 1) {
      const page = await searchDocuments({ ...params, pageNumber, pageSize })
      page.items.forEach(document => documentsById.set(document.id, document))
    }

    return [...documentsById.values()]
  }

  return { searchDocuments, searchAllDocuments }
}
