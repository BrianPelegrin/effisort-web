<template>
    <aside ref="sidebarElement" class="sidebar" data-background-color="dark" aria-label="Menú principal">
        <div class="sidebar-logo">
            <div class="logo-header" data-background-color="dark">
                <NuxtLink to="/admin" class="logo text-white fw-bold">
                    <i class="fa fa-receipt"></i>
                    <span>Effisort</span>
                </NuxtLink>
                <div class="nav-toggle">
                    <button type="button" class="btn btn-toggle" aria-label="Contraer menú lateral" @click="emit('toggle')">
                        <i class="gg-menu-right"></i>
                    </button>
                </div>
            </div>
        </div>

        <div class="sidebar-wrapper">
            <div class="sidebar-content sidebar-content-layout">
                <nav class="sidebar-navigation" aria-label="Navegación administrativa">
                    <ul class="nav nav-secondary">
                        <li class="nav-item" :class="{ active: route.path === '/admin' }">
                            <NuxtLink to="/admin" @click="handleNavigation">
                                <i class="fas fa-file"></i>
                                <p>Dashboard</p>
                            </NuxtLink>
                        </li>

                        <li class="nav-section">
                            <span class="sidebar-mini-icon"><i class="fa fa-ellipsis-h"></i></span>
                            <h4 class="text-section">Menú</h4>
                        </li>

                        <li class="nav-item" :class="{ active: route.path.startsWith('/admin/clients') }">
                            <NuxtLink to="/admin/clients" @click="handleNavigation">
                                <i class="fas fa-users"></i>
                                <p>Clientes</p>
                            </NuxtLink>
                        </li>

                        <li class="nav-item" :class="{ active: isBillingActive, 'is-menu-open': expandedMenu === 'billing' }">
                            <button
                                type="button"
                                class="sidebar-menu-toggle"
                                :aria-expanded="expandedMenu === 'billing'"
                                aria-controls="billing-menu"
                                @click="toggleMenu('billing')"
                            >
                                <i class="fas fa-receipt"></i>
                                <p>Facturación</p>
                                <span class="caret"></span>
                            </button>
                            <div id="billing-menu" class="collapse" :class="{ show: expandedMenu === 'billing' }">
                                <ul class="nav nav-collapse">
                                    <li><NuxtLink to="/admin/billing" @click="handleNavigation"><span class="sub-item">Lista de facturas</span></NuxtLink></li>
                                    <li><NuxtLink to="/admin/billing/sale" @click="handleNavigation"><span class="sub-item">Realizar venta</span></NuxtLink></li>
                                    <li><NuxtLink to="/admin/billing/credit-notes" @click="handleNavigation"><span class="sub-item">Notas de crédito</span></NuxtLink></li>
                                </ul>
                            </div>
                        </li>

                        <li class="nav-item" :class="{ active: isInventoryActive, 'is-menu-open': expandedMenu === 'inventory' }">
                            <button
                                type="button"
                                class="sidebar-menu-toggle"
                                :aria-expanded="expandedMenu === 'inventory'"
                                aria-controls="inventory-menu"
                                @click="toggleMenu('inventory')"
                            >
                                <i class="fas fa-store"></i>
                                <p>Inventario</p>
                                <span class="caret"></span>
                            </button>
                            <div id="inventory-menu" class="collapse" :class="{ show: expandedMenu === 'inventory' }">
                                <ul class="nav nav-collapse">
                                    <li><NuxtLink to="/admin/inventory" @click="handleNavigation"><span class="sub-item">Productos</span></NuxtLink></li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                </nav>

                <div class="sidebar-user">
                    <div class="sidebar-user-summary">
                        <div class="sidebar-user-avatar" aria-hidden="true">{{ userInitial }}</div>
                        <div class="sidebar-user-info">
                            <span class="sidebar-user-name">{{ userName }}</span>
                            <span class="sidebar-user-email">{{ userEmail }}</span>
                            <span class="sidebar-user-company">{{ companyName }}</span>
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline-light btn-sm sidebar-logout" @click="logout">
                        <i class="bi bi-box-arrow-right"></i>
                        Cerrar sesi&oacute;n
                    </button>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
type SidebarMenu = 'billing' | 'inventory'

const emit = defineEmits<{
    toggle: []
    navigate: []
}>()

const props = withDefaults(defineProps<{
    collapsed?: boolean
}>(), {
    collapsed: false,
})

const route = useRoute()
const auth = useAuthStore()
const expandedMenu = ref<SidebarMenu | null>(null)
const sidebarElement = ref<HTMLElement | null>(null)

const userName = computed(() => auth.user?.name || auth.user?.userName || 'Usuario Effisort')
const userEmail = computed(() => auth.user?.email || 'Sin correo registrado')
const companyName = computed(() => auth.profile?.empresa.nombreComercial
    || auth.profile?.empresa.nombreRazonSocial
    || (auth.profileStatus === 'missing' ? 'Empresa no configurada' : 'Empresa no disponible'))
const userInitial = computed(() => userName.value.trim().charAt(0).toUpperCase() || 'U')
const isBillingActive = computed(() => route.path.startsWith('/admin/billing'))
const isInventoryActive = computed(() => route.path.startsWith('/admin/inventory'))

function menuFromPath(path: string): SidebarMenu | null {
    if (path.startsWith('/admin/billing')) return 'billing'
    if (path.startsWith('/admin/inventory')) return 'inventory'
    return null
}

function toggleMenu(menu: SidebarMenu) {
    expandedMenu.value = expandedMenu.value === menu ? null : menu
}

function handleNavigation() {
    expandedMenu.value = null
    emit('navigate')
}

