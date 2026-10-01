export interface RegisterForm {
  rnc: string
  razonSocial: string
  actividadEconomica: string
  provinciaId: string
  municipioId: string
  fullName: string
  phoneNumber: string
  userName: string
  email: string
  confirmEmail: string
  password: string
  confirmPassword: string
  logoEmpresa: File | null
  certificadoFirmaDigital: File | null
  passwordCertificadoFirmaDigital: string
}

export type RegisterField = keyof RegisterForm

export const REGISTER_FORM_DATA_FIELDS = {
  rnc: 'Rnc',
  razonSocial: 'RazonSocial',
  actividadEconomica: 'ActividadEconomica',
  provinciaId: 'ProvinciaId',
  municipioId: 'MunicipioId',
  fullName: 'FullName',
  phoneNumber: 'PhoneNumber',
  userName: 'UserName',
  email: 'Email',
  confirmEmail: 'ConfirmEmail',
  password: 'Password',
  confirmPassword: 'ConfirmPassword',
  logoEmpresa: 'LogoEmpresa',
  certificadoFirmaDigital: 'CertificadoFirmaDigital',
  passwordCertificadoFirmaDigital: 'PasswordCertificadoFirmaDigital',
} as const satisfies Record<RegisterField, string>

export type RegisterFieldErrors = Partial<Record<RegisterField, string>>
