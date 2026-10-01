<script setup lang="ts">
const emit = defineEmits<{
  'toggle-sidebar': []
}>()
</script>

<template>
  <header class="admin-mobile-bar">
    <button
      type="button"
      class="mobile-menu-button"
      aria-label="Abrir menú principal"
      @click="emit('toggle-sidebar')"
    >
      <i class="bi bi-list" aria-hidden="true" />
    </button>

    <NuxtLink to="/admin" class="mobile-brand" aria-label="Ir al inicio de Effisort">
      <span class="mobile-brand-icon" aria-hidden="true"><i class="bi bi-receipt-cutoff" /></span>
      <strong>Effisort</strong>
    </NuxtLink>

    <span class="mobile-bar-spacer" aria-hidden="true" />
  </header>
</template>

<style scoped>
.admin-mobile-bar {
  display: none;
}

@media (max-width: 1199.98px) {
  .admin-mobile-bar {
    position: fixed;
    inset: 0 0 auto 0;
    z-index: 1080;
    display: grid;
    height: 70px;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    padding: 0 1rem;
    border-bottom: 1px solid #e7ebf2;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 4px 18px rgba(28, 43, 70, 0.055);
    backdrop-filter: blur(14px);
  }

  .mobile-menu-button {
    display: grid;
    width: 42px;
    height: 42px;
    padding: 0;
    place-items: center;
    border: 1px solid #e1e6ef;
    border-radius: 12px;
    background: #f7f9fc;
    color: #263955;
    font-size: 1.45rem;
    cursor: pointer;
  }

  .mobile-menu-button:hover {
    background: #eef3fb;
  }

  .mobile-menu-button:focus-visible,
  .mobile-brand:focus-visible {
    outline: 3px solid rgba(55, 111, 226, 0.32) !important;
    outline-offset: 2px;
  }

  .mobile-brand {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    color: #17243a;
    text-decoration: none;
  }

  .mobile-brand:hover {
    color: #17243a;
  }

  .mobile-brand-icon {
    display: grid;
    width: 30px;
    height: 30px;
    place-items: center;
    border-radius: 9px;
    background: linear-gradient(145deg, #3b76ed, #245ac7);
    color: #fff;
    font-size: 0.85rem;
  }

  .mobile-brand strong {
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: -0.025em;
  }

  .mobile-bar-spacer {
    width: 42px;
  }
}
</style>
