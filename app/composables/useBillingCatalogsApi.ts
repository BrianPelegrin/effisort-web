import type { BillingIndicator } from '~/types/article'
import type { Currency, PaymentMethod, ReceiptType } from '~/types/billing'

export function useBillingCatalogsApi() {
  const { $api } = useNuxtApp()

  function getPaymentMethods() {
    return $api<PaymentMethod[]>('/api/formaspago')
  }

  function getCurrencies() {
    return $api<Currency[]>('/api/monedas')
  }

  function getReceiptTypes() {
    return $api<ReceiptType[]>('/api/tiposcomprobantes')
  }

  function getBillingIndicators() {
    return $api<BillingIndicator[]>('/api/indicadoresfacturacion')
  }

  return {
    getPaymentMethods,
    getCurrencies,
    getReceiptTypes,
    getBillingIndicators,
  }
}
