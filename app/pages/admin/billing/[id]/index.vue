<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <main class="invoice-detail-page">
    <section class="effi-card unavailable-card">
      <span class="state-icon"><i class="bi bi-shield-lock" aria-hidden="true" /></span>
      <div>
        <span class="eyebrow">Documento fiscal {{ route.params.id }}</span>
        <h1>Detalle no disponible de forma segura</h1>
        <p>
          La consulta individual actual del backend no aplica automáticamente el tenant del JWT.
          Para evitar mostrar información de otra empresa, este frontend no expone esa operación.
        </p>
        <NuxtLink to="/admin/billing" class="btn btn-primary">
          <i class="bi bi-arrow-left me-2" aria-hidden="true" />Volver a la bandeja fiscal
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.invoice-detail-page{display:grid;min-height:70vh;padding:1.5rem;background:#f5f7fb;place-items:center}.effi-card{width:min(720px,100%);padding:2rem;border:1px solid #e5eaf2;border-radius:18px;background:#fff}.unavailable-card{display:flex;align-items:flex-start;gap:1.25rem}.state-icon{display:grid;width:52px;height:52px;flex:0 0 52px;border-radius:15px;color:#0d6efd;background:#eef5ff;font-size:1.4rem;place-items:center}.eyebrow{color:#0d6efd;font-size:.76rem;font-weight:700;text-transform:uppercase}.unavailable-card h1{margin:.4rem 0 .8rem;color:#101828;font-size:1.5rem}.unavailable-card p{margin:0 0 1.25rem;color:#667085;line-height:1.65}@media(max-width:575.98px){.invoice-detail-page{padding:1rem}.unavailable-card{flex-direction:column}}
</style>
