<template>
  <header class="landing-navbar sticky-top">
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <!-- Brand -->
        <NuxtLink to="/" class="navbar-brand brand-wrap">
          <span class="brand-logo-box">
            <img
              src="/images/effisort-logo-navbar.png"
              alt="Effisort Software Solutions"
              class="brand-logo-img"
            />
          </span>
        </NuxtLink>

        <!-- Mobile toggle -->
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
          <!-- Main navigation -->
          <ul class="navbar-nav mx-lg-auto align-items-lg-center nav-links mt-4 mt-lg-0">
            <li v-for="link in navLinks" :key="link.section" class="nav-item">
              <a
                class="nav-link"
                :class="{ active: activeSection === link.section }"
                :href="`#${link.section}`"
                :aria-current="activeSection === link.section ? 'page' : undefined"
                @click="handleNavigation(link.section)"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>

          <!-- Navigation actions -->
          <div class="navbar-actions mt-4 mt-lg-0">
            <NuxtLink to="/auth/login" class="btn btn-login">Iniciar sesión</NuxtLink>
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

<script setup lang="ts">
const navLinks = [
  { section: 'inicio', label: 'Inicio' },
  { section: 'beneficios', label: 'Funciones' },
  { section: 'funcionalidades', label: 'Módulos' },
  { section: 'planes', label: 'Precios' },
  { section: 'cta', label: 'Contacto' },
] as const

type LandingSection = typeof navLinks[number]['section']

const activeSection = ref<LandingSection>('inicio')

function updateActiveSection() {
  const activationPoint = window.scrollY + window.innerHeight * 0.35
  let currentSection: LandingSection = navLinks[0].section

  for (const link of navLinks) {
    const section = document.getElementById(link.section)
    if (section && section.offsetTop <= activationPoint) currentSection = link.section
  }

  activeSection.value = currentSection
}

function handleNavigation(section: LandingSection) {
  activeSection.value = section

  const navigation = document.getElementById('landingNav')
  const toggle = document.querySelector<HTMLButtonElement>('[data-bs-target="#landingNav"]')

  navigation?.classList.remove('show')
  toggle?.setAttribute('aria-expanded', 'false')
}

onMounted(() => {
  updateActiveSection()
  window.addEventListener('scroll', updateActiveSection, { passive: true })
  window.addEventListener('resize', updateActiveSection)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateActiveSection)
  window.removeEventListener('resize', updateActiveSection)
})
</script>

<style scoped>
.landing-navbar {
  z-index: 1030;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(110deg, #021634 0%, #031b45 52%, #05285f 100%);
  box-shadow: 0 8px 24px rgba(3, 27, 69, 0.12);
}

.navbar {
  min-height: 72px;
  padding: 0.65rem 0;
}

.brand-wrap {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.brand-logo-box {
  display: inline-flex;
  width: 172px;
  height: 46px;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
}

.brand-logo-img {
  display: block;
  width: 172px;
  height: auto;
  object-fit: contain;
}

.nav-links {
  gap: 0.35rem;
}

.nav-link {
  position: relative;
  padding: 0.7rem 0.95rem !important;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.9rem;
  font-weight: 650;
  transition: color 0.18s ease, background 0.18s ease;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.nav-link.active {
  color: #fff;
}

.nav-link.active::after {
  position: absolute;
  bottom: 0.2rem;
  left: 50%;
  width: 26px;
  height: 3px;
  border-radius: 999px;
  background: #0878ff;
  content: "";
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
  padding: 0.65rem 1.05rem;
  border-radius: 11px;
  font-size: 0.9rem;
  font-weight: 750;
  box-shadow: none;
}

.btn-login {
  border: 1px solid rgba(255, 255, 255, 0.38);
  color: rgba(255, 255, 255, 0.9);
  background: transparent;
}

.btn-login:hover {
  border-color: rgba(255, 255, 255, 0.62);
  color: #fff;
  background: rgba(255, 255, 255, 0.09);
}

.btn-primary-cta {
  border: 1px solid #0878ff;
  color: #fff;
  background: #0878ff;
  box-shadow: 0 10px 22px rgba(8, 120, 255, 0.24);
}

.btn-primary-cta:hover {
  border-color: #0062d8;
  color: #fff;
  background: #0062d8;
}

.custom-toggler {
  display: none;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
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
    background: #021634;
  }

  .navbar-collapse {
    width: 100%;
    padding: 1rem 0 0.25rem;
  }

  .custom-toggler {
    display: inline-flex;
  }

  .nav-links {
    width: calc(100% - 1rem);
    margin-right: 0.5rem;
    margin-left: 0.5rem;
  }

  .nav-item,
  .nav-link {
    width: 100%;
  }

  .nav-link {
    padding: 0.85rem 1rem !important;
    border-radius: 12px;
  }

  .nav-link.active {
    background: rgba(8, 120, 255, 0.18);
  }

  .nav-link.active::after {
    display: none;
  }

  .navbar-actions {
    display: grid;
    grid-template-columns: 1fr;
    width: calc(100% - 1rem);
    margin-right: 0.5rem;
    margin-left: 0.5rem;
  }

  .btn-login,
  .btn-primary-cta {
    width: 100%;
  }
}

@media (max-width: 575.98px) {
  .custom-toggler {
    margin-right: 0.5rem;
  }

  .brand-logo-box,
  .brand-logo-img {
    width: 152px;
  }

  .brand-logo-box {
    height: 42px;
  }
}
</style>
