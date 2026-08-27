import type { Municipality, Province } from '~/types/location'

export function useLocationsApi() {
  const { $api } = useNuxtApp()

  async function getProvinces() {
    const response = await $api<unknown>('/api/provincias', { method: 'GET' })
    return normalizeProvincesResponse(response)
  }

  async function getMunicipalitiesByProvince(provinceCode: string) {
    const response = await $api<unknown>(`/api/municipios/provincia/${encodeURIComponent(provinceCode)}`, {
      method: 'GET',
    })
    return normalizeMunicipalitiesResponse(response)
  }

  return { getProvinces, getMunicipalitiesByProvince }
}

export function normalizeProvincesResponse(value: unknown) {
  return normalizeLocationList(value, item => normalizeProvince(item))
}

export function normalizeMunicipalitiesResponse(value: unknown) {
  return normalizeLocationList(value, normalizeMunicipality)
}

function normalizeLocationList<T>(value: unknown, normalizeItem: (item: unknown) => T | null) {
  const items = extractItems(value)
  const normalizedItems = items.map(normalizeItem).filter((item): item is T => item !== null)

  if (items.length && !normalizedItems.length) {
    throw new Error('La API devolvió un catálogo geográfico con un formato no compatible.')
  }

  return normalizedItems
}

function extractItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (!isRecord(value)) throw new Error('La API no devolvió un listado geográfico válido.')

  for (const key of ['items', 'Items', 'data', 'Data', 'value', 'Value', 'results', 'Results', '$values']) {
    if (Array.isArray(value[key])) return value[key]
  }

  throw new Error('La API no devolvió un listado geográfico válido.')
}

function normalizeProvince(value: unknown, cleanProvinceName = true): Province | null {
  if (!isRecord(value)) return null
  const codigo = readString(value, 'codigo', 'Codigo')
  const rawName = readString(value, 'nombre', 'Nombre')
  const nombre = cleanProvinceName ? normalizeProvinceName(rawName) : rawName
  if (!codigo || !nombre) return null

  return {
    id: readString(value, 'id', 'Id') || codigo,
    tenantId: readString(value, 'tenantId', 'TenantId'),
    codigo,
    nombre,
    activo: readBoolean(value, 'activo', 'Activo'),
  }
}

function normalizeProvinceName(value: string) {
  return value.replace(/\bPROVINCIA\b/gi, '').replace(/\s{2,}/g, ' ').trim()
}

function normalizeMunicipality(value: unknown): Municipality | null {
  const province = normalizeProvince(value, false)
  if (!province || !isRecord(value)) return null

  return {
    ...province,
    provinciaCodigo: readString(value, 'provinciaCodigo', 'ProvinciaCodigo'),
  }
}

function readString(value: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (typeof value[key] === 'string') return value[key].trim()
  }
  return ''
}

function readBoolean(value: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (typeof value[key] === 'boolean') return value[key]
  }
  return true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
