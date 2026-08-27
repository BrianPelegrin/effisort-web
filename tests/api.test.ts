import { describe, expect, it, vi } from 'vitest'
import { validateLoginResponse, validateUserProfile } from '~/utils/auth'
import {
  ApiError,
  createApiClient,
  createApiHeaders,
  extractApiMessage,
  isProblemDetails,
  parseApiResponseBody,
} from '~/utils/api'

describe('autenticación', () => {
  it('acepta un login correcto', () => {
    expect(validateLoginResponse({ token: 'jwt-token' })).toEqual({ token: 'jwt-token' })
  })

  it('rechaza un login sin token', () => {
    expect(() => validateLoginResponse({ message: 'ok' })).toThrow(/sesión válida/i)
  })

  it('conserva el 401 de un login incorrecto', async () => {
    const api = createApiClient({
      baseURL: 'https://api.example.test',
      fetchImplementation: vi.fn(async () => new Response('Credenciales inválidas', { status: 401 })),
    })

    await expect(api('/api/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 401,
      message: 'Credenciales inválidas',
    })
  })

  it('valida el perfil autenticado con propiedades opcionales nulas', () => {
    const profile = validateUserProfile({
      id: 'user-1',
      userName: null,
      email: 'admin@empresa.test',
      phoneNumber: null,
      empresa: {
        tenantId: 'tenant-1',
        nombreRazonSocial: 'EMPRESA EJEMPLO SRL',
        nombreComercial: null,
        sucursal: null,
        rnc: '101234567',
        direccion: 'AV. EJEMPLO 123',
        telefono: null,
        telefono2: null,
        municipioId: null,
        provinciaId: null,
        correo: null,
        webSite: null,
        actividadEconomica: null,
      },
    })

    expect(profile.empresa.tenantId).toBe('tenant-1')
    expect(profile.userName).toBeNull()
  })

  it('rechaza un perfil sin tenant de empresa', () => {
    expect(() => validateUserProfile({ id: 'user-1', empresa: { tenantId: '' } })).toThrow(/tenant válido/i)
  })

  it('conserva el mensaje JSON de un perfil no configurado', async () => {
    const api = createApiClient({
      baseURL: 'https://api.example.test',
      getToken: () => 'jwt-token',
      fetchImplementation: vi.fn(async (_url, init) => {
        expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer jwt-token')
        return new Response(JSON.stringify({ mensaje: 'Empresa no encontrado' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        })
      }),
    })

    await expect(api('/api/auth/perfil')).rejects.toMatchObject({
      status: 404,
      message: 'Empresa no encontrado',
    })
  })

  it('notifica el 401 recibido al cargar el perfil', async () => {
    const onUnauthorized = vi.fn()
    const api = createApiClient({
      baseURL: 'https://api.example.test',
      getToken: () => 'jwt-token',
      onUnauthorized,
      fetchImplementation: vi.fn(async () => new Response(
        JSON.stringify({ mensaje: 'Usuario no autenticado' }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      )),
    })

    await expect(api('/api/auth/perfil')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledOnce()
    expect(onUnauthorized).toHaveBeenCalledWith('/api/auth/perfil')
  })
})

describe('cliente HTTP multiformato', () => {
  it('inyecta el Bearer y los encabezados JSON', () => {
    const headers = createApiHeaders(undefined, 'abc.123', { hello: 'world' })
    expect(headers.get('Authorization')).toBe('Bearer abc.123')
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it.each([
    ['JSON', '{"ok":true}', 'application/json', { ok: true }],
    ['XML', '<ARECF><Estado>1</Estado></ARECF>', 'application/xml', '<ARECF><Estado>1</Estado></ARECF>'],
    ['texto', 'procesado', 'text/plain', 'procesado'],
    ['Base64', 'JVBERi0xLjQ=', 'text/plain', 'JVBERi0xLjQ='],
    ['vacío', '', 'application/json', undefined],
  ])('procesa una respuesta %s', (_name, body, contentType, expected) => {
    expect(parseApiResponseBody(body, contentType)).toEqual(expected)
  })

  it('reconoce ProblemDetails y ValidationProblemDetails', () => {
    expect(isProblemDetails({ title: 'Bad Request', status: 400 })).toBe(true)
    const validation = { title: 'Validation failed', status: 400, errors: { Email: ['Es requerido.'] } }
    expect(isProblemDetails(validation)).toBe(true)
    expect(extractApiMessage(validation, 400)).toBe('Es requerido.')
    expect(isProblemDetails({ status: '400' })).toBe(false)
  })

  it('aborta por timeout sin reintentar', async () => {
    const fetchImplementation = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
    }))
    const api = createApiClient({
      baseURL: 'https://api.example.test',
      fetchImplementation,
      defaultTimeoutMs: 5,
    })

    await expect(api('/api/ecf/documentofiscal')).rejects.toMatchObject<ApiError>({ code: 'TIMEOUT' })
    expect(fetchImplementation).toHaveBeenCalledTimes(1)
  })

  it('conserva los bytes de una descarga PDF como Blob', async () => {
    const api = createApiClient({
      baseURL: 'https://api.example.test',
      fetchImplementation: vi.fn(async () => new Response(new Uint8Array([37, 80, 68, 70]), {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      })),
    })

    const pdf = await api<Blob>('/api/ecf/downloads/E310000000001', {
      accept: 'application/pdf',
      responseType: 'blob',
    })

    expect(pdf).toBeInstanceOf(Blob)
    expect(pdf.type).toBe('application/pdf')
    expect(new TextDecoder().decode(await pdf.arrayBuffer())).toBe('%PDF')
  })
})
