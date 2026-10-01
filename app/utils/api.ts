export type ApiQueryValue = string | number | boolean | null | undefined

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  query?: Record<string, ApiQueryValue>
  body?: unknown
  headers?: HeadersInit
  accept?: string
  timeoutMs?: number
  signal?: AbortSignal
  responseType?: 'auto' | 'blob'
  skipAuth?: boolean
}

export type ApiErrorCode = 'HTTP_ERROR' | 'TIMEOUT' | 'NETWORK_ERROR'

export class ApiError extends Error {
  readonly statusCode: number
  readonly data: unknown

  constructor(
    public readonly status: number,
    public readonly body: unknown,
    public readonly contentType: string,
    public readonly code: ApiErrorCode = 'HTTP_ERROR',
  ) {
    super(extractApiMessage(body, status, code))
    this.name = 'ApiError'
    this.statusCode = status
    this.data = body
  }
}

export interface ApiClientOptions {
  baseURL: string
  getToken?: () => string | null | undefined
  fetchImplementation?: typeof fetch
  onUnauthorized?: (request: string) => void | Promise<void>
  defaultTimeoutMs?: number
}

export function parseApiResponseBody(text: string, contentType: string): unknown {
  if (!text) return undefined

  if (contentType.toLowerCase().includes('json')) {
    try {
      return JSON.parse(text) as unknown
    } catch {
      return text
    }
  }

  return text
}

export function extractApiMessage(
  body: unknown,
  status = 0,
  code: ApiErrorCode = 'HTTP_ERROR',
) {
  if (code === 'TIMEOUT') return 'La solicitud tardó demasiado y su resultado no pudo confirmarse.'
  if (code === 'NETWORK_ERROR') return 'No fue posible conectar con el servidor.'
  if (typeof body === 'string' && body.trim()) return body.trim()

  if (isRecord(body)) {
    if (typeof body.detail === 'string' && body.detail.trim()) return body.detail
    if (isValidationErrors(body.errors)) {
      const messages = Object.values(body.errors).flat().filter(Boolean)
      if (messages.length) return messages.join(' ')
    }
    if (typeof body.title === 'string' && body.title.trim()) return body.title
    if (typeof body.message === 'string' && body.message.trim()) return body.message
    if (typeof body.mensaje === 'string' && body.mensaje.trim()) return body.mensaje
  }

  const statusMessages: Record<number, string> = {
    400: 'La solicitud contiene información inválida.',
    401: 'La sesión venció o no es válida.',
    403: 'No tienes permisos para realizar esta operación.',
    404: 'El recurso solicitado no está disponible.',
    409: 'La operación entra en conflicto con el estado actual del recurso.',
    415: 'El formato enviado no es compatible con este endpoint.',
    429: 'Se realizaron demasiadas solicitudes. Inténtalo nuevamente más tarde.',
    500: 'El servidor no pudo completar la operación.',
  }

  return statusMessages[status]
    ?? (status ? `No fue posible completar la operación (${status}).` : 'No fue posible completar la operación.')
}

export function isProblemDetails(value: unknown): value is {
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
} {
  if (!isRecord(value)) return false
  if (value.status !== undefined && typeof value.status !== 'number') return false
  if (value.title !== undefined && typeof value.title !== 'string') return false
  if (value.detail !== undefined && typeof value.detail !== 'string') return false
  if (value.errors !== undefined && !isValidationErrors(value.errors)) return false
  return true
}

export function createApiClient(options: ApiClientOptions) {
  const fetchImplementation = options.fetchImplementation ?? fetch
  const defaultTimeoutMs = options.defaultTimeoutMs ?? 30_000

  return async function apiRequest<T>(request: string, requestOptions: ApiRequestOptions = {}) {
    const url = createApiUrl(options.baseURL, request, requestOptions.query)
    const headers = createApiHeaders(
      requestOptions.headers,
      requestOptions.skipAuth ? undefined : options.getToken?.(),
      requestOptions.body,
      requestOptions.accept,
    )
    const controller = new AbortController()
    const timeoutMs = requestOptions.timeoutMs ?? defaultTimeoutMs
    let didTimeout = false
    let removeExternalAbortListener: (() => void) | undefined

    if (requestOptions.signal) {
      const abortFromExternalSignal = () => controller.abort(requestOptions.signal?.reason)
      requestOptions.signal.addEventListener('abort', abortFromExternalSignal, { once: true })
      removeExternalAbortListener = () => requestOptions.signal?.removeEventListener('abort', abortFromExternalSignal)
    }

    const timeout = setTimeout(() => {
      didTimeout = true
      controller.abort()
    }, timeoutMs)

    try {
      const response = await fetchImplementation(url, {
        method: requestOptions.method ?? 'GET',
        headers,
        body: serializeRequestBody(requestOptions.body),
        signal: controller.signal,
      })

      const contentType = response.headers.get('content-type') ?? ''
      const body = response.ok && requestOptions.responseType === 'blob'
        ? await response.blob()
        : parseApiResponseBody(await response.text(), contentType)

      if (!response.ok) {
        if (response.status === 401 && !requestOptions.skipAuth) await options.onUnauthorized?.(request)
        throw new ApiError(response.status, body, contentType)
      }

      return body as T
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (didTimeout) throw new ApiError(0, undefined, '', 'TIMEOUT')
      throw new ApiError(0, error instanceof Error ? error.message : undefined, '', 'NETWORK_ERROR')
    } finally {
      clearTimeout(timeout)
      removeExternalAbortListener?.()
    }
  }
}

export function createApiHeaders(
  initialHeaders: HeadersInit | undefined,
  token: string | null | undefined,
  body: unknown,
  accept = 'application/json',
) {
  const headers = new Headers(initialHeaders)
  if (!headers.has('Accept')) headers.set('Accept', accept)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  if (body !== undefined && body !== null && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return headers
}

function createApiUrl(baseURL: string, request: string, query?: Record<string, ApiQueryValue>) {
  const normalizedBase = baseURL.endsWith('/') ? baseURL : `${baseURL}/`
  const normalizedRequest = request.startsWith('/') ? request.slice(1) : request
  const url = new URL(normalizedRequest, normalizedBase)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

function serializeRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined
  if (body instanceof FormData || body instanceof Blob || typeof body === 'string') return body
  return JSON.stringify(body)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidationErrors(value: unknown): value is Record<string, string[]> {
  if (!isRecord(value)) return false
  return Object.values(value).every(messages => Array.isArray(messages) && messages.every(message => typeof message === 'string'))
}
