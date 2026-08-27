import type { EcfApiResult, EcfRequest } from '~/types/ecf'
import {
  createSubmissionLock,
  mapFacturacionResponse,
  validateFacturacionApiResponse,
} from '~/utils/ecf'

export function useEcfApi() {
  const { $api } = useNuxtApp()
  const emissionLock = createSubmissionLock()
  const submitting = ref(false)

  async function emitInvoice(payload: EcfRequest): Promise<EcfApiResult> {
    return emissionLock.run(async () => {
      submitting.value = true
      try {
        const response = await $api<unknown>('/api/ecf/documentofiscal', {
          method: 'POST',
          body: payload,
          accept: 'application/json',
          timeoutMs: 120_000,
        })

        return mapFacturacionResponse(validateFacturacionApiResponse(response))
      } finally {
        submitting.value = false
      }
    })
  }

  async function downloadPdf(encf: string) {
    const pdf = await $api<Blob>(`/api/ecf/downloads/${encodeURIComponent(encf)}`, {
      method: 'GET',
      accept: 'application/pdf',
      responseType: 'blob',
      timeoutMs: 60_000,
    })

    if (!(pdf instanceof Blob) || !pdf.type.toLowerCase().includes('application/pdf')) {
      throw new Error('La API no devolvió un archivo PDF válido.')
    }

    return pdf
  }

  return { emitInvoice, downloadPdf, submitting }
}
