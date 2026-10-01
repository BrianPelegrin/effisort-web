<script setup lang="ts">
import type { Municipality, Province } from '~/types/location'
import type { RegisterField, RegisterFieldErrors, RegisterForm } from '~/types/register'
import { ApiError } from '~/utils/api'
import {
  REGISTER_FIELD_STEPS,
  buildRegisterFormData,
  mapRegisterApiErrors,
  validateRegisterForm,
  validateRegisterStep,
} from '~/utils/register'

definePageMeta({ layout: 'register' })

useHead({
  title: 'Crear cuenta | Effisort',
  meta: [
    { name: 'description', content: 'Registra tu empresa y crea la cuenta administradora de Effisort.' },
    { name: 'robots', content: 'noindex,nofollow' },
  ],
})

const steps = [
  { title: 'Empresa', subtitle: 'Datos del negocio', icon: 'bi bi-building' },
  { title: 'Administrador', subtitle: 'Acceso principal', icon: 'bi bi-person' },
  { title: 'Configuración', subtitle: 'Archivos opcionales', icon: 'bi bi-sliders' },
  { title: 'Confirmar', subtitle: 'Revisa y crea', icon: 'bi bi-check2-circle' },
] as const

const form = reactive<RegisterForm>({
  rnc: '',
  razonSocial: '',
  actividadEconomica: '',
  provinciaId: '',
  municipioId: '',
  fullName: '',
  phoneNumber: '',
  userName: '',
  email: '',
  confirmEmail: '',
  password: '',
  confirmPassword: '',
  logoEmpresa: null,
  certificadoFirmaDigital: null,
  passwordCertificadoFirmaDigital: '',
})

const { $api } = useNuxtApp()
const { getProvinces, getMunicipalitiesByProvince } = useLocationsApi()
const currentStep = ref(0)
const highestStep = ref(0)
const provinces = ref<Province[]>([])
const municipalities = ref<Municipality[]>([])
const locationsLoading = ref(true)
const municipalitiesLoading = ref(false)
const locationsError = ref('')
const fieldErrors = ref<RegisterFieldErrors>({})
const generalError = ref('')
const submitting = ref(false)
const unknownResult = ref(false)
const reviewConfirmed = ref(false)
const showPassword = ref(false)
const showCertificatePassword = ref(false)
const logoInputKey = ref(0)
const certificateInputKey = ref(0)
let municipalityRequest = 0

