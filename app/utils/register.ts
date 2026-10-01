import {
  REGISTER_FORM_DATA_FIELDS as F,
  type RegisterField,
  type RegisterFieldErrors,
  type RegisterForm,
} from '~/types/register'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const REGISTER_FIELD_STEPS: Record<RegisterField, number> = {
  rnc: 0,
  razonSocial: 0,
  actividadEconomica: 0,
  provinciaId: 0,
  municipioId: 0,
  fullName: 1,
  phoneNumber: 1,
  userName: 1,
  email: 1,
  confirmEmail: 1,
  password: 1,
  confirmPassword: 1,
  logoEmpresa: 2,
  certificadoFirmaDigital: 2,
  passwordCertificadoFirmaDigital: 2,
}

export function buildRegisterFormData(values: RegisterForm) {
  const data = new FormData()

  data.append(F.rnc, values.rnc.trim())
  data.append(F.razonSocial, values.razonSocial.trim())
  data.append(F.actividadEconomica, values.actividadEconomica.trim())
  data.append(F.provinciaId, values.provinciaId)
  data.append(F.municipioId, values.municipioId)
  data.append(F.fullName, values.fullName.trim())
  data.append(F.phoneNumber, values.phoneNumber.trim())
  data.append(F.userName, values.userName.trim())
  data.append(F.email, values.email.trim().toLowerCase())
  data.append(F.confirmEmail, values.confirmEmail.trim().toLowerCase())
  data.append(F.password, values.password)
  data.append(F.confirmPassword, values.confirmPassword)

  if (values.passwordCertificadoFirmaDigital) {
    data.append(F.passwordCertificadoFirmaDigital, values.passwordCertificadoFirmaDigital)
  }
  if (values.logoEmpresa) data.append(F.logoEmpresa, values.logoEmpresa)
  if (values.certificadoFirmaDigital) {
    data.append(F.certificadoFirmaDigital, values.certificadoFirmaDigital)
  }

  return data
}

export function validateRegisterStep(values: RegisterForm, step: number): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {}

  if (step === 0) {
    if (!values.rnc.trim()) errors.rnc = 'El RNC es requerido.'
    else if (values.rnc.trim().length > 11) errors.rnc = 'El RNC no puede exceder 11 caracteres.'

    if (!values.razonSocial.trim()) errors.razonSocial = 'La razón social es requerida.'
    else if (values.razonSocial.trim().length > 50) errors.razonSocial = 'La razón social no puede exceder 50 caracteres.'

    if (!values.actividadEconomica.trim()) errors.actividadEconomica = 'La actividad económica es requerida.'
    else if (values.actividadEconomica.trim().length > 100) errors.actividadEconomica = 'La actividad económica no puede exceder 100 caracteres.'

    if (values.provinciaId.length !== 6) errors.provinciaId = 'Selecciona una provincia válida.'
    if (values.municipioId.length !== 6) errors.municipioId = 'Selecciona un municipio válido.'
  }

  if (step === 1) {
    if (!values.fullName.trim()) errors.fullName = 'El nombre completo es requerido.'

    if (!values.phoneNumber.trim()) errors.phoneNumber = 'El teléfono es requerido.'
    else if (values.phoneNumber.trim().length > 12) errors.phoneNumber = 'El teléfono no puede exceder 12 caracteres.'

    if (!values.userName.trim()) errors.userName = 'El nombre de usuario es requerido.'
    else if (values.userName.trim().length < 6) errors.userName = 'Usa al menos 6 caracteres.'

    const email = values.email.trim().toLowerCase()
    const confirmation = values.confirmEmail.trim().toLowerCase()
    if (!email) errors.email = 'El correo electrónico es requerido.'
    else if (email.length > 80) errors.email = 'El correo no puede exceder 80 caracteres.'
    else if (!EMAIL_PATTERN.test(email)) errors.email = 'Ingresa un correo válido.'

    if (!confirmation) errors.confirmEmail = 'Confirma el correo electrónico.'
    else if (!EMAIL_PATTERN.test(confirmation)) errors.confirmEmail = 'Ingresa un correo válido.'
    else if (email !== confirmation) errors.confirmEmail = 'Los correos electrónicos no coinciden.'

    if (!values.password) errors.password = 'La contraseña es requerida.'
    else if (values.password.length < 6) errors.password = 'Usa al menos 6 caracteres.'

    if (!values.confirmPassword) errors.confirmPassword = 'Confirma la contraseña.'
    else if (values.password !== values.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden.'
  }

  if (step === 2) {
    if (values.logoEmpresa && values.logoEmpresa.type !== 'image/png') {
      errors.logoEmpresa = 'El logo debe ser un archivo PNG.'
    }

    if (values.certificadoFirmaDigital) {
      const hasP12Extension = values.certificadoFirmaDigital.name.toLowerCase().endsWith('.p12')
      if (!hasP12Extension || values.certificadoFirmaDigital.type !== 'application/x-pkcs12') {
        errors.certificadoFirmaDigital = 'El certificado debe ser un archivo P12 válido.'
      }
      if (!values.passwordCertificadoFirmaDigital) {
        errors.passwordCertificadoFirmaDigital = 'Ingresa la clave del certificado.'
      }
    } else if (values.passwordCertificadoFirmaDigital) {
      errors.certificadoFirmaDigital = 'Selecciona el certificado correspondiente a esta clave.'
    }
  }

  return errors
}

export function validateRegisterForm(values: RegisterForm) {
  return [0, 1, 2].reduce<RegisterFieldErrors>(
    (errors, step) => ({ ...errors, ...validateRegisterStep(values, step) }),
    {},
  )
}

export function mapRegisterApiErrors(body: unknown) {
  const fieldErrors: RegisterFieldErrors = {}
  let generalError = ''

  if (isRecord(body) && isRecord(body.errors)) {
    for (const [rawField, rawMessages] of Object.entries(body.errors)) {
      const field = registerFieldFromBackendKey(rawField)
      const message = Array.isArray(rawMessages)
        ? rawMessages.find(item => typeof item === 'string' && item.trim())
        : undefined
      if (field && typeof message === 'string') fieldErrors[field] = message
    }
    if (!Object.keys(fieldErrors).length && typeof body.title === 'string') generalError = body.title
  } else if (typeof body === 'string' && body.trim()) {
    generalError = body.trim()
    const normalized = normalizeForMatching(body)
    if (normalized.includes('[email]')) fieldErrors.email = generalError
    if (normalized.includes('[username]')) fieldErrors.userName = generalError
    if (normalized.includes('empresa')) fieldErrors.rnc = generalError
    if (normalized.includes('contrasena')) fieldErrors.confirmPassword = generalError
  } else if (isRecord(body)) {
    for (const key of ['detail', 'title', 'message', 'mensaje']) {
      if (typeof body[key] === 'string' && body[key].trim()) {
        generalError = body[key].trim()
        break
      }
    }
  }

  return { fieldErrors, generalError }
}

function registerFieldFromBackendKey(value: string): RegisterField | undefined {
  const normalized = value.split('.').at(-1)?.toLowerCase()
  return (Object.keys(F) as RegisterField[]).find(field => (
    field.toLowerCase() === normalized || F[field].toLowerCase() === normalized
  ))
}

function normalizeForMatching(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
