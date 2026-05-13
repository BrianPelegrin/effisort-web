<template>
  <footer class="py-4 border-top bg-white">
    <div class="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
      <div class="text-muted small">
        © {{ currentYear }} Effisort. Todos los derechos reservados.
      </div>

      <div class="d-flex gap-3 small">
        <a href="#beneficios" class="text-decoration-none text-muted">Beneficios</a>
        <a href="#planes" class="text-decoration-none text-muted">Planes</a>
        <a href="#faq" class="text-decoration-none text-muted">FAQ</a>
        <NuxtLink to="/auth/login" class="text-decoration-none text-primary fw-semibold">Login</NuxtLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>