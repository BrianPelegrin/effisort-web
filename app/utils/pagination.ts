export type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis'

export function normalizeTotalPages(value: number) {
  return Math.max(1, Math.trunc(Number(value) || 1))
}

export function normalizeCurrentPage(currentPage: number, totalPages: number) {
  return Math.min(Math.max(1, Math.trunc(Number(currentPage) || 1)), normalizeTotalPages(totalPages))
}

export function buildPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  const total = normalizeTotalPages(totalPages)
  const current = normalizeCurrentPage(currentPage, total)

  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, 'end-ellipsis', total]
  if (current >= total - 3) return [1, 'start-ellipsis', total - 4, total - 3, total - 2, total - 1, total]
  return [1, 'start-ellipsis', current - 1, current, current + 1, 'end-ellipsis', total]
}
