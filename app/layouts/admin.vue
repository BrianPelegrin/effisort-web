<template>
<div class="wrapper admin-shell" :class="{ sidebar_minimize: isSidebarCollapsed, nav_open: isMobileSidebarOpen }">
      <!-- Sidebar -->
      <AdminSidebar @toggle="toggleSidebar" @navigate="closeMobileSidebar" />
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
            <NuxtPage />
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
const mobileSidebarQuery = '(max-width: 991.5px)'

function isMobileViewport() {
  return import.meta.client && window.matchMedia(mobileSidebarQuery).matches
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

function syncSidebarForViewport() {
  if (!isMobileViewport()) closeMobileSidebar()
}

onMounted(() => window.addEventListener('resize', syncSidebarForViewport))
onBeforeUnmount(() => window.removeEventListener('resize', syncSidebarForViewport))

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

@media screen and (max-width: 991.5px) {
  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 1000;
    border: 0;
    background: rgba(15, 23, 42, 0.45);
  }
}
</style>
