<script setup lang="ts">
import AdminNavbar from '~/components/layout/AdminNavbar.vue'
import AdminSidebar from '~/components/layout/AdminSidebar.vue'

const SIDEBAR_PREFERENCE_KEY = 'effisort-sidebar-collapsed'
const MOBILE_SIDEBAR_QUERY = '(max-width: 1199.98px)'

const isSidebarCollapsed = ref(false)
const isMobileSidebarOpen = ref(false)
let mobileSidebarMedia: MediaQueryList | null = null

function isMobileViewport() {
  return import.meta.client && (mobileSidebarMedia?.matches ?? window.matchMedia(MOBILE_SIDEBAR_QUERY).matches)
}

function toggleSidebar() {
  if (isMobileViewport()) {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
    return
  }

  isSidebarCollapsed.value = !isSidebarCollapsed.value
  localStorage.setItem(SIDEBAR_PREFERENCE_KEY, String(isSidebarCollapsed.value))
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false
}

function syncSidebarForViewport(event?: MediaQueryListEvent) {
  const isMobile = event?.matches ?? isMobileViewport()

  if (isMobile) {
    isMobileSidebarOpen.value = false
    return
  }

  closeMobileSidebar()
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && isMobileSidebarOpen.value) closeMobileSidebar()
}

watch(isMobileSidebarOpen, (isOpen) => {
  if (!import.meta.client) return
  document.body.classList.toggle('admin-sidebar-open', isOpen)
  document.documentElement.classList.toggle('admin-sidebar-open', isOpen)
})

onMounted(() => {
  mobileSidebarMedia = window.matchMedia(MOBILE_SIDEBAR_QUERY)
  isSidebarCollapsed.value = localStorage.getItem(SIDEBAR_PREFERENCE_KEY) === 'true'
  syncSidebarForViewport()
  mobileSidebarMedia.addEventListener('change', syncSidebarForViewport)
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  mobileSidebarMedia?.removeEventListener('change', syncSidebarForViewport)
  window.removeEventListener('keydown', handleEscape)
  document.body.classList.remove('admin-sidebar-open')
  document.documentElement.classList.remove('admin-sidebar-open')
})

useHead({
  script: [
    { src: '/assets/js/core/jquery-3.7.1.min.js', tagPosition: 'bodyClose' },
    { src: '/assets/js/core/popper.min.js', tagPosition: 'bodyClose' },
    { src: '/assets/js/core/bootstrap.min.js', tagPosition: 'bodyClose' },
    { src: '/assets/js/plugin/jquery-scrollbar/jquery.scrollbar.min.js', tagPosition: 'bodyClose' },
    { src: '/assets/js/plugin/chart.js/chart.min.js', tagPosition: 'bodyClose' },
    { src: '/assets/js/plugin/jquery.sparkline/jquery.sparkline.min.js', tagPosition: 'bodyClose' },
    { src: '/assets/js/plugin/chart-circle/circles.min.js', tagPosition: 'bodyClose' },
    { src: '/assets/js/plugin/datatables/datatables.min.js', tagPosition: 'bodyClose' },
    { src: '/assets/js/plugin/bootstrap-notify/bootstrap-notify.min.js', tagPosition: 'bodyClose' },
    { src: '/assets/js/plugin/jsvectormap/jsvectormap.min.js', tagPosition: 'bodyClose' },
    { src: '/assets/js/plugin/jsvectormap/world.js', tagPosition: 'bodyClose' },
    { src: '/assets/js/plugin/sweetalert/sweetalert.min.js', tagPosition: 'bodyClose' },
  ],
})
</script>

<template>
  <div
    class="admin-shell"
    :class="{
      'is-sidebar-collapsed': isSidebarCollapsed,
      'is-mobile-sidebar-open': isMobileSidebarOpen,
    }"
  >
    <AdminSidebar
      :collapsed="isSidebarCollapsed"
      @toggle="toggleSidebar"
      @navigate="closeMobileSidebar"
    />

    <button
      v-if="isMobileSidebarOpen"
      type="button"
      class="sidebar-backdrop"
      aria-label="Cerrar menú lateral"
      @click="closeMobileSidebar"
    />

    <div class="admin-content">
      <AdminNavbar @toggle-sidebar="toggleSidebar" />
      <div class="admin-page-container">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: grid;
  width: 100%;
  max-width: 100%;
  min-height: 100dvh;
  grid-template-columns: 280px minmax(0, 1fr);
  background: #f6f8fc;
  overflow-x: hidden;
  overflow-x: clip;
  transition: grid-template-columns 0.25s ease;
}

.admin-content {
  width: 100%;
  min-width: 0;
  min-height: 100dvh;
}

.admin-page-container {
  width: 100%;
  max-width: 100%;
  min-height: 100dvh;
  min-width: 0;
  padding: clamp(1rem, 2vw, 1.5rem);
  overflow-x: hidden;
}