function closeMenuOnOutsideClick(event: MouseEvent) {
    if (!props.collapsed || !expandedMenu.value) return

    const target = event.target
    if (!(target instanceof Node)) return

    const openMenu = sidebarElement.value?.querySelector('.nav-item.is-menu-open')
    if (openMenu && !openMenu.contains(target)) expandedMenu.value = null
}

async function logout() {
    await auth.logout()
}

watch(
    () => route.path,
    path => {
        const routeMenu = menuFromPath(path)
        if (routeMenu && !props.collapsed) expandedMenu.value = routeMenu
    },
    { immediate: true },
)

watch(
    () => props.collapsed,
    isCollapsed => {
        if (isCollapsed) expandedMenu.value = null
    },
)

onMounted(() => document.addEventListener('click', closeMenuOnOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', closeMenuOnOutsideClick))
</script>

<style scoped>
.sidebar {
    display: flex;
    flex-direction: column;
}

.sidebar-wrapper {
    flex: 1 1 auto;
    min-height: 0 !important;
    max-height: none !important;
}

.sidebar-content-layout {
    min-height: 100%;
    display: flex;
    flex-direction: column;
}

.sidebar-navigation {
    flex: 0 0 auto;
}

.sidebar-menu-toggle {
    display: flex;
    align-items: center;
    width: 100%;
    border: 0;
    background: transparent;
    color: rgba(255, 255, 255, 0.82);
    padding: 6px 25px;
    font-size: 1rem;
    text-align: left;
}

.sidebar-menu-toggle i {
    width: 25px;
    margin-right: 15px;
    color: rgba(255, 255, 255, 0.62);
    font-size: 16px;
    line-height: 30px;
    text-align: center;
}

.sidebar-menu-toggle p {
    margin: 0 5px 0 0;
    color: inherit;
    font-size: 1rem;
    font-weight: 600;
    white-space: nowrap;
}

.sidebar-menu-toggle .caret {
    margin-right: 6px;
    margin-left: auto;
    color: rgba(255, 255, 255, 0.62);
}

.sidebar-menu-toggle:hover,
.sidebar-menu-toggle[aria-expanded="true"],
.nav-item.active > .sidebar-menu-toggle {
    color: #fff;
}

.sidebar-menu-toggle:hover i,
.sidebar-menu-toggle[aria-expanded="true"] i,
.nav-item.active > .sidebar-menu-toggle i {
    color: #a99cf6;
}

.sidebar-menu-toggle:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8) !important;
    outline-offset: -3px;
}

.sidebar-menu-toggle[aria-expanded="true"] .caret {
    transform: rotate(180deg);
}

.caret {
    transition: transform 0.2s ease;
}

.sidebar-user {
    margin-top: auto;
    padding: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.sidebar-user-summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
}

.sidebar-user-avatar {
    display: grid;
    flex: 0 0 2.5rem;
    width: 2.5rem;
    height: 2.5rem;
    place-items: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
    font-weight: 700;
}

.sidebar-user-info {
    display: flex;
    min-width: 0;
    flex-direction: column;
}

.sidebar-user-name,
.sidebar-user-email,
.sidebar-user-company {
    overflow: hidden;
    color: #fff;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sidebar-user-name {
    font-size: 0.875rem;
    font-weight: 600;
}

.sidebar-user-email {
    color: rgba(255, 255, 255, 0.65);
    font-size: 0.75rem;
}

.sidebar-user-company {
    margin-top: 0.15rem;
    color: rgba(169, 156, 246, 0.92);
    font-size: 0.7rem;
}

.sidebar-logout {
    width: 100%;
    margin-top: 0.875rem;
}

.sidebar-logout i {
    margin-right: 0.35rem;
}

:global(.sidebar_minimize .sidebar-user-info),
:global(.sidebar_minimize .sidebar-logout) {
    display: none;
}

:global(.sidebar_minimize .sidebar-user) {
    display: flex;
    justify-content: center;
    padding-right: 0.5rem;
    padding-left: 0.5rem;
}

:global(.sidebar_minimize .sidebar-menu-toggle) {
    justify-content: center;
    padding-right: 0;
    padding-left: 0;
}

:global(.sidebar_minimize .sidebar-menu-toggle i) {
    margin-right: 0;
}

:global(.sidebar_minimize .sidebar-menu-toggle p),
:global(.sidebar_minimize .sidebar-menu-toggle .caret) {
    display: none !important;
}

@media screen and (min-width: 992px) {
    :global(.sidebar_minimize .sidebar),
    :global(.sidebar_minimize .sidebar .sidebar-wrapper) {
        overflow: visible;
    }

    :global(.sidebar_minimize .sidebar .nav-item.is-menu-open) {
        position: relative;
        z-index: 2;
    }

    :global(.sidebar_minimize .sidebar .nav-item.is-menu-open > .collapse.show) {
        position: absolute;
        top: 0;
        left: 75px;
        display: block !important;
        width: 220px;
        padding: 0.5rem 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0 0.75rem 0.75rem 0;
        background: #1a2035;
        box-shadow: 0 0.75rem 1.75rem rgba(3, 11, 28, 0.28);
    }

    :global(.sidebar_minimize .sidebar .nav-item.is-menu-open > .collapse.show .nav-collapse) {
        display: block !important;
        margin: 0;
        padding: 0;
    }

    :global(.sidebar_minimize .sidebar .nav-item.is-menu-open > .collapse.show .nav-collapse li a) {
        display: flex !important;
        padding: 0.6rem 1rem !important;
        color: rgba(255, 255, 255, 0.82) !important;
    }

    :global(.sidebar_minimize .sidebar .nav-item.is-menu-open > .collapse.show .nav-collapse li a span) {
        display: block !important;
        color: inherit !important;
        font-size: 0.9rem;
        white-space: nowrap;
    }
}
</style>
