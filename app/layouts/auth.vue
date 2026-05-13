<script setup lang="ts">
useHead({
  title: "Effisort - Login",
})
</script>

<template>
  <div class="container-fluid min-vh-100 d-flex align-items-stretch p-0">
    <div class="row g-0 flex-fill">

      <!-- LADO IZQUIERDO (IMAGEN / BRANDING) -->
      <div class="col-12 col-lg-6 position-relative auth-hero">

        <!-- En desktop se ve la imagen completa -->
        <div class="d-none d-lg-block auth-hero__img"></div>
        <div class="d-none d-lg-block auth-hero__overlay"></div>

        <div class="d-none d-lg-block position-absolute bottom-0 start-0 p-5 text-white">
          <div class="d-flex align-items-center gap-2 mb-3">
            <div class="rounded-circle auth-hero__dot"></div>
            <div class="fw-semibold fs-4">Effisort</div>
          </div>
          <p class="mb-0 auth-hero__text">
            Gestiona facturación, contabilidad y reportes desde un solo lugar.
            Accede con tu cuenta para continuar.
          </p>
        </div>

        <!-- En mobile mostramos un header compacto -->
        <div class="d-lg-none p-4 text-white auth-hero__mobile">
          <div class="fw-bold fs-4">Effisort</div>
          <div class="opacity-75">Accede al panel de administración</div>
        </div>
      </div>

      <!-- LADO DERECHO (SLOT PARA PÁGINAS AUTH) -->
      <div class="col-12 col-lg-6 d-flex align-items-center justify-content-center bg-body">
        <div class="w-100" style="max-width: 460px;">
          <div class="px-4 px-sm-5 py-5">
            <slot />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.auth-hero {
  background: #0b1220;
  min-height: 180px;
}

/* Imagen (pon la tuya en /public/assets/img/login.jpg) */
.auth-hero__img {
  position: absolute;
  inset: 0;
  background-image: url('/assets/img/login.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.92;
}

.auth-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(11,18,32,.85), rgba(11,18,32,.35));
}

.auth-hero__dot {
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,.15);
}

.auth-hero__text {
  max-width: 420px;
  opacity: 0.9;
}

.auth-hero__mobile {
  background: linear-gradient(135deg, rgba(11,18,32,.95), rgba(11,18,32,.55));
}
</style>
