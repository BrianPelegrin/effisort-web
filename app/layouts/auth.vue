<script setup lang="ts">
useHead({
  title: 'Effisort - Iniciar sesión',
})
</script>

<template>
  <div class="auth-page">
    <div class="auth-glow auth-glow-top" aria-hidden="true"></div>
    <div class="auth-glow auth-glow-bottom" aria-hidden="true"></div>

    <div class=" auth-container">
      <div class="row g-0 min-vh-100">
        <aside class="col-lg-6 auth-showcase">
          <NuxtLink to="/" class="auth-brand" aria-label="Ir al inicio de Effisort">
            <img
              src="/images/effisort-logo-navbar.png"
              alt="Effisort Software Solutions"
              class="auth-brand-logo"
            >
          </NuxtLink>

          <div class="auth-showcase-content">
            <span class="auth-eyebrow">
              <i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>
              Plataforma empresarial todo en uno
            </span>

            <h2>Gestiona tu facturación y operación desde un solo lugar.</h2>
            <p>
              Accede a tus clientes, comprobantes, inventario y reportes desde una
              experiencia organizada, segura y fácil de utilizar.
            </p>

            <div class="auth-visual" aria-hidden="true">
              <div class="auth-visual-glow"></div>
              <img src="/images/hero-image.png" alt="" class="auth-visual-image">
              <span class="auth-status auth-status-top">
                <i class="bi bi-shield-check"></i>
                Operación segura
              </span>
              <span class="auth-status auth-status-bottom">
                <i class="bi bi-check-circle-fill"></i>
                Todo bajo control
              </span>
            </div>

            <div class="auth-benefits">
              <span><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Panel intuitivo</span>
              <span><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Datos centralizados</span>
              <span><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Acceso seguro</span>
            </div>
          </div>
        </aside>

        <main class="col-lg-6 auth-panel">
          <div class="auth-mobile-header">
            <NuxtLink to="/" aria-label="Ir al inicio de Effisort">
              <img
                src="/images/effisort-logo.png"
                alt="Effisort Software Solutions"
                class="auth-mobile-logo"
              >
            </NuxtLink>
          </div>

          <div class="auth-card">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  --auth-navy: #031b45;
  --auth-navy-light: #082c64;
  --auth-primary: #0878ff;
  --auth-primary-dark: #0062d8;
  --auth-background: #f4f8fd;
  --auth-surface: #ffffff;
  --auth-text: #071d41;
  --auth-muted: #68758d;
  --auth-border: #e1e9f3;
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--auth-text);
  background: var(--auth-background);
}

.auth-container {
  position: relative;
  z-index: 1;
}

.auth-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(4px);
}

.auth-glow-top {
  top: -180px;
  right: -130px;
  width: 430px;
  height: 430px;
  background: rgba(8, 120, 255, 0.1);
}

.auth-glow-bottom {
  right: 32%;
  bottom: -260px;
  width: 540px;
  height: 540px;
  background: rgba(109, 67, 245, 0.08);
}

