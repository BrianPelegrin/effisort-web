<template>
  <div class="landing-page">
    <LandingNavbar />

    <main>
      <slot />
    </main>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
useHead({
  script: [
    // Solo para que funcione collapse/navbar, modals, etc. (sin jQuery)
    { src: "/assets/js/core/popper.min.js", tagPosition: "bodyClose" },
    { src: "/assets/js/core/bootstrap.min.js", tagPosition: "bodyClose" },
  ]
})
</script>

<style>
/* Estilos globales SOLO para esta landing (encapsulados con .landing-page) */
.landing-page {
  background: #f8fafc;
  color: #1f2937;
}

.landing-page .py-lg-6 {
  padding-top: 5rem;
  padding-bottom: 5rem;
}

.landing-page .shadow-sm-sm {
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.landing-page .brand-logo {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0d6efd, #4f8cff);
  color: #fff;
  font-size: 0.95rem;
}

.landing-page .hero-section {
  background:
    radial-gradient(circle at 10% 10%, rgba(13, 110, 253, 0.08), transparent 35%),
    radial-gradient(circle at 90% 20%, rgba(25, 135, 84, 0.08), transparent 35%),
    #f8fafc;
}

.landing-page .hero-card {
  border-radius: 18px;
  overflow: hidden;
}

.landing-page .mini-stat {
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 14px;
  padding: 12px;
}

.landing-page .benefit-card {
  border-radius: 16px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.landing-page .benefit-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08) !important;
}

.landing-page .icon-box {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #0d6efd;
  color: white;
  font-size: 1.05rem;
}

.landing-page .icon-box.soft {
  background: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
}

.landing-page .feature-inline {
  display: flex;
  align-items: start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.05);
}

.landing-page .step-number {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
  font-weight: 700;
}

.landing-page .pricing-card {
  border-radius: 18px;
  position: relative;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.landing-page .pricing-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08) !important;
}

.landing-page .pricing-card-featured {
  border: 2px solid rgba(13, 110, 253, 0.2) !important;
  box-shadow: 0 14px 34px rgba(13, 110, 253, 0.12) !important;
}

.landing-page .cta-box {
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.landing-page .custom-accordion .accordion-button {
  box-shadow: none !important;
}

.landing-page .custom-accordion .accordion-button:not(.collapsed) {
  background: rgba(13, 110, 253, 0.06);
  color: inherit;
}

.landing-page .custom-accordion .accordion-item {
  overflow: hidden;
}

.landing-page .card,
.landing-page .form-control,
.landing-page .btn,
.landing-page .badge,
.landing-page .table,
.landing-page .accordion-item {
  border-radius: 12px;
}

.landing-page .table > :not(caption) > * > * {
  vertical-align: middle;
}

@media (max-width: 991.98px) {
  .landing-page .display-5 {
    font-size: 2.2rem;
  }
}
</style>