const activeStep = computed(() => steps[currentStep.value] ?? steps[0])
const selectedProvince = computed(() => provinces.value.find(item => item.codigo === form.provinciaId))
const selectedMunicipality = computed(() => municipalities.value.find(item => item.codigo === form.municipioId))
const passwordStrength = computed(() => {
  let score = 0
  if (form.password.length >= 6) score++
  if (form.password.length >= 10) score++
  if (/[A-Z]/.test(form.password) && /[a-z]/.test(form.password)) score++
  if (/\d/.test(form.password) && /[^\w\s]/.test(form.password)) score++
  return score
})
const passwordStrengthLabel = computed(() => ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'][passwordStrength.value])

onMounted(loadProvinces)

watch(() => form.provinciaId, async (provinceCode) => {
  form.municipioId = ''
  municipalities.value = []
  delete fieldErrors.value.municipioId
  if (!provinceCode) return

  await loadMunicipalities(provinceCode)
})

async function loadMunicipalities(provinceCode: string) {
  const requestId = ++municipalityRequest

  municipalitiesLoading.value = true
  locationsError.value = ''
  try {
    const response = await getMunicipalitiesByProvince(provinceCode)
    if (requestId === municipalityRequest) {
      municipalities.value = response.filter(item => item.activo && (!item.provinciaCodigo || item.provinciaCodigo === provinceCode))
    }
  } catch {
    if (requestId === municipalityRequest) {
      locationsError.value = 'No pudimos cargar los municipios. Inténtalo nuevamente.'
    }
  } finally {
    if (requestId === municipalityRequest) municipalitiesLoading.value = false
  }
}

onBeforeUnmount(clearSensitiveFields)

async function loadProvinces() {
  locationsLoading.value = true
  locationsError.value = ''
  try {
    provinces.value = (await getProvinces()).filter(item => item.activo)
  } catch {
    locationsError.value = 'No pudimos cargar las provincias. Verifica tu conexión e inténtalo nuevamente.'
  } finally {
    locationsLoading.value = false
  }
}

async function retryLocations() {
  if (form.provinciaId) await loadMunicipalities(form.provinciaId)
  else await loadProvinces()
}

function clearField(field: RegisterField) {
  delete fieldErrors.value[field]
  generalError.value = ''
}

async function focusFirstError(errors: RegisterFieldErrors) {
  const firstField = Object.keys(errors)[0]
  if (!firstField) return
  await nextTick()
  document.getElementById(firstField)?.focus()
}

async function nextStep() {
  const errors = validateRegisterStep(form, currentStep.value)
  fieldErrors.value = errors
  generalError.value = ''
  if (Object.keys(errors).length) {
    await focusFirstError(errors)
    return
  }

  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1)
  highestStep.value = Math.max(highestStep.value, currentStep.value)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function previousStep() {
  currentStep.value = Math.max(currentStep.value - 1, 0)
  generalError.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goToStep(step: number) {
  if (step > highestStep.value || submitting.value || unknownResult.value) return
  currentStep.value = step
  generalError.value = ''
}

function selectLogo(event: Event) {
  form.logoEmpresa = (event.target as HTMLInputElement).files?.[0] ?? null
  clearField('logoEmpresa')
}

function selectCertificate(event: Event) {
  form.certificadoFirmaDigital = (event.target as HTMLInputElement).files?.[0] ?? null
  clearField('certificadoFirmaDigital')
}

function removeLogo() {
  form.logoEmpresa = null
  logoInputKey.value++
  clearField('logoEmpresa')
}

function removeCertificate() {
  form.certificadoFirmaDigital = null
  form.passwordCertificadoFirmaDigital = ''
  certificateInputKey.value++
  clearField('certificadoFirmaDigital')
  clearField('passwordCertificadoFirmaDigital')
}

function clearSensitiveFields() {
  form.password = ''
  form.confirmPassword = ''
  form.passwordCertificadoFirmaDigital = ''
  form.logoEmpresa = null
  form.certificadoFirmaDigital = null
}

async function submitRegistration() {
  if (submitting.value || unknownResult.value) return

  const errors = validateRegisterForm(form)
  if (Object.keys(errors).length) {
    fieldErrors.value = errors
    const targetStep = Math.min(...Object.keys(errors).map(field => REGISTER_FIELD_STEPS[field as RegisterField]))
    currentStep.value = targetStep
    generalError.value = 'Revisa los campos marcados antes de continuar.'
    await focusFirstError(errors)
    return
  }

  if (!reviewConfirmed.value) {
    generalError.value = 'Confirma que revisaste la información antes de crear la cuenta.'
    return
  }

  submitting.value = true
  fieldErrors.value = {}
  generalError.value = ''

  try {
    await $api<unknown>('/api/auth/register', {
      method: 'POST',
      body: buildRegisterFormData(form),
      timeoutMs: 60_000,
      skipAuth: true,
    })
    clearSensitiveFields()
    await navigateTo('/auth/login?registered=1')
  } catch (error: unknown) {
    const apiError = error instanceof ApiError ? error : null
    const status = apiError?.status ?? 0

    if (status === 400) {
      const mapped = mapRegisterApiErrors(apiError?.body)
      fieldErrors.value = mapped.fieldErrors
      generalError.value = mapped.generalError || 'Revisa los datos ingresados.'
      const errorFields = Object.keys(mapped.fieldErrors) as RegisterField[]
      if (errorFields.length) {
        currentStep.value = Math.min(...errorFields.map(field => REGISTER_FIELD_STEPS[field]))
        await focusFirstError(mapped.fieldErrors)
      }
    } else if (status === 429) {
      generalError.value = 'Se realizaron demasiadas solicitudes. Espera antes de intentarlo manualmente de nuevo.'
    } else if (status === 413) {
      generalError.value = 'Los archivos adjuntos son demasiado grandes para el servidor.'
      currentStep.value = 2
    } else if (status === 415) {
      generalError.value = 'El servidor rechazó el formato de los archivos enviados.'
      currentStep.value = 2
    } else if (status === 0 || status >= 500) {
      unknownResult.value = true
      generalError.value = 'No pudimos confirmar el resultado. La cuenta podría haberse creado; por seguridad, no vuelvas a enviar el registro.'
    } else {
      generalError.value = apiError?.message || 'No pudimos completar el registro.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="register-page container">
    <div class="register-intro">
      <span class="register-kicker">Crea tu cuenta empresarial</span>
      <h1>Empieza con Effisort</h1>
      <p>Completa estos pasos para registrar tu empresa y crear el primer usuario administrador.</p>
    </div>

    <div class="wizard-shell">
      <nav class="wizard-progress" aria-label="Progreso del registro">
        <button
          v-for="(step, index) in steps"
          :key="step.title"
          type="button"
          class="wizard-step"
          :class="{ active: index === currentStep, complete: index < currentStep || index < highestStep }"
          :disabled="index > highestStep || submitting || unknownResult"
          :aria-current="index === currentStep ? 'step' : undefined"
          @click="goToStep(index)"
        >
          <span class="step-marker">
            <i v-if="index < currentStep || index < highestStep" class="bi bi-check-lg" aria-hidden="true"></i>
            <span v-else>{{ index + 1 }}</span>
          </span>
          <span class="step-copy">
            <strong>{{ step.title }}</strong>
            <small>{{ step.subtitle }}</small>
          </span>
        </button>
      </nav>

      <form class="wizard-card" novalidate @submit.prevent="currentStep === 3 ? submitRegistration() : nextStep()">
        <header class="step-heading">
          <span class="step-heading-icon"><i :class="activeStep.icon" aria-hidden="true"></i></span>
          <div>
            <span>Paso {{ currentStep + 1 }} de {{ steps.length }}</span>
            <h2>{{ activeStep.title }}</h2>
          </div>
        </header>

        <div v-if="generalError" class="register-alert" :class="{ 'register-alert-warning': unknownResult }" role="alert" aria-live="assertive">
          <i :class="unknownResult ? 'bi bi-question-circle-fill' : 'bi bi-exclamation-triangle-fill'" aria-hidden="true"></i>
          <div>
            <strong>{{ unknownResult ? 'Resultado sin confirmar' : 'No pudimos continuar' }}</strong>
            <span>{{ generalError }}</span>
          </div>
        </div>

        <section v-if="currentStep === 0" class="step-panel" aria-labelledby="company-step-title">
          <div class="section-copy">
            <h3 id="company-step-title">Cuéntanos sobre tu empresa</h3>
            <p>Usaremos estos datos para crear el espacio de trabajo de tu negocio.</p>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label for="rnc">RNC <span>*</span></label>
              <div class="input-shell" :class="{ invalid: fieldErrors.rnc }">
                <i class="bi bi-card-text" aria-hidden="true"></i>
                <input id="rnc" v-model="form.rnc" maxlength="11" autocomplete="off" placeholder="Ej. 101234567" @input="clearField('rnc')">
              </div>
              <small v-if="fieldErrors.rnc" class="field-error">{{ fieldErrors.rnc }}</small>
            </div>

            <div class="form-field">
              <label for="razonSocial">Razón social <span>*</span></label>
              <div class="input-shell" :class="{ invalid: fieldErrors.razonSocial }">
                <i class="bi bi-building" aria-hidden="true"></i>
                <input id="razonSocial" v-model="form.razonSocial" maxlength="50" autocomplete="organization" placeholder="Nombre legal de la empresa" @input="clearField('razonSocial')">
              </div>
              <small v-if="fieldErrors.razonSocial" class="field-error">{{ fieldErrors.razonSocial }}</small>
            </div>

            <div class="form-field form-field-wide">
              <label for="actividadEconomica">Actividad económica <span>*</span></label>
              <div class="input-shell" :class="{ invalid: fieldErrors.actividadEconomica }">
                <i class="bi bi-briefcase" aria-hidden="true"></i>
                <input id="actividadEconomica" v-model="form.actividadEconomica" maxlength="100" placeholder="Ej. Servicios de tecnología" @input="clearField('actividadEconomica')">
              </div>
              <small v-if="fieldErrors.actividadEconomica" class="field-error">{{ fieldErrors.actividadEconomica }}</small>
            </div>

            <div class="form-field">
              <label for="provinciaId">Provincia <span>*</span></label>
              <div class="input-shell select-shell" :class="{ invalid: fieldErrors.provinciaId }">
                <i class="bi bi-geo-alt" aria-hidden="true"></i>
                <select id="provinciaId" v-model="form.provinciaId" :disabled="locationsLoading || submitting" @change="clearField('provinciaId')">
                  <option value="">{{ locationsLoading ? 'Cargando provincias...' : 'Selecciona una provincia' }}</option>
                  <option v-for="province in provinces" :key="province.codigo" :value="province.codigo">{{ province.nombre }}</option>
                </select>
              </div>
              <small v-if="fieldErrors.provinciaId" class="field-error">{{ fieldErrors.provinciaId }}</small>
            </div>

            <div class="form-field">
              <label for="municipioId">Municipio <span>*</span></label>
              <div class="input-shell select-shell" :class="{ invalid: fieldErrors.municipioId }">
                <i class="bi bi-pin-map" aria-hidden="true"></i>
                <select id="municipioId" v-model="form.municipioId" :disabled="!form.provinciaId || municipalitiesLoading || submitting" @change="clearField('municipioId')">
                  <option value="">{{ municipalitiesLoading ? 'Cargando municipios...' : 'Selecciona un municipio' }}</option>
                  <option v-for="municipality in municipalities" :key="municipality.codigo" :value="municipality.codigo">{{ municipality.nombre }}</option>
                </select>
              </div>
              <small v-if="fieldErrors.municipioId" class="field-error">{{ fieldErrors.municipioId }}</small>
            </div>
          </div>

          <div v-if="locationsError" class="catalog-error" role="status">
            <span><i class="bi bi-wifi-off" aria-hidden="true"></i>{{ locationsError }}</span>
            <button type="button" @click="retryLocations">Reintentar</button>
          </div>
        </section>

        <section v-else-if="currentStep === 1" class="step-panel" aria-labelledby="admin-step-title">
          <div class="section-copy">
            <h3 id="admin-step-title">Crea el usuario administrador</h3>
            <p>Esta persona tendrá el acceso principal al espacio de trabajo.</p>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label for="fullName">Nombre completo <span>*</span></label>
              <div class="input-shell" :class="{ invalid: fieldErrors.fullName }">
                <i class="bi bi-person" aria-hidden="true"></i>
                <input id="fullName" v-model="form.fullName" autocomplete="name" placeholder="Nombre y apellido" @input="clearField('fullName')">
              </div>
              <small v-if="fieldErrors.fullName" class="field-error">{{ fieldErrors.fullName }}</small>
            </div>

            <div class="form-field">
              <label for="phoneNumber">Teléfono <span>*</span></label>
              <div class="input-shell" :class="{ invalid: fieldErrors.phoneNumber }">
                <i class="bi bi-telephone" aria-hidden="true"></i>
                <input id="phoneNumber" v-model="form.phoneNumber" maxlength="12" inputmode="tel" autocomplete="tel" placeholder="8095551234" @input="clearField('phoneNumber')">
              </div>
              <small v-if="fieldErrors.phoneNumber" class="field-error">{{ fieldErrors.phoneNumber }}</small>
            </div>

            <div class="form-field form-field-wide">
              <label for="userName">Nombre de usuario <span>*</span></label>
              <div class="input-shell" :class="{ invalid: fieldErrors.userName }">
                <i class="bi bi-at" aria-hidden="true"></i>
                <input id="userName" v-model="form.userName" minlength="6" autocomplete="username" placeholder="Mínimo 6 caracteres" @input="clearField('userName')">
              </div>
              <small v-if="fieldErrors.userName" class="field-error">{{ fieldErrors.userName }}</small>
            </div>

            <div class="form-field">
              <label for="email">Correo electrónico <span>*</span></label>
              <div class="input-shell" :class="{ invalid: fieldErrors.email }">
                <i class="bi bi-envelope" aria-hidden="true"></i>
                <input id="email" v-model="form.email" type="email" maxlength="80" autocomplete="email" placeholder="tu@empresa.com" @input="clearField('email')">
              </div>
              <small v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</small>
            </div>

            <div class="form-field">
              <label for="confirmEmail">Confirmar correo <span>*</span></label>
              <div class="input-shell" :class="{ invalid: fieldErrors.confirmEmail }">
                <i class="bi bi-envelope-check" aria-hidden="true"></i>
                <input id="confirmEmail" v-model="form.confirmEmail" type="email" maxlength="80" autocomplete="email" placeholder="Repite tu correo" @input="clearField('confirmEmail')">
              </div>
              <small v-if="fieldErrors.confirmEmail" class="field-error">{{ fieldErrors.confirmEmail }}</small>
            </div>

            <div class="form-field">
              <label for="password">Contraseña <span>*</span></label>
              <div class="input-shell" :class="{ invalid: fieldErrors.password }">
                <i class="bi bi-lock" aria-hidden="true"></i>
                <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" minlength="6" autocomplete="new-password" placeholder="Mínimo 6 caracteres" @input="clearField('password')">
                <button type="button" class="visibility-button" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" aria-hidden="true"></i>
                </button>
              </div>
              <div v-if="form.password" class="strength-row">
                <span class="strength-bars"><i v-for="level in 4" :key="level" :class="{ filled: level <= passwordStrength }"></i></span>
                <small>{{ passwordStrengthLabel }}</small>
              </div>
              <small v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</small>
            </div>

            <div class="form-field">
              <label for="confirmPassword">Confirmar contraseña <span>*</span></label>
              <div class="input-shell" :class="{ invalid: fieldErrors.confirmPassword }">
                <i class="bi bi-shield-lock" aria-hidden="true"></i>
                <input id="confirmPassword" v-model="form.confirmPassword" :type="showPassword ? 'text' : 'password'" minlength="6" autocomplete="new-password" placeholder="Repite tu contraseña" @input="clearField('confirmPassword')">
              </div>
              <small v-if="fieldErrors.confirmPassword" class="field-error">{{ fieldErrors.confirmPassword }}</small>
            </div>
          </div>
        </section>

        <section v-else-if="currentStep === 2" class="step-panel" aria-labelledby="setup-step-title">
          <div class="section-copy">
            <div>
              <h3 id="setup-step-title">Personaliza tu configuración</h3>
              <p>Puedes añadir estos archivos ahora o continuar sin ellos.</p>
            </div>
            <span class="optional-badge">Opcional</span>
          </div>

          <div class="upload-grid">
            <div class="upload-card" :class="{ invalid: fieldErrors.logoEmpresa }">
              <div class="upload-icon"><i class="bi bi-image" aria-hidden="true"></i></div>
              <div class="upload-copy">
                <strong>Logo de la empresa</strong>
                <span>Archivo PNG</span>
              </div>
              <label v-if="!form.logoEmpresa" for="logoEmpresa" class="upload-button">Seleccionar</label>
              <div v-else class="selected-file">
                <span><i class="bi bi-file-earmark-check" aria-hidden="true"></i>{{ form.logoEmpresa.name }}</span>
                <button type="button" aria-label="Quitar logo" @click="removeLogo"><i class="bi bi-x-lg"></i></button>
              </div>
              <input :key="logoInputKey" id="logoEmpresa" class="visually-hidden" type="file" accept="image/png,.png" @change="selectLogo">
              <small v-if="fieldErrors.logoEmpresa" class="field-error">{{ fieldErrors.logoEmpresa }}</small>
            </div>

            <div class="upload-card" :class="{ invalid: fieldErrors.certificadoFirmaDigital }">
              <div class="upload-icon upload-icon-certificate"><i class="bi bi-patch-check" aria-hidden="true"></i></div>
              <div class="upload-copy">
                <strong>Certificado de firma digital</strong>
                <span>Archivo P12</span>
              </div>
              <label v-if="!form.certificadoFirmaDigital" for="certificadoFirmaDigital" class="upload-button">Seleccionar</label>
              <div v-else class="selected-file">
                <span><i class="bi bi-file-earmark-lock" aria-hidden="true"></i>{{ form.certificadoFirmaDigital.name }}</span>
                <button type="button" aria-label="Quitar certificado" @click="removeCertificate"><i class="bi bi-x-lg"></i></button>
              </div>
              <input :key="certificateInputKey" id="certificadoFirmaDigital" class="visually-hidden" type="file" accept=".p12,application/x-pkcs12" @change="selectCertificate">
              <small v-if="fieldErrors.certificadoFirmaDigital" class="field-error">{{ fieldErrors.certificadoFirmaDigital }}</small>
            </div>
          </div>

          <div v-if="form.certificadoFirmaDigital" class="certificate-password">
            <div class="form-field">
              <label for="passwordCertificadoFirmaDigital">Clave del certificado <span>*</span></label>
              <div class="input-shell" :class="{ invalid: fieldErrors.passwordCertificadoFirmaDigital }">
                <i class="bi bi-key" aria-hidden="true"></i>
                <input id="passwordCertificadoFirmaDigital" v-model="form.passwordCertificadoFirmaDigital" :type="showCertificatePassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Clave del archivo P12" @input="clearField('passwordCertificadoFirmaDigital')">
                <button type="button" class="visibility-button" :aria-label="showCertificatePassword ? 'Ocultar clave' : 'Mostrar clave'" @click="showCertificatePassword = !showCertificatePassword">
                  <i :class="showCertificatePassword ? 'bi bi-eye-slash' : 'bi bi-eye'" aria-hidden="true"></i>
                </button>
              </div>
              <small v-if="fieldErrors.passwordCertificadoFirmaDigital" class="field-error">{{ fieldErrors.passwordCertificadoFirmaDigital }}</small>
            </div>
          </div>

          <div class="privacy-note">
            <i class="bi bi-shield-check" aria-hidden="true"></i>
            <div><strong>Protegemos tus datos sensibles</strong><span>La clave y los archivos no se guardan en el navegador. La configuración fiscal puede requerir pasos adicionales después del registro.</span></div>
          </div>
        </section>

        <section v-else class="step-panel" aria-labelledby="review-step-title">
          <div class="section-copy">
            <h3 id="review-step-title">Revisa antes de crear tu cuenta</h3>
            <p>Verifica que la información sea correcta. Las claves nunca se muestran en este resumen.</p>
          </div>

          <div class="review-grid">
            <article class="review-card">
              <header><span><i class="bi bi-building" aria-hidden="true"></i>Empresa</span><button type="button" @click="goToStep(0)">Editar</button></header>
              <dl>
                <div><dt>Razón social</dt><dd>{{ form.razonSocial }}</dd></div>
                <div><dt>RNC</dt><dd>{{ form.rnc }}</dd></div>
                <div><dt>Actividad</dt><dd>{{ form.actividadEconomica }}</dd></div>
                <div><dt>Ubicación</dt><dd>{{ selectedMunicipality?.nombre }}, {{ selectedProvince?.nombre }}</dd></div>
              </dl>
            </article>

            <article class="review-card">
              <header><span><i class="bi bi-person" aria-hidden="true"></i>Administrador</span><button type="button" @click="goToStep(1)">Editar</button></header>
              <dl>
                <div><dt>Nombre</dt><dd>{{ form.fullName }}</dd></div>
                <div><dt>Usuario</dt><dd>{{ form.userName }}</dd></div>
                <div><dt>Correo</dt><dd>{{ form.email }}</dd></div>
                <div><dt>Teléfono</dt><dd>{{ form.phoneNumber }}</dd></div>
              </dl>
            </article>

            <article class="review-card review-card-wide">
              <header><span><i class="bi bi-sliders" aria-hidden="true"></i>Configuración</span><button type="button" @click="goToStep(2)">Editar</button></header>
              <div class="asset-summary">
                <span><i :class="form.logoEmpresa ? 'bi bi-check-circle-fill' : 'bi bi-dash-circle'" aria-hidden="true"></i>Logo: {{ form.logoEmpresa?.name || 'No incluido' }}</span>
                <span><i :class="form.certificadoFirmaDigital ? 'bi bi-check-circle-fill' : 'bi bi-dash-circle'" aria-hidden="true"></i>Certificado: {{ form.certificadoFirmaDigital?.name || 'No incluido' }}</span>
              </div>
            </article>
          </div>

          <label class="review-confirmation" :class="{ disabled: submitting || unknownResult }">
            <input v-model="reviewConfirmed" type="checkbox" :disabled="submitting || unknownResult">
            <span>Confirmo que revisé los datos y deseo crear la empresa y su cuenta administradora.</span>
          </label>

          <div v-if="unknownResult" class="unknown-actions">
            <p>Prueba iniciar sesión con el correo y la contraseña que acabas de crear. Si no funciona, contacta a soporte antes de intentar otro registro.</p>
            <NuxtLink to="/auth/login" class="primary-action"><i class="bi bi-box-arrow-in-right"></i>Ir a iniciar sesión</NuxtLink>
          </div>
        </section>

        <footer v-if="!unknownResult" class="wizard-actions">
          <button v-if="currentStep > 0" type="button" class="secondary-action" :disabled="submitting" @click="previousStep">
            <i class="bi bi-arrow-left" aria-hidden="true"></i>Anterior
          </button>
          <span v-else></span>

          <button type="submit" class="primary-action" :disabled="submitting || (currentStep === 0 && !!locationsError)">
            <span v-if="submitting" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
            <template v-if="currentStep === 3">
              <span>{{ submitting ? 'Creando cuenta...' : 'Crear cuenta' }}</span>
              <i v-if="!submitting" class="bi bi-check2-circle" aria-hidden="true"></i>
            </template>
            <template v-else>
              <span>Continuar</span><i class="bi bi-arrow-right" aria-hidden="true"></i>
            </template>
          </button>
        </footer>
      </form>

      <p class="required-note"><span>*</span> Campos obligatorios</p>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  --primary: #0878ff;
  --primary-dark: #0062d8;
  --navy: #071d41;
  --muted: #68758d;
  --border: #dfe8f3;
  max-width: 1120px;
  padding-top: 48px;
  padding-bottom: 28px;
}

.register-intro {
  margin: 0 auto 30px;
  text-align: center;
}

.register-kicker {
  display: block;
  margin-bottom: 8px;
  color: var(--primary);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.register-intro h1 {
  margin: 0;
  color: var(--navy);
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 850;
  letter-spacing: -0.04em;
}

.register-intro p {
  max-width: 650px;
  margin: 10px auto 0;
  color: var(--muted);
  line-height: 1.65;
}

.wizard-shell {
  position: relative;
}

.wizard-progress {
  display: grid;
  max-width: 900px;
  margin: 0 auto 18px;
  grid-template-columns: repeat(4, 1fr);
}

.wizard-step {
  position: relative;
  display: flex;
  padding: 0 14px;
  gap: 10px;
  border: 0;
  align-items: center;
  color: #8a96a8;
  background: transparent;
  text-align: left;
}

.wizard-step:not(:last-child)::after {
  position: absolute;
  z-index: -1;
  top: 20px;
  left: 56px;
  width: calc(100% - 42px);
  height: 2px;
  content: '';
  background: #d8e3ef;
}

.wizard-step.complete:not(:last-child)::after {
  background: #54b88a;
}

.wizard-step:disabled {
  opacity: 1;
}

.step-marker {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border: 2px solid #d2deeb;
  border-radius: 50%;
  place-items: center;
  color: #78869b;
  background: #f7faff;
  font-size: 0.8rem;
  font-weight: 800;
}

.wizard-step.active .step-marker {
  border-color: var(--primary);
  color: #fff;
  background: var(--primary);
  box-shadow: 0 7px 18px rgba(8, 120, 255, 0.25);
}

.wizard-step.complete .step-marker {
  border-color: #28a76f;
  color: #fff;
  background: #28a76f;
}

.step-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.step-copy strong {
  color: #516077;
  font-size: 0.82rem;
}

.wizard-step.active .step-copy strong {
  color: var(--navy);
}

.step-copy small {
  margin-top: 2px;
  font-size: 0.7rem;
}

.wizard-card {
  max-width: 930px;
  margin: 0 auto;
  padding: clamp(24px, 4vw, 44px);
  border: 1px solid rgba(214, 225, 239, 0.92);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 65px rgba(24, 55, 97, 0.11);
}

.step-heading {
  display: flex;
  margin-bottom: 28px;
  gap: 13px;
  align-items: center;
}

.step-heading-icon {
  display: grid;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  place-items: center;
  color: var(--primary);
  background: #eaf4ff;
  font-size: 1.25rem;
}

.step-heading span:not(.step-heading-icon) {
  display: block;
  margin-bottom: 2px;
  color: #8793a6;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.step-heading h2 {
  margin: 0;
  color: var(--navy);
  font-size: 1.5rem;
  font-weight: 800;
}

.section-copy {
  display: flex;
  margin-bottom: 25px;
  align-items: flex-start;
  justify-content: space-between;
}

.section-copy h3 {
  margin: 0;
  color: var(--navy);
  font-size: 1.08rem;
  font-weight: 800;
}

.section-copy p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.55;
}

.optional-badge {
  padding: 6px 10px;
  border-radius: 999px;
  color: #5b6d86;
  background: #edf2f8;
  font-size: 0.7rem;
  font-weight: 750;
}

.form-grid {
  display: grid;
  gap: 21px 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-field-wide {
  grid-column: 1 / -1;
}

.form-field label {
  display: block;
  margin-bottom: 8px;
  color: #213a60;
  font-size: 0.82rem;
  font-weight: 750;
}

.form-field label span,
.required-note span {
  color: #e24c5c;
}

.input-shell {
  display: flex;
  height: 52px;
  border: 1px solid var(--border);
  border-radius: 12px;
  align-items: center;
  overflow: hidden;
  background: #fff;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.input-shell:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(8, 120, 255, 0.1);
}

.input-shell.invalid,
.upload-card.invalid {
  border-color: #dc5261;
}

.input-shell > i {
  display: grid;
  width: 46px;
  height: 100%;
  flex: 0 0 46px;
  place-items: center;
  color: #8391a5;
}

.input-shell input,
.input-shell select {
  width: 100%;
  height: 100%;
  padding: 0 14px 0 0;
  border: 0;
  outline: 0;
  color: #102a50;
  background: transparent;
  font-size: 0.9rem;
}

.input-shell input::placeholder {
  color: #a3adbc;
}

.input-shell select:disabled {
  color: #97a3b4;
  background: #f8fafc;
}

.visibility-button {
  display: grid;
  width: 46px;
  height: 100%;
  flex: 0 0 46px;
  border: 0;
  place-items: center;
  color: #718096;
  background: transparent;
}

.visibility-button:hover {
  color: var(--primary);
  background: #f3f8ff;
}

.field-error {
  display: block;
  margin-top: 6px;
  color: #bd3545;
  font-size: 0.74rem;
  font-weight: 650;
}

.strength-row {
  display: flex;
  margin-top: 7px;
  gap: 9px;
  align-items: center;
  color: #718096;
}

.strength-bars {
  display: grid;
  width: 92px;
  gap: 4px;
  grid-template-columns: repeat(4, 1fr);
}

.strength-bars i {
  height: 4px;
  border-radius: 4px;
  background: #dfe7f1;
}

.strength-bars i.filled {
  background: var(--primary);
}

.strength-row small {
  font-size: 0.7rem;
}

.catalog-error {
  display: flex;
  margin-top: 18px;
  padding: 11px 13px;
  border-radius: 10px;
  align-items: center;
  justify-content: space-between;
  color: #8b5914;
  background: #fff8e9;
  font-size: 0.78rem;
}

.catalog-error span {
  display: flex;
  gap: 8px;
  align-items: center;
}

.catalog-error button {
  border: 0;
  color: #81500e;
  background: transparent;
  font-weight: 800;
  text-decoration: underline;
}

.upload-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.upload-card {
  display: grid;
  min-height: 210px;
  padding: 24px;
  border: 1px dashed #bdcde0;
  border-radius: 16px;
  place-items: center;
  align-content: center;
  background: #f9fbfe;
  text-align: center;
}

.upload-icon {
  display: grid;
  width: 50px;
  height: 50px;
  margin-bottom: 10px;
  border-radius: 14px;
  place-items: center;
  color: var(--primary);
  background: #e8f3ff;
  font-size: 1.25rem;
}

.upload-icon-certificate {
  color: #6942df;
  background: #f0ebff;
}

.upload-copy {
  display: flex;
  margin-bottom: 14px;
  flex-direction: column;
}

.upload-copy strong {
  color: var(--navy);
  font-size: 0.9rem;
}

.upload-copy span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.74rem;
}

.upload-button {
  padding: 8px 14px;
  border: 1px solid #bfd0e4;
  border-radius: 9px;
  color: #24466f;
  background: #fff;
  font-size: 0.76rem;
  font-weight: 750;
  cursor: pointer;
}

.selected-file {
  display: flex;
  width: 100%;
  padding: 9px 10px;
  gap: 8px;
  border: 1px solid #dbe6f1;
  border-radius: 9px;
  align-items: center;
  justify-content: space-between;
  background: #fff;
}

.selected-file span {
  display: flex;
  min-width: 0;
  gap: 6px;
  align-items: center;
  overflow: hidden;
  color: #3f536f;
  font-size: 0.73rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-file span i {
  color: #23a16a;
}

.selected-file button {
  border: 0;
  color: #8490a3;
  background: transparent;
}

.certificate-password {
  max-width: 520px;
  margin-top: 22px;
}

.privacy-note {
  display: flex;
  margin-top: 24px;
  padding: 14px 16px;
  gap: 12px;
  border: 1px solid #d8e9fb;
  border-radius: 12px;
  color: #28608f;
  background: #f2f8ff;
}

.privacy-note > i {
  color: #188b5d;
  font-size: 1.1rem;
}

.privacy-note div {
  display: flex;
  flex-direction: column;
}

.privacy-note strong {
  font-size: 0.78rem;
}

.privacy-note span {
  margin-top: 2px;
  color: #5f728d;
  font-size: 0.73rem;
  line-height: 1.5;
}

.review-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.review-card {
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fbfdff;
}

.review-card-wide {
  grid-column: 1 / -1;
}

.review-card header {
  display: flex;
  margin-bottom: 16px;
  align-items: center;
  justify-content: space-between;
}

.review-card header span {
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--navy);
  font-size: 0.85rem;
  font-weight: 800;
}

.review-card header i {
  color: var(--primary);
}

.review-card header button {
  border: 0;
  color: var(--primary-dark);
  background: transparent;
  font-size: 0.73rem;
  font-weight: 750;
}

.review-card dl {
  display: grid;
  margin: 0;
  gap: 11px;
}

.review-card dl div {
  display: grid;
  gap: 3px;
  grid-template-columns: 110px minmax(0, 1fr);
}

.review-card dt {
  color: #7a8799;
  font-size: 0.73rem;
  font-weight: 600;
}

.review-card dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: #2f435f;
  font-size: 0.77rem;
  font-weight: 700;
}

.asset-summary {
  display: flex;
  gap: 16px 30px;
  flex-wrap: wrap;
  color: #50627a;
  font-size: 0.78rem;
}

.asset-summary span {
  display: flex;
  gap: 7px;
  align-items: center;
}

.asset-summary .bi-check-circle-fill {
  color: #23a16a;
}

.asset-summary .bi-dash-circle {
  color: #96a1b1;
}

.review-confirmation {
  display: flex;
  margin-top: 20px;
  padding: 15px 16px;
  gap: 11px;
  border: 1px solid #dbe5f0;
  border-radius: 12px;
  align-items: flex-start;
  color: #40536e;
  background: #fff;
  font-size: 0.8rem;
  line-height: 1.5;
  cursor: pointer;
}

.review-confirmation input {
  width: 17px;
  height: 17px;
  margin-top: 1px;
  accent-color: var(--primary);
}

.review-confirmation.disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

.register-alert {
  display: flex;
  margin-bottom: 22px;
  padding: 13px 15px;
  gap: 11px;
  border: 1px solid #efc3c9;
  border-radius: 11px;
  color: #982d3b;
  background: #fff5f6;
}

.register-alert-warning {
  border-color: #edd39c;
  color: #80530e;
  background: #fff9eb;
}

.register-alert div {
  display: flex;
  flex-direction: column;
}

.register-alert strong {
  font-size: 0.79rem;
}

.register-alert span {
  margin-top: 2px;
  font-size: 0.77rem;
  line-height: 1.45;
}

.unknown-actions {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid #e4d09f;
  border-radius: 12px;
  background: #fffaf0;
}

.unknown-actions p {
  margin: 0 0 14px;
  color: #6f561f;
  font-size: 0.8rem;
  line-height: 1.55;
}

.wizard-actions {
  display: flex;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e6edf5;
  align-items: center;
  justify-content: space-between;
}

.primary-action,
.secondary-action {
  display: inline-flex;
  min-height: 48px;
  padding: 11px 19px;
  gap: 9px;
  border-radius: 11px;
  align-items: center;
  justify-content: center;
  font-size: 0.84rem;
  font-weight: 800;
  text-decoration: none;
}

.primary-action {
  border: 1px solid var(--primary);
  color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  box-shadow: 0 11px 23px rgba(8, 120, 255, 0.2);
}

.primary-action:hover:not(:disabled) {
  color: #fff;
  transform: translateY(-1px);
}

.primary-action:disabled {
  cursor: not-allowed;
  opacity: 0.63;
}

.secondary-action {
  border: 1px solid #cbd8e7;
  color: #425673;
  background: #fff;
}

.required-note {
  max-width: 930px;
  margin: 12px auto 0;
  color: #8b97a8;
  font-size: 0.71rem;
  text-align: right;
}

@media (max-width: 767.98px) {
  .register-page {
    padding-top: 32px;
  }

  .register-intro {
    margin-bottom: 24px;
  }

  .register-intro p {
    font-size: 0.88rem;
  }

  .wizard-progress {
    gap: 6px;
  }

  .wizard-step {
    padding: 0;
    justify-content: center;
  }

  .wizard-step:not(:last-child)::after {
    left: calc(50% + 23px);
    width: calc(100% - 40px);
  }

  .step-copy {
    display: none;
  }

  .wizard-card {
    border-radius: 18px;
  }

  .form-grid,
  .upload-grid,
  .review-grid {
    grid-template-columns: 1fr;
  }

  .form-field-wide,
  .review-card-wide {
    grid-column: auto;
  }
}

@media (max-width: 575.98px) {
  .register-page {
    padding-right: 12px;
    padding-left: 12px;
  }

  .wizard-card {
    padding: 22px 17px;
  }

  .step-heading {
    margin-bottom: 22px;
  }

  .section-copy {
    gap: 12px;
  }

  .wizard-actions {
    gap: 10px;
  }

  .primary-action,
  .secondary-action {
    padding: 10px 14px;
  }

  .review-card dl div {
    grid-template-columns: 1fr;
  }
}
</style>
