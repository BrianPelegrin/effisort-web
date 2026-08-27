<script setup lang="ts">
import {
  buildPaginationItems,
  normalizeCurrentPage,
  normalizeTotalPages,
} from '~/utils/pagination'

const props = withDefaults(defineProps<{
  currentPage: number
  totalPages: number
  disabled?: boolean
  ariaLabel?: string
}>(), {
  disabled: false,
  ariaLabel: 'Paginación',
})

const emit = defineEmits<{
  change: [page: number]
}>()

const normalizedTotalPages = computed(() => normalizeTotalPages(props.totalPages))
const normalizedCurrentPage = computed(() => normalizeCurrentPage(props.currentPage, normalizedTotalPages.value))
const pageItems = computed(() => buildPaginationItems(normalizedCurrentPage.value, normalizedTotalPages.value))

function changePage(page: number) {
  if (props.disabled || page === normalizedCurrentPage.value || page < 1 || page > normalizedTotalPages.value) return
  emit('change', page)
}
</script>

<template>
  <nav class="pagination-controls" :aria-label="ariaLabel">
    <span class="pagination-summary">Página <strong>{{ normalizedCurrentPage }}</strong> de <strong>{{ normalizedTotalPages }}</strong></span>

    <div class="pagination-buttons">
      <div class="btn-group btn-group-sm" role="group" :aria-label="ariaLabel">
        <button class="btn btn-outline-secondary" type="button" :disabled="disabled || normalizedCurrentPage === 1" aria-label="Página anterior" @click="changePage(normalizedCurrentPage - 1)">
          <i class="bi bi-chevron-left" aria-hidden="true" />
          <span class="d-none d-sm-inline ms-1">Anterior</span>
        </button>

        <template v-for="item in pageItems" :key="item">
          <button v-if="typeof item !== 'number'" class="btn btn-outline-secondary pagination-ellipsis" type="button" disabled aria-label="Más páginas">…</button>
          <button
            v-else
            class="btn"
            :class="item === normalizedCurrentPage ? 'btn-primary' : 'btn-outline-secondary'"
            type="button"
            :disabled="disabled"
            :aria-current="item === normalizedCurrentPage ? 'page' : undefined"
            :aria-label="`Ir a la página ${item}`"
            @click="changePage(item)"
          >
            {{ item }}
          </button>
        </template>

        <button
          class="btn btn-outline-secondary"
          type="button"
          :disabled="disabled || normalizedCurrentPage === normalizedTotalPages"
          aria-label="Página siguiente"
          @click="changePage(normalizedCurrentPage + 1)"
        >
          <span class="d-none d-sm-inline me-1">Siguiente</span>
          <i class="bi bi-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.pagination-controls { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #edf0f5; }
.pagination-summary { color: #667085; font-size: .84rem; }
.pagination-buttons { max-width: 100%; overflow-x: auto; padding-bottom: 2px; }
.pagination-buttons .btn { min-width: 2.25rem; white-space: nowrap; }
.pagination-buttons .pagination-ellipsis { background: var(--bs-tertiary-bg, #f8f9fa); color: var(--bs-secondary-color, #6c757d); opacity: 1; }
@media (max-width: 575.98px) { .pagination-controls { align-items: flex-start; flex-direction: column; }.pagination-buttons { width: 100%; } }
</style>
