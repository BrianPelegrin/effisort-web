<script setup lang="ts">
import type { LoginRequest, ValidationProblemDetails } from '~/types/auth'
import { validateLoginResponse } from '~/utils/auth'

definePageMeta({
  layout: 'auth',
})

interface ApiError {
  status?: number
  statusCode?: number
  data?: ValidationProblemDetails | string
}

const auth = useAuthStore()
const { $api } = useNuxtApp()

const form = reactive({
  email: '',
  password: '',
  remember: false,
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string>>({})

function validateForm() {
  const errors: Record<string, string> = {}

  if (!form.email) {
    errors.email = 'El correo es requerido.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Ingresa un correo válido.'
  }

  if (!form.password) errors.password = 'La contraseña es requerida.'

  fieldErrors.value = errors
  return Object.keys(errors).length === 0
}

function applyBackendValidation(data: ValidationProblemDetails) {
  const errors: Record<string, string> = {}

  for (const [field, messages] of Object.entries(data.errors ?? {})) {
    const normalizedField = field.split('.').at(-1)?.toLowerCase() ?? ''
    if (['email', 'password'].includes(normalizedField) && messages[0]) {
      errors[normalizedField] = messages[0]
    }
  }

  fieldErrors.value = errors
  if (!Object.keys(errors).length) error.value = data.title || 'Revisa los datos ingresados.'
}

async function onSubmit() {
  error.value = ''
  fieldErrors.value = {}
  if (!validateForm()) return

  loading.value = true
  let credentialsAccepted = false

  try {
    const request: LoginRequest = {
      email: form.email,
      password: form.password,
    }

    const response = validateLoginResponse(await $api<unknown>('/api/auth/login', {
      method: 'POST',
      body: request,
    }))

    auth.setSession(response.token, form.remember)
    credentialsAccepted = true
    await auth.loadProfile()
    await navigateTo('/admin')
  } catch (caughtError: unknown) {
    const apiError = caughtError as ApiError
    const status = apiError.statusCode ?? apiError.status

    if (status === 400 && apiError.data && typeof apiError.data === 'object') {
      applyBackendValidation(apiError.data)
    } else if (status === 401) {
      error.value = credentialsAccepted
        ? 'La sesión fue creada, pero el servidor no pudo validar el perfil del usuario.'
        : typeof apiError.data === 'string' && apiError.data.trim()
          ? apiError.data
          : 'Usuario o contraseña incorrectos.'
    } else if (status === 429) {
      error.value = 'Se realizaron demasiados intentos. Espera un momento antes de intentar nuevamente.'
    } else {
      error.value = credentialsAccepted
        ? 'La sesión fue creada, pero no pudimos cargar la empresa. Verifica tu conexión e inténtalo nuevamente.'
        : caughtError instanceof Error && !status
          ? caughtError.message
          : 'No pudimos iniciar sesión. Verifica tu conexión e inténtalo nuevamente.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-form">
    <div class="login-heading">
      <span class="login-kicker">Bienvenido a Effisort</span>
      <h1>Iniciar sesión</h1>
      <p>Ingresa tus credenciales para acceder al panel de administración.</p>
    </div>

    <form novalidate @submit.prevent="onSubmit">
      <div class="form-field">
        <label for="email" class="form-label">Correo electrónico</label>
        <div class="input-shell" :class="{ 'input-shell-invalid': fieldErrors.email }">
          <span class="input-icon" aria-hidden="true">
            <i class="bi bi-envelope"></i>
          </span>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            class="form-control"
            :class="{ 'is-invalid': fieldErrors.email }"
            placeholder="tu@correo.com"
            :disabled="loading"
            :aria-describedby="fieldErrors.email ? 'email-error' : undefined"
            required
          >
        </div>
        <div v-if="fieldErrors.email" id="email-error" class="field-error">
          <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
          {{ fieldErrors.email }}
        </div>
      </div>

      <div class="form-field">
        <div class="field-label-row">
          <label for="password" class="form-label">Contraseña</label>
          <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
        </div>

        <div class="input-shell" :class="{ 'input-shell-invalid': fieldErrors.password }">
          <span class="input-icon" aria-hidden="true">
            <i class="bi bi-lock"></i>
          </span>
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            class="form-control password-input"
            :class="{ 'is-invalid': fieldErrors.password }"
            placeholder="••••••••"
            :disabled="loading"
            :aria-describedby="fieldErrors.password ? 'password-error' : undefined"
            required
          >
          <button
            type="button"
            class="password-toggle"
            :disabled="loading"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" aria-hidden="true"></i>
          </button>
        </div>
        <div v-if="fieldErrors.password" id="password-error" class="field-error">
          <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
          {{ fieldErrors.password }}
        </div>
      </div>

      <div class="form-options">
        <div class="form-check">
          <input
            id="remember"
            v-model="form.remember"
            class="form-check-input"
            type="checkbox"
            :disabled="loading"
          >
          <label class="form-check-label" for="remember">Mantener mi sesión iniciada</label>
        </div>
      </div>

      <div v-if="error" class="login-alert" role="alert" aria-live="polite">
        <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
        <span>{{ error }}</span>
      </div>

      <button type="submit" class="login-button" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        <span>{{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}</span>
        <i v-if="!loading" class="bi bi-arrow-right" aria-hidden="true"></i>
      </button>

      <div class="login-divider" aria-hidden="true">
        <span>o</span>
      </div>

      <button type="button" class="register-button">
        <i class="bi bi-person-plus" aria-hidden="true"></i>
        Regístrate con nosotros
      </button>
    </form>

    <p class="login-footer">© {{ new Date().getFullYear() }} Effisort. Todos los derechos reservados.</p>
  </div>
</template>

<style scoped>
.login-form {
  --login-primary: #0878ff;
  --login-primary-dark: #0062d8;
  --login-text: #071d41;
  --login-muted: #68758d;
  --login-border: #dce6f2;
  color: var(--login-text);
}

.login-heading {
  margin-bottom: 32px;
}

.login-kicker {
  display: block;
  margin-bottom: 9px;
  color: var(--login-primary);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.login-heading h1 {
  margin: 0;
  color: var(--login-text);
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.035em;
}

.login-heading p {
  margin: 12px 0 0;
  color: var(--login-muted);
  font-size: 0.94rem;
  line-height: 1.65;
}

.form-field {
  margin-bottom: 21px;
}

.field-label-row {
  display: flex;
  margin-bottom: 9px;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.form-label {
  margin-bottom: 9px;
  color: var(--login-text);
  font-size: 0.86rem;
  font-weight: 700;
}

.field-label-row .form-label {
  margin-bottom: 0;
}

.forgot-link {
  color: var(--login-primary-dark);
  font-size: 0.79rem;
  font-weight: 700;
  text-decoration: none;
}

.forgot-link:hover {
  color: #004eae;
  text-decoration: underline;
}

.input-shell {
  position: relative;
  display: flex;
  height: 54px;
  border: 1px solid var(--login-border);
  border-radius: 13px;
  overflow: hidden;
  align-items: center;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-shell:focus-within {
  border-color: var(--login-primary);
  box-shadow: 0 0 0 4px rgba(8, 120, 255, 0.11);
}

.input-shell-invalid {
  border-color: #dc3545;
}

.input-shell-invalid:focus-within {
  border-color: #dc3545;
  box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.1);
}

.input-icon {
  display: grid;
  width: 48px;
  height: 100%;
  flex: 0 0 48px;
  place-items: center;
  color: #8190a8;
  font-size: 1rem;
}

.input-shell:focus-within .input-icon {
  color: var(--login-primary);
}

.input-shell .form-control {
  height: 100%;
  padding: 0 14px 0 0;
  border: 0;
  border-radius: 0;
  color: var(--login-text);
  background: transparent;
  font-size: 0.94rem;
  box-shadow: none;
}

.input-shell .form-control::placeholder {
  color: #a5afbf;
}

.input-shell .form-control:disabled {
  background: #f8fafc;
  opacity: 0.72;
}

.input-shell .form-control.is-invalid {
  padding-right: 14px;
  background-image: none;
}

.password-input {
  padding-right: 4px !important;
}

.password-toggle {
  display: grid;
  width: 48px;
  height: 100%;
  flex: 0 0 48px;
  padding: 0;
  border: 0;
  color: #718096;
  background: transparent;
  font-size: 1.05rem;
  place-items: center;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.password-toggle:hover:not(:disabled) {
  color: var(--login-primary);
  background: #f3f8ff;
}

.field-error {
  display: flex;
  margin-top: 7px;
  gap: 6px;
  align-items: center;
  color: #c72c3c;
  font-size: 0.78rem;
  font-weight: 600;
}

.form-options {
  display: flex;
  margin: 4px 0 22px;
  align-items: center;
  justify-content: space-between;
}

.form-check {
  display: flex;
  min-height: auto;
  margin: 0;
  gap: 9px;
  align-items: center;
}

.form-check-input {
  width: 1.05rem;
  height: 1.05rem;
  margin: 0;
  border-color: #b8c5d6;
  box-shadow: none;
}

.form-check-input:checked {
  border-color: var(--login-primary);
  background-color: var(--login-primary);
}

.form-check-input:focus {
  border-color: var(--login-primary);
  box-shadow: 0 0 0 3px rgba(8, 120, 255, 0.12);
}

.form-check-label {
  color: #536178;
  font-size: 0.82rem;
}

.login-alert {
  display: flex;
  margin-bottom: 18px;
  padding: 12px 14px;
  gap: 10px;
  align-items: flex-start;
  border: 1px solid #f2c8ce;
  border-radius: 11px;
  color: #9f2332;
  background: #fff5f6;
  font-size: 0.82rem;
  line-height: 1.45;
}

.login-alert i {
  margin-top: 1px;
}

.login-button,
.register-button {
  display: flex;
  width: 100%;
  min-height: 52px;
  padding: 12px 18px;
  gap: 10px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 750;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.login-button {
  border: 1px solid var(--login-primary);
  color: #ffffff;
  background: linear-gradient(135deg, var(--login-primary), var(--login-primary-dark));
  box-shadow: 0 12px 24px rgba(8, 120, 255, 0.22);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 15px 28px rgba(8, 120, 255, 0.28);
}

.login-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.login-divider {
  display: flex;
  margin: 23px 0;
  align-items: center;
  color: #98a4b6;
  font-size: 0.76rem;
}

.login-divider::before,
.login-divider::after {
  height: 1px;
  flex: 1;
  content: '';
  background: #e4ebf4;
}

.login-divider span {
  padding: 0 14px;
}

.register-button {
  border: 1px solid #b7c9e0;
  color: #14376a;
  background: #ffffff;
}

.register-button:hover {
  transform: translateY(-1px);
  border-color: var(--login-primary);
  color: var(--login-primary-dark);
  background: #f5f9ff;
  box-shadow: 0 10px 24px rgba(20, 55, 106, 0.09);
}

.login-footer {
  margin: 28px 0 0;
  color: #8995a8;
  font-size: 0.75rem;
  text-align: center;
}

@media (max-width: 575.98px) {
  .login-heading {
    margin-bottom: 26px;
  }

  .login-heading h1 {
    font-size: 2rem;
  }

  .field-label-row {
    align-items: flex-start;
  }

  .forgot-link {
    max-width: 132px;
    text-align: right;
  }

  .input-shell {
    height: 52px;
  }

  .login-footer {
    margin-top: 23px;
  }
}
</style>
