<script setup lang="ts">
import type { LoginRequest, LoginResponse, ValidationProblemDetails } from '~/types/auth'

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
  remember: true,
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

  try {
    const request: LoginRequest = {
      email: form.email,
      password: form.password,
    }

    const response = await $api<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: request,
    })

    if (!response?.token) throw new Error('La respuesta del servidor no contiene un token.')

    auth.setSession(response.token, form.remember)
    await navigateTo('/admin')
  } catch (caughtError: unknown) {
    const apiError = caughtError as ApiError
    const status = apiError.statusCode ?? apiError.status

    if (status === 400 && apiError.data && typeof apiError.data === 'object') {
      applyBackendValidation(apiError.data)
    } else if (status === 401) {
      error.value = typeof apiError.data === 'string' && apiError.data.trim()
        ? apiError.data
        : 'Usuario o contraseña incorrectos.'
    } else if (status === 429) {
      error.value = 'Se realizaron demasiados intentos. Espera un momento antes de intentar nuevamente.'
    } else {
      error.value = caughtError instanceof Error && !status
        ? caughtError.message
        : 'No pudimos iniciar sesión. Verifica tu conexión e inténtalo nuevamente.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-4">
      <h1 class="h3 fw-bold mb-1">Iniciar sesión</h1>
      <div class="text-muted">Bienvenido de vuelta. Ingresa tus credenciales.</div>
    </div>

    <form novalidate @submit.prevent="onSubmit">
      <div class="mb-3">
        <label for="email" class="form-label">Correo</label>
        <input
          id="email"
          v-model.trim="form.email"
          type="email"
          autocomplete="email"
          class="form-control form-control-lg rounded-12"
          :class="{ 'is-invalid': fieldErrors.email }"
          placeholder="tu@correo.com"
          :disabled="loading"
          required
        >
        <div v-if="fieldErrors.email" class="invalid-feedback">{{ fieldErrors.email }}</div>
      </div>

      <div class="mb-3">
        <label for="password" class="form-label d-flex justify-content-between">
          <span>Contraseña</span>
          <a href="#" class="text-decoration-none small">¿Olvidaste tu contraseña?</a>
        </label>

        <div class="input-group input-group-lg" :class="{ 'has-validation': fieldErrors.password }">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            class="form-control rounded-12-left"
            :class="{ 'is-invalid': fieldErrors.password }"
            placeholder="••••••••"
            :disabled="loading"
            required
          >
          <button
            type="button"
            class="btn btn-outline-secondary rounded-12-right"
            :disabled="loading"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? 'Ocultar' : 'Mostrar' }}
          </button>
          <div v-if="fieldErrors.password" class="invalid-feedback">{{ fieldErrors.password }}</div>
        </div>
      </div>

      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="form-check">
          <input id="remember" v-model="form.remember" class="form-check-input" type="checkbox" :disabled="loading">
          <label class="form-check-label" for="remember">Recordarme</label>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger py-2" role="alert" aria-live="polite">
        {{ error }}
      </div>

      <button
        type="submit"
        class="btn btn-primary btn-lg w-100 d-inline-flex align-items-center justify-content-center gap-2 rounded-12"
        :disabled="loading"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm" aria-hidden="true" />
        <span>{{ loading ? 'Entrando...' : 'Entrar' }}</span>
      </button>

      <div class="d-flex align-items-center gap-3 my-4">
        <div class="flex-grow-1 border-top" />
        <div class="text-muted small">o</div>
        <div class="flex-grow-1 border-top" />
      </div>

      <button type="button" class="btn btn-outline-success btn-lg w-100 rounded-12">
        Regístrate con nosotros
      </button>
    </form>

    <div class="text-center text-muted small mt-4">
      © {{ new Date().getFullYear() }} Effisort. Todos los derechos reservados.
    </div>
  </div>
</template>

<style scoped>
.rounded-12 {
  border-radius: 12px;
}

.rounded-12-left {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.rounded-12-right {
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>
