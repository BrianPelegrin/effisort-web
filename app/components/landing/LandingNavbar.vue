<template>
  <header class="landing-navbar sticky-top">
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <!-- Brand -->
        <NuxtLink to="/" class="navbar-brand brand-wrap">
          <span class="brand-logo-box">
            <!-- Coloca tu logo en public/images/effisort-logo.png -->
            <img
              src="/images/effisort-logo.png"
              alt="Effisort Software Solutions"
              class="brand-logo-img"
            />
          </span>
        </NuxtLink>

        <!-- Mobile toggler -->
        <button
          class="navbar-toggler custom-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#landingNav"
          aria-controls="landingNav"
          aria-expanded="false"
          aria-label="Abrir menú"
        >
          <i class="bi bi-list"></i>
        </button>

        <div id="landingNav" class="collapse navbar-collapse">
          <!-- Center links -->
          <ul class="navbar-nav mx-lg-auto align-items-lg-center nav-links mt-4 mt-lg-0">
            <li class="nav-item">
              <a class="nav-link active" href="#inicio">
                Inicio
              </a>
            </li>

            <li class="nav-item">
              <a class="nav-link" href="#funciones">
                Funciones
              </a>
            </li>

            <li class="nav-item">
              <a class="nav-link" href="#modulos">
                Módulos
              </a>
            </li>

            <li class="nav-item">
              <a class="nav-link" href="#planes">
                Precios
              </a>
            </li>

            <li class="nav-item">
              <a class="nav-link" href="#contacto">
                Contacto
              </a>
            </li>
          </ul>

          <!-- Actions -->
          <div class="navbar-actions mt-4 mt-lg-0">
            <NuxtLink to="/auth/login" class="btn btn-login">
              Iniciar sesión
            </NuxtLink>

            <a href="#planes" class="btn btn-primary-cta">
              Comenzar
              <i class="bi bi-arrow-right ms-2"></i>
            </a>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts"></script>

<style scoped>
.landing-navbar {
  background: linear-gradient(135deg, #061833 0%, #071f45 48%, #082b63 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 1030;
}

.navbar {
  min-height: 76px;
  padding: 0.85rem 0;
}

.brand-wrap {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.brand-logo-box {
  height: 48px;
  max-width: 230px;
  padding: 0.35rem 0.7rem;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.brand-logo-img {
  height: 34px;
  width: auto;
  max-width: 200px;
  object-fit: contain;
  display: block;
}

.nav-links {
  gap: 0.35rem;
}

.nav-link {
  position: relative;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.94rem;
  font-weight: 600;
  padding: 0.7rem 0.95rem !important;
  border-radius: 999px;
  transition: all 0.18s ease;
}

.nav-link:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.nav-link.active {
  color: #ffffff;
}

.nav-link.active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0.2rem;
  width: 26px;
  height: 3px;
  border-radius: 999px;
  background: #0d6efd;
  transform: translateX(-50%);
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-login,
.btn-primary-cta {
  min-height: 42px;
  border-radius: 10px;
  padding: 0.65rem 1.05rem;
  font-size: 0.92rem;
  font-weight: 700;
  box-shadow: none;
}

.btn-login {
  color: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
}

.btn-login:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.26);
}

.btn-primary-cta {
  color: #ffffff;
  border: 1px solid #0d6efd;
  background: #0d6efd;
}

.btn-primary-cta:hover {
  color: #ffffff;
  border-color: #0b5ed7;
  background: #0b5ed7;
}

.custom-toggler {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
}

.custom-toggler:focus {
  box-shadow: none;
}

.custom-toggler i {
  font-size: 1.5rem;
}

@media (max-width: 991.98px) {
  .landing-navbar {
    background: #061833;
  }

  .navbar-collapse {
    padding: 1rem 0 0.25rem;
  }

  .nav-links {
    gap: 0.35rem;
  }

  .nav-link {
    border-radius: 12px;
    padding: 0.85rem 1rem !important;
  }

  .nav-link.active::after {
    display: none;
  }

  .nav-link.active {
    background: rgba(13, 110, 253, 0.18);
  }

  .navbar-actions {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
  }

  .btn-login,
  .btn-primary-cta {
    width: 100%;
  }
}

@media (max-width: 575.98px) {
  .brand-logo-box {
    max-width: 185px;
    height: 44px;
  }

  .brand-logo-img {
    max-width: 160px;
    height: 30px;
  }
}
</style>