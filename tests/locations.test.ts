import { describe, expect, it } from 'vitest'
import {
  normalizeMunicipalitiesResponse,
  normalizeProvincesResponse,
} from '~/composables/useLocationsApi'

describe('catálogos geográficos', () => {
  it('normaliza un arreglo directo en camelCase', () => {
    expect(normalizeProvincesResponse([
      {
        id: 'province-1',
        tenantId: 'tenant-1',
        codigo: '010000',
        nombre: 'Distrito Nacional',
        activo: true,
      },
    ])).toEqual([
      {
        id: 'province-1',
        tenantId: 'tenant-1',
        codigo: '010000',
        nombre: 'Distrito Nacional',
        activo: true,
      },
    ])
  })

  it('normaliza una respuesta envuelta con propiedades PascalCase', () => {
    expect(normalizeProvincesResponse({
      Items: [
        {
          Id: 'province-1',
          TenantId: 'tenant-1',
          Codigo: '020000',
          Nombre: 'Azua',
          Activo: true,
        },
      ],
    })).toMatchObject([
      {
        id: 'province-1',
        codigo: '020000',
        nombre: 'Azua',
        activo: true,
      },
    ])
  })

  it('elimina la palabra provincia del nombre recibido', () => {
    expect(normalizeProvincesResponse([
      {
        Id: 'province-1',
        Codigo: '020000',
        Nombre: 'PROVINCIA  AZUA',
        Activo: true,
      },
    ])[0]?.nombre).toBe('AZUA')
  })

  it('normaliza los municipios y conserva el código de provincia', () => {
    expect(normalizeMunicipalitiesResponse({
      $values: [
        {
          Id: 'municipality-1',
          Codigo: '010100',
          Nombre: 'Santo Domingo de Guzmán',
          ProvinciaCodigo: '010000',
          Activo: true,
        },
      ],
    })[0]).toMatchObject({
      codigo: '010100',
      provinciaCodigo: '010000',
    })
  })

  it('rechaza un formato no compatible en lugar de dejar el selector vacío silenciosamente', () => {
    expect(() => normalizeProvincesResponse({ records: [] })).toThrow(/listado geográfico válido/i)
  })
})