.auth-showcase {
  position: relative;
  display: flex;
  min-height: 100vh;
  padding: 36px clamp(38px, 5vw, 84px);
  overflow: hidden;
  color: #ffffff;
  background:
    radial-gradient(circle at 82% 16%, rgba(38, 132, 255, 0.3), transparent 30%),
    linear-gradient(145deg, var(--auth-navy) 0%, #04245b 58%, #073d8d 100%);
}

.auth-showcase::before,
.auth-showcase::after {
  position: absolute;
  content: '';
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.auth-showcase::before {
  top: 13%;
  right: -23%;
  width: 520px;
  height: 520px;
}

.auth-showcase::after {
  right: -5%;
  bottom: -24%;
  width: 420px;
  height: 420px;
}

.auth-brand {
  position: absolute;
  z-index: 2;
  top: 34px;
  left: clamp(38px, 5vw, 84px);
  display: inline-flex;
  align-items: center;
  width: 190px;
  height: 52px;
  padding: 10px 14px;
  
  box-shadow: 0 14px 35px rgba(0, 12, 38, 0.22);
}

.auth-brand-logo {
  display: block;
  width: 100%;
  height: auto;
}

.auth-showcase-content {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  max-width: 680px;
  margin: auto;
  padding-top: 84px;
  flex-direction: column;
  align-items: flex-start;
}

.auth-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 20px;
  padding: 8px 13px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  color: #d9eaff;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.auth-eyebrow i {
  color: #51a7ff;
}

.auth-showcase h2 {
  max-width: 620px;
  margin: 0;
  color: #ffffff;
  font-size: clamp(2.15rem, 3.6vw, 3.75rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.045em;
}

.auth-showcase-content > p {
  max-width: 580px;
  margin: 22px 0 12px;
  color: rgba(229, 239, 255, 0.78);
  font-size: 1rem;
  line-height: 1.75;
}

.auth-visual {
  position: relative;
  width: min(100%, 620px);
  min-height: 290px;
  margin: 4px auto 0;
}

.auth-visual-glow {
  position: absolute;
  inset: 20% 12% 6%;
  border-radius: 50%;
  background: rgba(42, 133, 255, 0.28);
  filter: blur(36px);
}

.auth-visual-image {
  position: relative;
  display: block;
  width: 100%;
  height: 310px;
  object-fit: contain;
  filter: drop-shadow(0 26px 30px rgba(0, 8, 31, 0.3));
}

.auth-status {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 12px;
  color: var(--auth-navy);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16px 35px rgba(0, 20, 60, 0.18);
  font-size: 0.78rem;
  font-weight: 700;
  backdrop-filter: blur(8px);
}

.auth-status i {
  color: var(--auth-primary);
  font-size: 1rem;
}

.auth-status-top {
  top: 44px;
  right: 2%;
}

.auth-status-bottom {
  bottom: 36px;
  left: 2%;
}

.auth-benefits {
  display: flex;
  width: 100%;
  gap: 18px;
  flex-wrap: wrap;
  color: rgba(235, 243, 255, 0.82);
  font-size: 0.78rem;
  font-weight: 600;
}

.auth-benefits span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.auth-benefits i {
  color: #59d79d;
}

.auth-panel {
  position: relative;
  display: flex;
  min-height: 100vh;
  padding: 48px clamp(24px, 6vw, 96px);
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 510px;
  padding: clamp(30px, 4vw, 48px);
  border: 1px solid rgba(225, 233, 243, 0.9);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 65px rgba(15, 42, 85, 0.12);
  backdrop-filter: blur(12px);
}

.auth-mobile-header {
  display: none;
}

@media (max-width: 1199.98px) {
  .auth-showcase {
    padding-inline: 42px;
  }

  .auth-brand {
    left: 42px;
  }

  .auth-visual {
    min-height: 250px;
  }

  .auth-visual-image {
    height: 270px;
  }
}

@media (max-width: 991.98px) {
  .auth-page {
    background:
      radial-gradient(circle at 100% 0%, rgba(8, 120, 255, 0.13), transparent 36%),
      var(--auth-background);
  }

  .auth-showcase {
    display: none;
  }

  .auth-panel {
    min-height: 100vh;
    padding: 112px 24px 36px;
    align-items: center;
  }

  .auth-mobile-header {
    position: absolute;
    top: 24px;
    left: 24px;
    display: block;
  }

  .auth-mobile-header a {
    display: inline-flex;
    width: 172px;
    padding: 8px 12px;
  }

  .auth-mobile-logo {
    display: block;
    width: 100%;
    height: auto;
  }
}

@media (max-width: 575.98px) {
  .auth-panel {
    padding: 96px 16px 20px;
    align-items: flex-start;
  }

  .auth-mobile-header {
    top: 18px;
    left: 16px;
  }

  .auth-mobile-header a {
    width: 158px;
    padding-left: 6px;
  }

  .auth-card {
    padding: 28px 20px 24px;
    border-radius: 20px;
    box-shadow: 0 18px 45px rgba(15, 42, 85, 0.1);
  }
}
</style>
