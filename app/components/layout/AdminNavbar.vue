<template>
    <header class="main-header admin-header">
        <div class="main-header-logo">
            <!-- Logo Header -->
            <div class="logo-header admin-mobile-header" data-background-color="dark">
                <NuxtLink to="/admin" class="logo text-white fw-bold admin-mobile-brand" aria-label="Ir al inicio de Effisort">
                    <i class="bi bi-receipt-cutoff" aria-hidden="true"></i> Effisort
                </NuxtLink>
                <div class="nav-toggle">
                    <button type="button" class="admin-mobile-menu-toggle" aria-label="Abrir o cerrar menú lateral" @click="emit('toggle-sidebar')">
                        <i class="bi bi-list" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            <!-- End Logo Header -->
        </div>
        <!-- Navbar Header -->
        <nav class="navbar navbar-header navbar-header-transparent navbar-expand-lg border-bottom">
            <div class="container-fluid">

                <ul class="navbar-nav topbar-nav ms-md-auto align-items-center">
                    <li class="nav-item topbar-icon dropdown hidden-caret d-flex d-lg-none">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button"
                            aria-expanded="false" aria-haspopup="true">
                            <i class="fa fa-search"></i>
                        </a>
                        <ul class="dropdown-menu dropdown-search animated fadeIn">
                            <form class="navbar-left navbar-form nav-search">
                                <div class="input-group">
                                    <input type="text" placeholder="Search ..." class="form-control" />
                                </div>
                            </form>
                        </ul>
                    </li>

                    <li class="nav-item topbar-icon dropdown hidden-caret">
                        <a class="nav-link dropdown-toggle" href="#" id="notifDropdown" role="button"
                            data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <i class="fa fa-bell"></i>
                            <span class="notification">4</span>
                        </a>
                        <ul class="dropdown-menu notif-box animated fadeIn" aria-labelledby="notifDropdown">
                            <li>
                                <div class="dropdown-title">
                                    You have 4 new notification
                                </div>
                            </li>
                            <li>
                                <div class="notif-scroll scrollbar-outer">
                                    <div class="notif-center">
                                        <a href="#">
                                            <div class="notif-icon notif-primary">
                                                <i class="fa fa-user-plus"></i>
                                            </div>
                                            <div class="notif-content">
                                                <span class="block"> New user registered </span>
                                                <span class="time">5 minutes ago</span>
                                            </div>
                                        </a>
                                        <a href="#">
                                            <div class="notif-icon notif-success">
                                                <i class="fa fa-comment"></i>
                                            </div>
                                            <div class="notif-content">
                                                <span class="block">
                                                    Rahmad commented on Admin
                                                </span>
                                                <span class="time">12 minutes ago</span>
                                            </div>
                                        </a>
                                        <a href="#">
                                            <div class="notif-img">
                                                <img src="/assets/img/profile2.jpg" alt="Img Profile" />
                                            </div>
                                            <div class="notif-content">
                                                <span class="block">
                                                    Reza send messages to you
                                                </span>
                                                <span class="time">12 minutes ago</span>
                                            </div>
                                        </a>
                                        <a href="#">
                                            <div class="notif-icon notif-danger">
                                                <i class="fa fa-heart"></i>
                                            </div>
                                            <div class="notif-content">
                                                <span class="block"> Farrah liked Admin </span>
                                                <span class="time">17 minutes ago</span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </li>
                            <li>
                                <a class="see-all" href="javascript:void(0);">See all notifications<i
                                        class="fa fa-angle-right"></i>
                                </a>
                            </li>
                        </ul>
                    </li>

                </ul>
            </div>
        </nav>
        <!-- End Navbar -->
    </header>
</template>

<script setup lang="ts">
const emit = defineEmits<{
    'toggle-sidebar': []
}>()
</script>

<style scoped>
.admin-mobile-header {
    display: flex;
    align-items: center;
    height: 70px;
    min-height: 70px;
    padding: 0 1rem;
}

.admin-mobile-menu-toggle {
    display: inline-grid;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    place-items: center;
    border: 0;
    border-radius: 0.5rem;
    background: transparent;
    color: #fff;
    font-size: 1.65rem;
    line-height: 1;
}

.admin-mobile-menu-toggle:hover,
.admin-mobile-menu-toggle:focus-visible {
    background: rgba(255, 255, 255, 0.1);
}

.admin-mobile-menu-toggle:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
}

.admin-mobile-brand {
    position: absolute;
    left: 50%;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: #fff;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1;
    transform: translateX(-50%);
}

.admin-mobile-brand:hover {
    color: #fff;
}

.admin-mobile-brand i {
    color: #54a6ff;
    font-size: 1rem;
}

@media screen and (max-width: 991.98px) {
    .admin-header {
        min-height: 70px;
    }

    .admin-header .main-header-logo {
        display: block;
        height: 70px;
    }

    .admin-header .admin-mobile-header {
        position: relative;
        width: 100%;
    }

    .admin-header .navbar-header {
        display: none;
    }
}
</style>
