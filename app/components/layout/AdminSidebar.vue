<script setup lang="ts">
type NavigationId = 'home' | 'sale' | 'invoices' | 'clients' | 'inventory' | 'credit-notes' | 'users'

interface NavigationItem {
  id: NavigationId
  label: string
  description: string
  icon: string
  to: string
  emphasis?: boolean
}

const emit = defineEmits<{
  toggle: []
  navigate: []
  'change-password': []
}>()

const props = withDefaults(defineProps<{
  collapsed?: boolean
}>(), {
  collapsed: false,
})

const route = useRoute()
const auth = useAuthStore()

const mainNavigation: NavigationItem[] = [
  {
    id: 'home',
    label: 'Inicio',
    description: 'Resumen del negocio',
    icon: 'bi bi-grid-1x2-fill',
    to: '/admin',
  },
  {
    id: 'sale',
    label: 'Realizar venta',
    description: 'Crear una factura',
    icon: 'bi bi-cart-check-fill',
    to: '/admin/billing/sale',
    emphasis: true,
  },
]

const managementNavigation: NavigationItem[] = [
  {
    id: 'invoices',
    label: 'Facturas',
    description: 'Documentos emitidos',
    icon: 'bi bi-receipt-cutoff',
    to: '/admin/billing',
  },
  {
    id: 'clients',
    label: 'Clientes',
    description: 'Directorio de clientes',
    icon: 'bi bi-people-fill',
    to: '/admin/clients',
  },
  {
    id: 'inventory',
    label: 'Productos',
    description: 'Inventario y existencias',
    icon: 'bi bi-box-seam-fill',
    to: '/admin/inventory',
  },
  {
    id: 'credit-notes',
    label: 'Notas de crédito',
    description: 'Correcciones realizadas',
    icon: 'bi bi-file-earmark-minus-fill',
    to: '/admin/billing/credit-notes',
  },
]
const visibleManagementNavigation = computed<NavigationItem[]>(() => auth.isTenantAdmin
  ? [...managementNavigation, { id: 'users', label: 'Usuarios', description: 'Accesos del equipo', icon: 'bi bi-person-gear', to: '/admin/users' }]
  : managementNavigation)

const userName = computed(() => auth.user?.name || auth.user?.userName || 'Usuario Effisort')
const userEmail = computed(() => auth.user?.email || 'Sin correo registrado')
const companyName = computed(() => (
  auth.profile?.empresa.nombreComercial
  || auth.profile?.empresa.nombreRazonSocial
  || (auth.profileStatus === 'missing' ? 'Empresa no configurada' : 'Empresa no disponible')
))
const userInitial = computed(() => userName.value.trim().charAt(0).toUpperCase() || 'U')

function isNavigationActive(id: NavigationId) {
  const path = route.path.replace(/\/$/, '') || '/'

  switch (id) {
    case 'home':
      return path === '/admin'
    case 'sale':
      return path === '/admin/billing/sale'
    case 'invoices':
      return path === '/admin/billing' || /^\/admin\/billing\/\d+$/.test(path)
    case 'clients':
      return path.startsWith('/admin/clients')
    case 'inventory':
      return path.startsWith('/admin/inventory')
    case 'credit-notes':
      return path.includes('/credit-note')
    case 'users':
      return path.startsWith('/admin/users')
    default:
      return false
  }
}

function handleNavigation() {
  emit('navigate')
}

async function logout() {
  await auth.logout()
}
</script>

