// components/LandingNavbar.vue
<template>
  <header class="navbar navbar-expand-lg landing-nav navbar-dark sticky-top">
    <div class="container">
      <NuxtLink to="/" class="navbar-brand d-flex align-items-center gap-2 fw-bold">
        <span class="brand-logo d-inline-flex align-items-center justify-content-center">
          <i class="fas fa-file-invoice-dollar"></i>
        </span>
        <span class="brand-text">Effisort</span>
        <span class="badge ms-1 brand-badge">e-CF</span>
      </NuxtLink>

      <button
        class="navbar-toggler border-0"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#landingNav"
        aria-controls="landingNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="landingNav" class="collapse navbar-collapse">
        <ul class="navbar-nav ms-auto me-lg-3 align-items-lg-center gap-lg-1 mt-3 mt-lg-0">
          <li class="nav-item">
            <a class="nav-link nav-pill" href="#beneficios">
              <i class="fas fa-star me-2 d-lg-none"></i>Beneficios
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link nav-pill" href="#funcionalidades">
              <i class="fas fa-grid-2 me-2 d-lg-none"></i>Funcionalidades
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link nav-pill" href="#planes">
              <i class="fas fa-tags me-2 d-lg-none"></i>Planes
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link nav-pill" href="#faq">
              <i class="fas fa-circle-question me-2 d-lg-none"></i>Preguntas
            </a>
          </li>
        </ul>

        <div class="d-flex gap-2 align-items-lg-center mt-3 mt-lg-0">
          <a href="#planes" class="btn btn-ghost">
            <i class="fas fa-bolt me-2"></i>Ver planes
          </a>

          <NuxtLink to="/auth/login" class="btn btn-login">
            <i class="fas fa-right-to-bracket me-2"></i>Iniciar sesión
          </NuxtLink>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts"></script>

<style scoped>
/* Navbar llamativo (gradiente + glass) */
.landing-nav {
  background: linear-gradient(135deg, #0d6efd 0%, #4f8cff 35%, #1b2a6b 100%);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.18);
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(10px);
}

/* Marca */
.brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.brand-text {
  letter-spacing: 0.2px;
}

.brand-badge {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
}

/* Links tipo pill */
.nav-pill {
  color: rgba(255, 255, 255, 0.86) !important;
  padding: 10px 14px;
  border-radius: 999px;
  transition: background 0.18s ease, transform 0.18s ease, color 0.18s ease;
}

.nav-pill:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #fff !important;
  transform: translateY(-1px);
}

/* Botón secundario (ghost) */
.btn-ghost {
  border-radius: 999px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.14);
  transform: translateY(-1px);
}

/* Botón principal (login) más llamativo */
.btn-login {
  border-radius: 999px;
  padding: 10px 16px;
  border: 0;
  color: #0b1b3a;
  background: linear-gradient(135deg, #ffffff 0%, #e9f2ff 60%, #ffffff 100%);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.20);
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.btn-login:hover {
  transform: translateY(-2px);
  filter: brightness(1.02);
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.24);
}

/* Toggler más visible */
.navbar-toggler:focus {
  box-shadow: none;
}

/* Espaciado vertical (móvil) */
@media (max-width: 991.98px) {
  .nav-pill {
    padding: 12px 14px;
    border-radius: 14px;
  }
}
</style>