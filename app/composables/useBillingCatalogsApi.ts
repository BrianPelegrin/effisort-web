import type { BillingIndicator } from '~/types/article'
import type {
  Currency,
  IncomeType,
  PaymentMethod,
  PaymentTerm,
  PaymentType,
  ReceiptType,
} from '~/types/billing'

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

  function getIncomeTypes() {
    return $api<IncomeType[]>('/api/tiposingresos')
  }

  function getPaymentTypes() {
    return $api<PaymentType[]>('/api/tipospagos')
  }

  function getPaymentTerms() {
    return $api<PaymentTerm[]>('/api/terminospagos')
  }

  return {
    getPaymentMethods,
    getCurrencies,
    getReceiptTypes,
    getBillingIndicators,
    getIncomeTypes,
    getPaymentTypes,
    getPaymentTerms,
  }
}
