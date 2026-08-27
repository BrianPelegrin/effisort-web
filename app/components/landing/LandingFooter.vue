<template>
  <footer class="landing-footer">
    <div class="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
      <div class="footer-copyright">
        &copy; {{ currentYear }} Effisort. Todos los derechos reservados.
      </div>

      <div class="footer-links">
        <a href="#beneficios">Beneficios</a>
        <a href="#funcionalidades">Funcionalidades</a>
        <a href="#planes">Planes</a>
        <a href="#faq">FAQ</a>
        <NuxtLink to="/auth/login">Login</NuxtLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.landing-footer {
  padding: 1.75rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.09);
  color: rgba(255, 255, 255, 0.65);
  background: #021634;
}

.footer-copyright,
.footer-links {
  font-size: 0.8rem;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.2rem;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.68);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: #fff;
}
</style>
