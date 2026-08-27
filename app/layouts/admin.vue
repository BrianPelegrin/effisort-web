<template>
    <div
      class="wrapper admin-shell"
      :class="{ sidebar_minimize: isSidebarCollapsed, mobile_sidebar_open: isMobileSidebarOpen }"
    >
      <!-- Sidebar -->
      <AdminSidebar
        :collapsed="isSidebarCollapsed"
        @toggle="toggleSidebar"
        @navigate="closeMobileSidebar"
      />
      <!-- End Sidebar -->

      <button
        v-if="isMobileSidebarOpen"
        type="button"
        class="sidebar-backdrop"
        aria-label="Cerrar menú lateral"
        @click="closeMobileSidebar"
      ></button>

      <div class="main-panel">
        <AdminNavbar @toggle-sidebar="toggleSidebar" />

        <div class="container">
          <div class="page-inner">
            <slot />
          </div>
        </div>

        <!-- <footer class="footer">
          <div class="container-fluid d-flex justify-content-between">
            <nav class="pull-left">
              <ul class="nav">
                <li class="nav-item">
                  <a class="nav-link" href="http://www.themekita.com">
                    ThemeKita
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#"> Help </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#"> Licenses </a>
                </li>
              </ul>
            </nav>
            <div class="copyright">
              2024, made with <i class="fa fa-heart heart text-danger"></i> by
              <a href="http://www.themekita.com">ThemeKita</a>
            </div>
            <div>
              Distributed by
              <a target="_blank" href="https://themewagon.com/">ThemeWagon</a>.
            </div>
          </div>
        </footer> -->
      </div>


    </div>
</template>

<script setup lang="ts">
import AdminNavbar from '~/components/layout/AdminNavbar.vue';
import AdminSidebar from '~/components/layout/AdminSidebar.vue';

const isSidebarCollapsed = ref(false)
const isMobileSidebarOpen = ref(false)
const mobileSidebarQuery = '(max-width: 991.98px)'
let mobileSidebarMedia: MediaQueryList | null = null

function isMobileViewport() {
  return import.meta.client && (mobileSidebarMedia?.matches ?? window.matchMedia(mobileSidebarQuery).matches)
}

function toggleSidebar() {
  if (isMobileViewport()) {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
    return
  }

  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false
}

function syncSidebarForViewport(event?: MediaQueryListEvent) {
  const isMobile = event?.matches ?? isMobileViewport()
  if (isMobile) {
    isSidebarCollapsed.value = false
    return
  }

  closeMobileSidebar()
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMobileSidebar()
}

watch(isMobileSidebarOpen, (isOpen) => {
  if (!import.meta.client) return
  document.body.classList.toggle('admin-sidebar-open', isOpen)
})

onMounted(() => {
  mobileSidebarMedia = window.matchMedia(mobileSidebarQuery)
  syncSidebarForViewport()
  mobileSidebarMedia.addEventListener('change', syncSidebarForViewport)
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  mobileSidebarMedia?.removeEventListener('change', syncSidebarForViewport)
  window.removeEventListener('keydown', handleEscape)
  document.body.classList.remove('admin-sidebar-open')
})

useHead({
  // tagPosition: 'bodyClose' = al final del body (equivalente a tu index.html)
  script: [
    { src: "/assets/js/core/jquery-3.7.1.min.js", tagPosition: "bodyClose" },
    { src: "/assets/js/core/popper.min.js", tagPosition: "bodyClose" },
    { src: "/assets/js/core/bootstrap.min.js", tagPosition: "bodyClose" },

    { src: "/assets/js/plugin/jquery-scrollbar/jquery.scrollbar.min.js", tagPosition: "bodyClose" },
    { src: "/assets/js/plugin/chart.js/chart.min.js", tagPosition: "bodyClose" },
    { src: "/assets/js/plugin/jquery.sparkline/jquery.sparkline.min.js", tagPosition: "bodyClose" },
    { src: "/assets/js/plugin/chart-circle/circles.min.js", tagPosition: "bodyClose" },
    { src: "/assets/js/plugin/datatables/datatables.min.js", tagPosition: "bodyClose" },
    { src: "/assets/js/plugin/bootstrap-notify/bootstrap-notify.min.js", tagPosition: "bodyClose" },
    { src: "/assets/js/plugin/jsvectormap/jsvectormap.min.js", tagPosition: "bodyClose" },
    { src: "/assets/js/plugin/jsvectormap/world.js", tagPosition: "bodyClose" },
    { src: "/assets/js/plugin/sweetalert/sweetalert.min.js", tagPosition: "bodyClose" },
  ],
})
</script>

<style scoped>
.sidebar-backdrop {
  display: none;
}

@media screen and (max-width: 991.98px) {
  .admin-shell {
    width: 100%;
    min-height: 100dvh;
    height: auto;
    overflow-x: hidden;
  }

  .admin-shell :deep(.sidebar) {
    top: 0;
    right: auto !important;
    bottom: 0;
    left: 0 !important;
    width: min(265px, calc(100vw - 48px));
    height: 100dvh;
    margin: 0;
    z-index: 1060;
    background-color: #1a2035;
    transform: translate3d(-100%, 0, 0) !important;
    transition: transform 0.3s ease;
  }

  .admin-shell.mobile_sidebar_open :deep(.sidebar) {
    transform: translate3d(0, 0, 0) !important;
  }

  .admin-shell .main-panel {
    position: relative;
    width: 100% !important;
    min-height: 100dvh;
    height: auto;
    margin: 0;
    opacity: 1;
    visibility: visible;
    transform: none !important;
  }

  .admin-shell .main-header {
    top: 0;
    right: 0;
    left: 0;
    width: 100% !important;
  }

  .admin-shell .main-panel > .container {
    margin-top: 0 !important;
    padding-top: 70px !important;
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    z-index: 1050;
    padding: 0;
    border: 0;
    border-radius: 0;
    background-color: rgba(15, 23, 42, 0.45);
    appearance: none;
  }
}

:global(body.admin-sidebar-open) {
  overflow: hidden;
}
</style>
