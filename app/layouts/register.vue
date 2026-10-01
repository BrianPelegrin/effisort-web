<template>
  <div class="register-layout">
    <div class="register-glow register-glow-left" aria-hidden="true"></div>
    <div class="register-glow register-glow-right" aria-hidden="true"></div>

    <header class="register-header">
      <div class="container register-header-inner">
        <NuxtLink to="/" class="register-brand" aria-label="Ir al inicio de Effisort">
          <img src="/images/effisort-logo-navbar.png" alt="Effisort Software Solutions">
        </NuxtLink>

        <div class="register-login-link">
          <span>¿Ya tienes una cuenta?</span>
          <NuxtLink to="/auth/login">Iniciar sesión</NuxtLink>
        </div>
      </div>
    </header>

    <main class="register-main">
      <slot />
    </main>

    <footer class="register-footer">
      © {{ new Date().getFullYear() }} Effisort. Todos los derechos reservados.
    </footer>
  </div>
</template>

<style scoped>
.register-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: #071d41;
  background:
    linear-gradient(180deg, rgba(238, 246, 255, 0.95), rgba(248, 251, 255, 0.98)),
    #f4f8fd;
}

.register-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(8px);
}

.register-glow-left {
  top: 110px;
  left: -250px;
  width: 520px;
  height: 520px;
  background: rgba(8, 120, 255, 0.09);
}

.register-glow-right {
  right: -220px;
  bottom: -200px;
  width: 500px;
  height: 500px;
  background: rgba(109, 67, 245, 0.07);
}

.register-header {
  position: relative;
  z-index: 2;
  min-height: 76px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  background: linear-gradient(110deg, #021634 0%, #031b45 52%, #05285f 100%);
  box-shadow: 0 8px 28px rgba(3, 27, 69, 0.12);
}

.register-header-inner {
  display: flex;
  min-height: 76px;
  align-items: center;
  justify-content: space-between;
}

.register-brand {
  display: inline-flex;
  width: 172px;
}

.register-brand img {
  display: block;
  width: 100%;
  height: auto;
}

.register-login-link {
  display: flex;
  gap: 14px;
  align-items: center;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.87rem;
}

.register-login-link a {
  padding: 9px 15px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 10px;
  color: #fff;
  font-weight: 750;
  text-decoration: none;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.register-login-link a:hover {
  border-color: rgba(255, 255, 255, 0.58);
  background: rgba(255, 255, 255, 0.1);
}

.register-main {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 134px);
}

.register-footer {
  position: relative;
  z-index: 1;
  padding: 0 20px 24px;
  color: #8491a5;
  font-size: 0.75rem;
  text-align: center;
}

@media (max-width: 575.98px) {
  .register-header,
  .register-header-inner {
    min-height: 68px;
  }

  .register-brand {
    width: 150px;
  }

  .register-login-link span {
    display: none;
  }

  .register-login-link a {
    padding: 8px 11px;
    font-size: 0.8rem;
  }
}
</style>