.admin-shell.is-sidebar-collapsed {
  grid-template-columns: 88px minmax(0, 1fr);
}

.admin-page-container :deep(.simple-dashboard),
.admin-page-container :deep(.invoice-page),
.admin-page-container :deep(.billing-page),
.admin-page-container :deep(.credit-notes-page),
.admin-page-container :deep(.credit-note-page),
.admin-page-container :deep(.invoice-detail-page) {
  min-width: 0;
  min-height: calc(100dvh - 3rem);
  padding: 0;
}

.admin-page-container :deep(.clients-page),
.admin-page-container :deep(.inventory-page),
.admin-page-container :deep(.table-responsive),
.admin-page-container :deep(.table-shell),
.admin-page-container :deep(.item-table-shell),
.admin-page-container :deep(.source-table) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.admin-page-container :deep(.table-responsive),
.admin-page-container :deep(.table-shell),
.admin-page-container :deep(.item-table-shell),
.admin-page-container :deep(.source-table) {
  overflow-x: auto;
}

.admin-page-container :deep(.row > *) {
  min-width: 0;
}

.sidebar-backdrop {
  display: none;
}

@media (max-width: 1199.98px) {
  .admin-shell,
  .admin-shell.is-sidebar-collapsed {
    display: block;
  }

  .admin-page-container {
    padding: calc(70px + 1rem) 1rem 1rem;
  }

  .admin-page-container :deep(.simple-dashboard),
  .admin-page-container :deep(.invoice-page),
  .admin-page-container :deep(.billing-page),
  .admin-page-container :deep(.credit-notes-page),
  .admin-page-container :deep(.credit-note-page),
  .admin-page-container :deep(.invoice-detail-page) {
    min-height: calc(100dvh - 86px);
  }

  .admin-shell.is-mobile-sidebar-open :deep(.effi-sidebar) {
    transform: translate3d(0, 0, 0);
  }

  .admin-shell.is-mobile-sidebar-open {
    height: 100dvh;
    max-height: 100dvh;
    overflow: hidden;
    overscroll-behavior: none;
  }

  .admin-shell.is-mobile-sidebar-open .admin-content {
    height: 100dvh;
    overflow: hidden;
  }

  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1090;
    display: block;
    width: 100%;
    height: 100dvh;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: rgba(10, 19, 35, 0.5);
    cursor: pointer;
    appearance: none;
    backdrop-filter: blur(2px);
    overscroll-behavior: none;
    touch-action: none;
  }
}

:global(html.admin-sidebar-open),
:global(body.admin-sidebar-open) {
  width: 100%;
  height: 100%;
  overflow: hidden !important;
  overscroll-behavior: none;
}

:global(.modal-backdrop) {
  z-index: 1300 !important;
}

:global(.modal) {
  z-index: 1310 !important;
}

@media (max-width: 767.98px) {
  :global(html),
  :global(body),
  :global(#__nuxt) {
    max-width: 100%;
    overflow-x: hidden;
    overflow-x: clip;
  }

  :global(.modal) {
    inset: 0 !important;
    box-sizing: border-box;
    width: auto !important;
    max-width: none;
    padding: 0.5rem !important;
    overflow-x: hidden;
    overscroll-behavior: contain;
  }

  :global(.modal-dialog) {
    box-sizing: border-box;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 auto;
  }

  :global(.modal-dialog-centered) {
    min-height: calc(100svh - 1rem);
    align-items: flex-start;
  }

  :global(.modal-dialog-scrollable) {
    height: calc(100svh - 1rem);
  }

  :global(.modal-dialog-scrollable .modal-content) {
    max-height: calc(100svh - 1rem);
  }

  :global(.modal-content) {
    box-sizing: border-box;
    max-width: 100%;
    min-width: 0;
    overflow-x: hidden;
  }

  :global(.modal-body) {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: hidden;
    overflow-wrap: anywhere;
  }

  :global(.modal-header > :first-child) {
    min-width: 0;
  }

  :global(.modal-header h1),
  :global(.modal-header h2),
  :global(.modal-header h3),
  :global(.modal-header p) {
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  :global(.modal-footer) {
    flex-wrap: wrap;
  }

  :global(.modal-body .table-responsive),
  :global(.modal-body .item-table-shell),
  :global(.modal-body .source-table) {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
  }

  :global(.modal-body .row > *),
  :global(.modal-body .input-group),
  :global(.modal-body .form-control),
  :global(.modal-body .form-select) {
    max-width: 100%;
    min-width: 0;
  }

  :global(body.modal-open) {
    width: auto !important;
    max-width: 100%;
    padding-right: 0 !important;
    overflow-x: hidden !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-shell {
    transition: none;
  }
}
</style>