<template>
  <aside class="effi-sidebar" :class="{ 'is-collapsed': props.collapsed }" aria-label="Menú principal">
    <div class="sidebar-brand-row">
      <NuxtLink to="/admin" class="sidebar-brand" aria-label="Ir al inicio de Effisort" @click="handleNavigation">
        <img src="/images/effisort-logo-navbar.png" alt="Effisort Software Solutions" class="brand-logo">
      </NuxtLink>

      <button
        type="button"
        class="sidebar-control desktop-collapse"
        :aria-label="props.collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'"
        :title="props.collapsed ? 'Expandir menú' : 'Contraer menú'"
        @click="emit('toggle')"
      >
        <i :class="props.collapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left'" aria-hidden="true" />
      </button>

      <button
        type="button"
        class="sidebar-control mobile-close"
        aria-label="Cerrar menú lateral"
        @click="emit('toggle')"
      >
        <i class="bi bi-x-lg" aria-hidden="true" />
      </button>
    </div>

    <div class="sidebar-scroll-area">
      <nav class="sidebar-navigation" aria-label="Navegación administrativa">
        <div class="navigation-group">
          <span class="navigation-label">Principal</span>

          <NuxtLink
            v-for="item in mainNavigation"
            :key="item.id"
            :to="item.to"
            class="navigation-item"
            :class="{ 'is-active': isNavigationActive(item.id), 'is-emphasized': item.emphasis }"
            :aria-current="isNavigationActive(item.id) ? 'page' : undefined"
            :title="props.collapsed ? item.label : undefined"
            @click="handleNavigation"
          >
            <span class="navigation-icon" aria-hidden="true"><i :class="item.icon" /></span>
            <span class="navigation-copy">
              <strong>{{ item.label }}</strong>
              <small>{{ item.description }}</small>
            </span>
            <i class="bi bi-chevron-right navigation-arrow" aria-hidden="true" />
          </NuxtLink>
        </div>

        <div class="navigation-group">
          <span class="navigation-label">Gestión</span>

          <NuxtLink
            v-for="item in visibleManagementNavigation"
            :key="item.id"
            :to="item.to"
            class="navigation-item"
            :class="{ 'is-active': isNavigationActive(item.id) }"
            :aria-current="isNavigationActive(item.id) ? 'page' : undefined"
            :title="props.collapsed ? item.label : undefined"
            @click="handleNavigation"
          >
            <span class="navigation-icon" aria-hidden="true"><i :class="item.icon" /></span>
            <span class="navigation-copy">
              <strong>{{ item.label }}</strong>
              <small>{{ item.description }}</small>
            </span>
            <i class="bi bi-chevron-right navigation-arrow" aria-hidden="true" />
          </NuxtLink>
        </div>
      </nav>
    </div>

    <div class="sidebar-account">
      <div class="account-summary" :title="props.collapsed ? userName : undefined">
        <span class="account-avatar" aria-hidden="true">{{ userInitial }}</span>
        <span class="account-copy">
          <strong>{{ userName }}</strong>
          <small>{{ companyName }}</small>
          <small class="account-email">{{ userEmail }}</small>
        </span>
      </div>

      <button
        type="button"
        class="logout-button password-button"
        :title="props.collapsed ? 'Cambiar mi contraseña' : undefined"
        aria-label="Cambiar mi contraseña"
        @click="emit('change-password')"
      >
        <i class="bi bi-shield-lock" aria-hidden="true" />
        <span>Cambiar contraseña</span>
      </button>

      <button
        type="button"
        class="logout-button"
        :title="props.collapsed ? 'Cerrar sesión' : undefined"
        aria-label="Cerrar sesión"
        @click="logout"
      >
        <i class="bi bi-box-arrow-right" aria-hidden="true" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.effi-sidebar {
  position: sticky;
  inset: 0 auto 0 0;
  z-index: 1100;
  display: flex;
  width: 280px;
  height: 100dvh;
  overflow: hidden;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  background:
    radial-gradient(circle at 20% 0%, rgba(54, 105, 220, 0.2), transparent 17rem),
    linear-gradient(180deg, #15233f 0%, #101a2f 100%);
  color: #fff;
  box-shadow: 10px 0 35px rgba(9, 18, 36, 0.08);
  transition: width 0.25s ease, transform 0.25s ease;
  overscroll-behavior: contain;
}

.sidebar-brand-row {
  display: flex;
  min-height: 78px;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0 1rem 0 1.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.sidebar-brand {
  display: flex;
  position: relative;
  flex: 1 1 auto;
  height: 68px;
  min-width: 0;
  align-items: center;
  color: #fff;
  overflow: hidden;
  text-decoration: none;
}

.sidebar-brand:hover {
  color: #fff;
}

.brand-logo {
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 245px;
  height: auto;
  max-width: none;
  transform: translate(-50%, -50%);
}

.account-copy,
.navigation-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.sidebar-control {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  padding: 0;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(235, 241, 252, 0.78);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.sidebar-control:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.mobile-close {
  display: none;
}

.sidebar-scroll-area {
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  flex: 1 1 auto;
  padding: 1.2rem 0.8rem;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
  scrollbar-width: thin;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.sidebar-navigation,
.navigation-group {
  display: flex;
  flex-direction: column;
}

.navigation-group + .navigation-group {
  margin-top: 1.35rem;
}

.navigation-label {
  margin: 0 0.75rem 0.55rem;
  color: rgba(218, 228, 246, 0.44);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.navigation-item {
  position: relative;
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.32rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid transparent;
  border-radius: 13px;
  color: rgba(225, 233, 247, 0.72);
  text-decoration: none;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.navigation-item:hover {
  border-color: rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.055);
  color: #fff;
  transform: translateX(2px);
}

.navigation-item.is-active {
  border-color: rgba(92, 139, 238, 0.23);
  background: linear-gradient(90deg, rgba(60, 112, 222, 0.24), rgba(60, 112, 222, 0.09));
  color: #fff;
}

.navigation-item.is-active::before {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: -0.8rem;
  width: 3px;
  border-radius: 0 4px 4px 0;
  background: #64a2ff;
  content: '';
}

.navigation-item.is-emphasized:not(.is-active) {
  border-color: rgba(88, 141, 248, 0.18);
  background: rgba(53, 108, 222, 0.12);
}

.navigation-icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.055);
  color: rgba(213, 225, 246, 0.72);
  font-size: 1rem;
}

.navigation-item.is-active .navigation-icon,
.navigation-item.is-emphasized .navigation-icon {
  background: rgba(90, 145, 255, 0.17);
  color: #8fbdff;
}

.navigation-copy {
  flex: 1 1 auto;
}

.navigation-copy strong {
  overflow: hidden;
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navigation-copy small {
  overflow: hidden;
  margin-top: 0.16rem;
  color: rgba(205, 216, 235, 0.45);
  font-size: 0.68rem;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navigation-arrow {
  color: rgba(217, 227, 245, 0.28);
  font-size: 0.72rem;
}

.navigation-item.is-active .navigation-arrow {
  color: #7facf7;
}

.sidebar-account {
  flex: 0 0 auto;
  padding: 0.9rem 0.8rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(4, 12, 28, 0.12);
}

.account-summary {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem;
}

.account-avatar {
  display: grid;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: linear-gradient(145deg, #344c76, #263957);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 800;
}

.account-copy {
  flex: 1 1 auto;
}

.account-copy strong,
.account-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-copy strong {
  color: #f4f7fc;
  font-size: 0.8rem;
  font-weight: 700;
}

.account-copy small {
  margin-top: 0.1rem;
  color: rgba(214, 225, 244, 0.5);
  font-size: 0.65rem;
}

.account-copy .account-email {
  color: rgba(214, 225, 244, 0.36);
}

.logout-button {
  display: flex;
  width: 100%;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  margin-top: 0.65rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.045);
  color: rgba(231, 238, 249, 0.7);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.logout-button:hover {
  background: rgba(225, 75, 96, 0.12);
  color: #ffb2bf;
}

.password-button:hover {
  background: rgba(114, 166, 255, 0.14);
  color: #c8dcff;
}

.sidebar-control:focus-visible,
.navigation-item:focus-visible,
.logout-button:focus-visible,
.sidebar-brand:focus-visible {
  outline: 3px solid rgba(114, 166, 255, 0.52) !important;
  outline-offset: 2px;
}

@media (min-width: 1200px) {
  .effi-sidebar.is-collapsed {
    width: 88px;
  }

  .is-collapsed .sidebar-brand-row {
    justify-content: center;
    padding: 0;
  }

  .is-collapsed .sidebar-brand {
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    justify-content: center;
  }

  .is-collapsed .navigation-copy,
  .is-collapsed .navigation-arrow,
  .is-collapsed .navigation-label,
  .is-collapsed .account-copy,
  .is-collapsed .logout-button span {
    display: none;
  }

  .is-collapsed .brand-logo {
    left: 0;
    width: 170px;
    transform: translateY(-50%);
  }

  .is-collapsed .desktop-collapse {
    position: absolute;
    top: 92px;
    right: -14px;
    z-index: 2;
    border-color: #dce3ef;
    background: #fff;
    color: #506079;
    box-shadow: 0 6px 15px rgba(18, 31, 54, 0.13);
  }

  .is-collapsed .sidebar-scroll-area {
    padding-right: 0.65rem;
    padding-left: 0.65rem;
  }

  .is-collapsed .navigation-group + .navigation-group {
    margin-top: 0.8rem;
  }

  .is-collapsed .navigation-item {
    justify-content: center;
    padding: 0.45rem;
  }

  .is-collapsed .navigation-item:hover {
    transform: none;
  }

  .is-collapsed .navigation-item.is-active::before {
    left: -0.65rem;
  }

  .is-collapsed .sidebar-account {
    padding-right: 0.65rem;
    padding-left: 0.65rem;
  }

  .is-collapsed .account-summary {
    justify-content: center;
    padding: 0.35rem 0;
  }

  .is-collapsed .logout-button {
    padding-right: 0;
    padding-left: 0;
  }
}

@media (max-width: 1199.98px) {
  .effi-sidebar {
    position: fixed;
    width: min(294px, calc(100% - 42px));
    transform: translate3d(-105%, 0, 0);
    box-shadow: 18px 0 50px rgba(5, 12, 25, 0.24);
  }

  .desktop-collapse {
    display: none;
  }

  .mobile-close {
    display: grid;
  }
}

@media (prefers-reduced-motion: reduce) {
  .effi-sidebar,
  .navigation-item,
  .sidebar-control,
  .logout-button {
    transition: none;
  }
}
</style>
