<template>
    <!-- Sidebar -->
    <div class="sidebar" data-background-color="dark">
        <div class="sidebar-logo">
            <!-- Logo Header -->
            <div class="logo-header" data-background-color="dark">
                <RouterLink to="/admin" class="logo">
                    <div class="d-flex  align-items-center">
                        
                        <h3 class="m-0 text-white fw-bold">
                            <i class="fa fa-receipt"></i> Effisort
                        </h3>
                    </div>
                </RouterLink>
                <div class="nav-toggle">
                    <button class="btn btn-toggle toggle-sidebar">
                        <i class="gg-menu-right"></i>
                    </button>
                    <button class="btn btn-toggle sidenav-toggler">
                        <i class="gg-menu-left"></i>
                    </button>
                </div>
                <button class="topbar-toggler more">
                    <i class="gg-more-vertical-alt"></i>
                </button>
            </div>
            <!-- End Logo Header -->
        </div>
        <div class="sidebar-wrapper scrollbar scrollbar-inner">
            <div class="sidebar-content">
                <ul class="nav nav-secondary">
                    <NuxtLink custom v-slot="{ href, navigate, isActive }" to="/admin">
                        <li class="nav-item" :class="{ 'active': isActive }">
                            <a :href="href" @click="navigate">

                                <i class="fas fa-file"></i>
                                <p>Dashboard</p>
                            </a>
                        </li>
                    </NuxtLink>
                    <li class="nav-section">
                        <span class="sidebar-mini-icon">
                            <i class="fa fa-ellipsis-h"></i>
                        </span>
                        <h4 class="text-section">Menu</h4>
                    </li>
                    <li class="nav-item">
                        <a data-bs-toggle="collapse" href="#billing">
                            <i class="fas fa-receipt"></i>
                            <p>Facturación</p>
                            <span class="caret"></span>
                        </a>
                        <div class="collapse" id="billing">
                            <ul class="nav nav-collapse">
                                <li>
                                    <NuxtLink to="/admin/billing">
                                        <span class="sub-item">Lista de Facturas</span>
                                    </NuxtLink>
                                </li>
                                <li>
                                    <NuxtLink to="/admin/billing/sale">
                                        <span class="sub-item">Realizar Venta</span>
                                    </NuxtLink>
                                </li>
                                <li>
                                    <NuxtLink to="/admin/billing/credit-notes">
                                        <span class="sub-item">Notas de Crédito</span>
                                    </NuxtLink>
                                </li>
                                <li>
                                    <NuxtLink to="/admin/billing/settings">
                                        <span class="sub-item">Ajustes de Facturacion</span>
                                    </NuxtLink>
                                </li>
                            </ul>
                        </div>
                    </li>
                    <li class="nav-item">
                        <a data-bs-toggle="collapse" href="#inventory">
                            <i class="fas fa-store"></i>
                            <p>Inventario</p>
                            <span class="caret"></span>
                        </a>
                        <div class="collapse" id="inventory">
                            <ul class="nav nav-collapse">
                                <li>
                                    <a href="forms/forms.html">
                                        <span class="sub-item">Productos</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="forms/forms.html">
                                        <span class="sub-item">Proveedores</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="forms/forms.html">
                                        <span class="sub-item">Ajustes de Inventario</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>
                    <li class="nav-item">
                        <a data-bs-toggle="collapse" href="#reports">
                            <i class="fas fa-chart-bar"></i>
                            <p>Informes</p>
                            <span class="caret"></span>
                        </a>
                        <div class="collapse" id="reports">
                            <ul class="nav nav-collapse">
                                <li>
                                    <a href="forms/forms.html">
                                        <span class="sub-item">Realizar Informe</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="forms/forms.html">
                                        <span class="sub-item">Ajustes de Informes</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>
                    <NuxtLink custom v-slot="{ href, navigate, isActive }" to="/admin/settings">
                        <li class="nav-item" :class="{ 'active': isActive }">
                            <a :href="href" @click="navigate">

                                <i class="fas fa-cog"></i>
                                <p>Ajustes</p>
                            </a>
                        </li>
                    </NuxtLink>
                    <!-- <li class="nav-item">
                        <a data-bs-toggle="collapse" href="#submenu">
                            <i class="fas fa-bars"></i>
                            <p>Menu Levels</p>
                            <span class="caret"></span>
                        </a>
                        <div class="collapse" id="submenu">
                            <ul class="nav nav-collapse">
                                <li>
                                    <a data-bs-toggle="collapse" href="#subnav1">
                                        <span class="sub-item">Level 1</span>
                                        <span class="caret"></span>
                                    </a>
                                    <div class="collapse" id="subnav1">
                                        <ul class="nav nav-collapse subnav">
                                            <li>
                                                <a href="#">
                                                    <span class="sub-item">Level 2</span>
                                                </a>
                                            </li>
                                            <li>
                                                <a href="#">
                                                    <span class="sub-item">Level 2</span>
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <a data-bs-toggle="collapse" href="#subnav2">
                                        <span class="sub-item">Level 1</span>
                                        <span class="caret"></span>
                                    </a>
                                    <div class="collapse" id="subnav2">
                                        <ul class="nav nav-collapse subnav">
                                            <li>
                                                <a href="#">
                                                    <span class="sub-item">Level 2</span>
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <a href="#">
                                        <span class="sub-item">Level 1</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li> -->
                </ul>
            </div>
        </div>
    </div>
    <!-- End Sidebar -->
</template>

<script setup lang="ts">

</script>

<style scoped></style>