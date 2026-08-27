import { describe, expect, it } from 'vitest'
import {
  buildPaginationItems,
  normalizeCurrentPage,
  normalizeTotalPages,
} from '~/utils/pagination'

describe('paginación estándar', () => {
  it('muestra la página uno aunque sólo exista una página', () => {
    expect(buildPaginationItems(1, 1)).toEqual([1])
  })

  it('muestra todas las páginas cuando son siete o menos', () => {
    expect(buildPaginationItems(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('usa elipsis alrededor de una página intermedia', () => {
    expect(buildPaginationItems(6, 12)).toEqual([1, 'start-ellipsis', 5, 6, 7, 'end-ellipsis', 12])
  })

  it('normaliza páginas y totales fuera de rango', () => {
    expect(normalizeTotalPages(0)).toBe(1)
    expect(normalizeCurrentPage(15, 4)).toBe(4)
    expect(normalizeCurrentPage(-2, 4)).toBe(1)
  })
})
