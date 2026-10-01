import { describe, expect, it } from 'vitest'
import type { RegisterForm } from '~/types/register'
import {
  buildRegisterFormData,
  mapRegisterApiErrors,
  validateRegisterForm,
} from '~/utils/register'

function validForm(overrides: Partial<RegisterForm> = {}): RegisterForm {
  return {
    rnc: '101234567',
    razonSocial: 'Empresa Ejemplo SRL',
    actividadEconomica: 'Servicios tecnológicos',
    provinciaId: '010000',
    municipioId: '010100',
    fullName: 'Ada Lovelace',
    phoneNumber: '8095551234',
    userName: 'adalovelace',
    email: 'ADA@EMPRESA.COM',
    confirmEmail: 'ada@empresa.com',
    password: 'Secreto123',
    confirmPassword: 'Secreto123',
    logoEmpresa: null,
    certificadoFirmaDigital: null,
    passwordCertificadoFirmaDigital: '',
    ...overrides,
  }
}

describe('registro de empresa', () => {
  it('crea multipart con los doce campos obligatorios y normaliza el correo', () => {
    const data = buildRegisterFormData(validForm())

    expect([...data.keys()]).toHaveLength(12)
    expect(data.get('Rnc')).toBe('101234567')
    expect(data.get('Email')).toBe('ada@empresa.com')
    expect(data.get('ConfirmEmail')).toBe('ada@empresa.com')
    expect(data.has('LogoEmpresa')).toBe(false)
    expect(data.has('CertificadoFirmaDigital')).toBe(false)
  })

  it('valida coincidencias y límites prácticos antes de enviar', () => {
    const errors = validateRegisterForm(validForm({
      razonSocial: 'x'.repeat(51),
      phoneNumber: '1'.repeat(13),
      confirmEmail: 'otra@empresa.com',
      confirmPassword: 'otro-secreto',
    }))

    expect(errors).toMatchObject({
      razonSocial: expect.any(String),
      phoneNumber: expect.any(String),
      confirmEmail: expect.any(String),
      confirmPassword: expect.any(String),
    })
  })

  it('exige certificado y clave como pareja', () => {
    expect(validateRegisterForm(validForm({ passwordCertificadoFirmaDigital: 'clave' }))).toMatchObject({
      certificadoFirmaDigital: expect.any(String),
    })
  })

  it('mapea ValidationProblemDetails y errores de negocio a campos', () => {
    expect(mapRegisterApiErrors({ errors: { Email: ['Correo inválido'], ProvinciaId: ['Provincia inválida'] } }).fieldErrors)
      .toEqual({ email: 'Correo inválido', provinciaId: 'Provincia inválida' })
    expect(mapRegisterApiErrors('Este [UserName] se encuentra actualmente en uso.').fieldErrors.userName)
      .toMatch(/uso/i)
  })
})
