<script setup lang="ts">
import type { CreateTenantUserRequest, TenantUser, TenantUserRole } from '~/types/tenant-user'
import { TENANT_USER_ROLES } from '~/types/tenant-user'
import { ApiError } from '~/utils/api'
import {
  isUnknownUserMutationResult,
  matchesTenantUserIdentity,
  passwordPolicyError,
  prepareCreateTenantUser,
  type CreateTenantUserFields,
} from '~/utils/tenant-users'

const auth = useAuthStore()
const route = useRoute()
const { listTenantUsers, createTenantUser, resetTenantUserPassword } = useTenantUsersApi()
const users = ref<TenantUser[]>([])
const loading = ref(false)
const listError = ref('')
const forbiddenByApi = ref(false)
const successMessage = ref('')
const createDialog = ref<HTMLDialogElement | null>(null)
const resetDialog = ref<HTMLDialogElement | null>(null)
const creating = ref(false)
const resetting = ref(false)
const verifyingCreate = ref(false)
const verifyingReset = ref(false)
const createError = ref('')
const resetError = ref('')
const createFieldErrors = ref<Partial<Record<keyof CreateTenantUserRequest, string>>>({})
const createForm = reactive<CreateTenantUserFields>({ firstName: '', lastName: '', email: '', userName: '', password: '', roles: [] })
const resetPassword = ref('')
const resetTarget = ref<TenantUser | null>(null)
const createUnknown = ref<{ email: string; userName: string } | null>(null)
const createVerification = ref<'pending' | 'found' | 'not-found' | null>(null)
const resetUnknown = ref<{ email: string; userName: string } | null>(null)
const resetVerification = ref<'pending' | 'checked' | 'missing' | null>(null)
const knownCreatedIdentity = ref<{ email: string; userName: string } | null>(null)

const forbidden = computed(() => !auth.isTenantAdmin || forbiddenByApi.value)
const currentUserId = computed(() => auth.currentTenantUser?.id || auth.user?.id)
const roleGroups: { label: string; roles: TenantUserRole[] }[] = [
  { label: 'General', roles: TENANT_USER_ROLES.slice(0, 4) },
  { label: 'Inventario', roles: TENANT_USER_ROLES.slice(4, 7) },
  { label: 'Cuentas por cobrar', roles: TENANT_USER_ROLES.slice(7, 10) },
  { label: 'Cuentas por pagar', roles: TENANT_USER_ROLES.slice(10, 13) },
  { label: 'Facturación', roles: TENANT_USER_ROLES.slice(13, 16) },
  { label: 'Contabilidad', roles: TENANT_USER_ROLES.slice(16, 19) },
]

onMounted(() => { if (!forbidden.value) void refreshUsers().catch(() => {}) })
watch(() => route.fullPath, () => closeAllDialogs())
onBeforeUnmount(() => closeAllDialogs())

async function refreshUsers() {
  if (forbidden.value) return []
  loading.value = true
  listError.value = ''
  try {
    const result = await listTenantUsers()
    users.value = result
    return result
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) forbiddenByApi.value = true
    listError.value = forbiddenByApi.value
      ? 'Sin permisos para consultar los usuarios del tenant.'
      : 'No pudimos cargar los usuarios. Inténtalo nuevamente.'
    throw error
  } finally {
    loading.value = false
  }
}

function clearPasswords() {
  createForm.password = ''
  resetPassword.value = ''
}

function closeAllDialogs() {
  clearPasswords()
  createDialog.value?.close()
  resetDialog.value?.close()
}

function openCreate() {
  if (forbidden.value || createVerification.value === 'pending') return
  createError.value = ''
  createFieldErrors.value = {}
  successMessage.value = ''
  if (createVerification.value !== 'not-found') {
    Object.assign(createForm, { firstName: '', lastName: '', email: '', userName: '', password: '', roles: [] })
  }
  createDialog.value?.showModal()
}

function closeCreate() {
  if (creating.value) return
  createDialog.value?.close()
}

function openReset(user: TenantUser) {
  if (forbidden.value || resetting.value || resetVerification.value === 'pending' || user.id === currentUserId.value) return
  resetTarget.value = user
  resetPassword.value = ''
  resetError.value = ''
  successMessage.value = ''
  resetDialog.value?.showModal()
}

function closeReset() {
  if (resetting.value) return
  resetDialog.value?.close()
}

function handleDialogCancel(event: Event) {
  if (creating.value || resetting.value) event.preventDefault()
}

function safeMutationError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 403) return 'Sin permisos para realizar esta operación.'
  if (!(error instanceof ApiError) || error.contentType.includes('html')) return fallback
  const message = error.message.toLowerCase()
  if (message.includes('email') || message.includes('correo')) return 'El correo no es válido o ya está en uso.'
  if (message.includes('username') || message.includes('usuario')) return 'El nombre de usuario no es válido o ya está en uso.'
  if (message.includes('password') || message.includes('contraseña')) return 'La contraseña no cumple la política del servidor.'
  return fallback
}

async function submitCreate() {
  if (creating.value || forbidden.value || createVerification.value === 'pending') return
  createError.value = ''
  createFieldErrors.value = {}
  const prepared = prepareCreateTenantUser(createForm)
  if (!prepared.valid) {
    createFieldErrors.value = prepared.errors
    return
  }
  if (knownCreatedIdentity.value
    && (prepared.request.email === knownCreatedIdentity.value.email
      || prepared.request.userName.toLowerCase() === knownCreatedIdentity.value.userName.toLowerCase())) {
    createError.value = 'Ese usuario ya aparece en el tenant. Revisa sus roles antes de crear otro.'
    return
  }

  creating.value = true
  try {
    const created = await createTenantUser(prepared.request)
    users.value = [created, ...users.value.filter(user => user.id !== created.id)]
    successMessage.value = `Se creó ${created.displayName || created.userName}.`
    createUnknown.value = null
    createVerification.value = null
    Object.assign(createForm, { firstName: '', lastName: '', email: '', userName: '', password: '', roles: [] })
    createDialog.value?.close()
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      forbiddenByApi.value = true
      createDialog.value?.close()
    } else if (isUnknownUserMutationResult(error)) {
      createUnknown.value = { email: prepared.request.email, userName: prepared.request.userName }
      createVerification.value = 'pending'
      createDialog.value?.close()
    } else {
      createError.value = safeMutationError(error, 'No pudimos crear el usuario. Revisa los datos e inténtalo nuevamente.')
    }
  } finally {
    clearPasswords()
    creating.value = false
  }
}

async function verifyCreateResult() {
  if (!createUnknown.value || verifyingCreate.value) return
  verifyingCreate.value = true
  try {
    const refreshed = await refreshUsers()
    const found = refreshed.some(user => matchesTenantUserIdentity(user, createUnknown.value!.email, createUnknown.value!.userName))
    createVerification.value = found ? 'found' : 'not-found'
    if (found) knownCreatedIdentity.value = createUnknown.value
  } catch {
    // The verification remains mandatory until the list loads successfully.
  } finally {
    verifyingCreate.value = false
  }
}

async function submitReset() {
  if (resetting.value || forbidden.value || resetVerification.value === 'pending' || !resetTarget.value) return
  resetError.value = passwordPolicyError(resetPassword.value)
  if (resetError.value) return

  resetting.value = true
  const target = resetTarget.value
  try {
    await resetTenantUserPassword({ userId: target.id, newPassword: resetPassword.value })
    successMessage.value = 'Contraseña reiniciada. Comunica la nueva contraseña por un canal seguro; la API no envía correo ni exige cambiarla después.'
    resetUnknown.value = null
    resetVerification.value = null
    resetDialog.value?.close()
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      forbiddenByApi.value = true
      resetDialog.value?.close()
    } else if (isUnknownUserMutationResult(error)) {
      resetUnknown.value = { email: target.email, userName: target.userName }
      resetVerification.value = 'pending'
      resetDialog.value?.close()
    } else {
      resetError.value = safeMutationError(error, 'No pudimos reiniciar la contraseña. Verifica el usuario e inténtalo nuevamente.')
    }
  } finally {
    clearPasswords()
    resetting.value = false
  }
}

async function verifyResetResult() {
  if (!resetUnknown.value || verifyingReset.value) return
  verifyingReset.value = true
  try {
    const refreshed = await refreshUsers()
    resetVerification.value = refreshed.some(user => matchesTenantUserIdentity(user, resetUnknown.value!.email, resetUnknown.value!.userName))
      ? 'checked'
      : 'missing'
  } catch {
    // The verification remains mandatory until the list loads successfully.
  } finally {
    verifyingReset.value = false
  }
}
</script>

<template>
  <main class="tenant-users-page">
    <header class="users-header">
      <div><div class="breadcrumb-line">Administración <i class="bi bi-chevron-right" aria-hidden="true" /> Usuarios</div><h1>Usuarios del equipo</h1><p>Administra los accesos de tu organización.</p></div>
      <div v-if="!forbidden" class="header-actions">
        <button type="button" class="btn btn-outline-primary" :disabled="loading" @click="refreshUsers().catch(() => {})"><i class="bi bi-arrow-clockwise me-2" aria-hidden="true" />Actualizar</button>
        <button type="button" class="btn btn-primary" :disabled="createVerification === 'pending'" @click="openCreate"><i class="bi bi-person-plus me-2" aria-hidden="true" />Crear usuario</button>
      </div>
    </header>

    <div v-if="forbidden" class="state-card" role="alert"><i class="bi bi-shield-exclamation" aria-hidden="true" /><h2>Sin permisos</h2><p>La gestión de usuarios requiere el rol TenantAdmin en tu sesión.</p><NuxtLink to="/admin" class="btn btn-outline-primary">Volver al inicio</NuxtLink></div>
    <template v-else>
      <div v-if="auth.currentUserStatus === 'error'" class="alert alert-warning unknown-banner" role="alert"><span>No pudimos confirmar el usuario autenticado. Verifica tu conexión e inténtalo nuevamente.</span><button type="button" class="btn btn-outline-warning" @click="auth.loadCurrentUser().catch(() => {})">Reintentar</button></div>
      <div v-if="successMessage" class="alert alert-success" role="status">{{ successMessage }}</div>
      <div v-if="createVerification" class="alert alert-warning unknown-banner" role="status">
        <div><strong>Resultado de creación no confirmado.</strong><p v-if="createVerification === 'pending'">El usuario pudo haberse creado, incluso sin todos sus roles. Consulta el listado antes de otro intento.</p><p v-else-if="createVerification === 'found'">El usuario aparece en el tenant. Revisa sus roles; no repitas el alta con ese correo o username.</p><p v-else>No aparece en el listado actualizado. Puedes intentar el alta manualmente; la API no ofrece una comprobación de idempotencia.</p></div>
        <button v-if="createVerification === 'pending'" type="button" class="btn btn-outline-warning" :disabled="verifyingCreate" @click="verifyCreateResult"><span v-if="verifyingCreate" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />Verificar listado</button>
      </div>
      <div v-if="resetVerification" class="alert alert-warning unknown-banner" role="status">
        <div><strong>Resultado de reinicio no confirmado.</strong><p v-if="resetVerification === 'pending'">No repitas el reinicio hasta recargar el listado y comprobar que el usuario sigue en el tenant.</p><p v-else-if="resetVerification === 'checked'">El usuario sigue en el tenant, pero el listado no permite comprobar cuál contraseña funciona. Confírmalo con el usuario antes de repetir la operación.</p><p v-else>El usuario ya no aparece en el listado. No vuelvas a intentar el reinicio sin revisar el caso.</p></div>
        <button v-if="resetVerification === 'pending'" type="button" class="btn btn-outline-warning" :disabled="verifyingReset" @click="verifyResetResult"><span v-if="verifyingReset" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />Verificar listado</button>
      </div>

      <section class="users-card" aria-labelledby="users-list-title">
        <div class="list-heading"><div><h2 id="users-list-title">Usuarios del tenant</h2><p>El servidor devuelve el listado completo; no hay edición ni paginación de usuarios.</p></div><span v-if="!loading && !listError" class="count-badge">{{ users.length }} usuarios</span></div>
        <div v-if="listError" class="list-state" role="alert"><i class="bi bi-exclamation-triangle" aria-hidden="true" /><p>{{ listError }}</p><button type="button" class="btn btn-outline-primary" @click="refreshUsers().catch(() => {})">Reintentar</button></div>
        <div v-else-if="loading" class="list-state" role="status"><span class="spinner-border text-primary" aria-hidden="true" /><p>Cargando usuarios...</p></div>
        <div v-else-if="!users.length" class="list-state"><i class="bi bi-people" aria-hidden="true" /><p>Todavía no hay usuarios para mostrar.</p></div>
        <template v-else>
          <div class="table-responsive desktop-users"><table class="table align-middle mb-0"><thead><tr><th>Usuario</th><th>Username</th><th>Roles</th><th class="text-end">Acción</th></tr></thead><tbody><tr v-for="user in users" :key="user.id"><td><strong>{{ user.displayName || user.userName }}</strong><small>{{ user.email }}</small></td><td>{{ user.userName }}</td><td><span v-if="!user.roles.length" class="no-roles">Sin roles asignados</span><span v-for="role in user.roles" :key="role" class="role-badge">{{ role }}</span></td><td class="text-end"><span v-if="user.id === currentUserId" class="self-badge">Tu cuenta</span><button v-else type="button" class="btn btn-sm btn-outline-danger" :disabled="resetVerification === 'pending' || resetVerification === 'missing'" @click="openReset(user)">Reiniciar contraseña</button></td></tr></tbody></table></div>
          <div class="mobile-users"><article v-for="user in users" :key="user.id" class="user-mobile-card"><strong>{{ user.displayName || user.userName }}</strong><small>{{ user.email }}</small><span class="username">@{{ user.userName }}</span><div class="mobile-roles"><span v-if="!user.roles.length" class="no-roles">Sin roles asignados</span><span v-for="role in user.roles" :key="role" class="role-badge">{{ role }}</span></div><span v-if="user.id === currentUserId" class="self-badge">Tu cuenta</span><button v-else type="button" class="btn btn-outline-danger" :disabled="resetVerification === 'pending' || resetVerification === 'missing'" @click="openReset(user)">Reiniciar contraseña</button></article></div>
        </template>
      </section>
      <p class="capability-note">Por ahora no es posible editar usuarios, cambiar roles ni desactivarlos desde esta API. El reinicio de contraseña no envía correo ni obliga a cambiarla al iniciar sesión.</p>
    </template>

    <dialog ref="createDialog" class="user-dialog create-user-dialog" aria-labelledby="create-user-title" @close="clearPasswords" @cancel="handleDialogCancel">
      <form novalidate @submit.prevent="submitCreate">
        <div class="dialog-heading"><div><span class="eyebrow">Nuevo acceso</span><h2 id="create-user-title">Crear usuario</h2><p>El usuario pertenecerá a tu organización.</p></div><button type="button" class="btn-close" aria-label="Cerrar" :disabled="creating" @click="closeCreate" /></div>
        <div class="dialog-body">
          <div v-if="createError" class="alert alert-danger" role="alert">{{ createError }}</div>
          <div class="form-grid">
            <div><label for="new-first-name" class="form-label">Nombre *</label><input id="new-first-name" v-model="createForm.firstName" class="form-control" autocomplete="off" :disabled="creating" :aria-invalid="Boolean(createFieldErrors.firstName)"><small v-if="createFieldErrors.firstName" class="field-error">{{ createFieldErrors.firstName }}</small></div>
            <div><label for="new-last-name" class="form-label">Apellido *</label><input id="new-last-name" v-model="createForm.lastName" class="form-control" autocomplete="off" :disabled="creating" :aria-invalid="Boolean(createFieldErrors.lastName)"><small v-if="createFieldErrors.lastName" class="field-error">{{ createFieldErrors.lastName }}</small></div>
            <div><label for="new-email" class="form-label">Correo *</label><input id="new-email" v-model="createForm.email" class="form-control" type="email" autocomplete="off" :disabled="creating" :aria-invalid="Boolean(createFieldErrors.email)"><small v-if="createFieldErrors.email" class="field-error">{{ createFieldErrors.email }}</small></div>
            <div><label for="new-username" class="form-label">Username *</label><input id="new-username" v-model="createForm.userName" class="form-control" autocomplete="off" :disabled="creating" :aria-invalid="Boolean(createFieldErrors.userName)"><small v-if="createFieldErrors.userName" class="field-error">{{ createFieldErrors.userName }}</small></div>
            <div class="wide-field"><label for="new-user-password" class="form-label">Contraseña *</label><input id="new-user-password" v-model="createForm.password" class="form-control" type="password" autocomplete="new-password" :disabled="creating" :aria-invalid="Boolean(createFieldErrors.password)"><small v-if="createFieldErrors.password" class="field-error">{{ createFieldErrors.password }}</small><small v-else class="field-hint">Mínimo 6 caracteres, mayúscula, minúscula, número y símbolo.</small></div>
          </div>
          <fieldset class="roles-fieldset"><legend>Roles *</legend><p>Selecciona solo los permisos que necesita. La asignación puede quedar parcial si falla un rol en el servidor.</p><div v-for="group in roleGroups" :key="group.label" class="role-group"><strong>{{ group.label }}</strong><div class="role-options"><label v-for="role in group.roles" :key="role"><input v-model="createForm.roles" type="checkbox" :value="role" :disabled="creating"><span>{{ role }}</span></label></div></div><small v-if="createFieldErrors.roles" class="field-error">{{ createFieldErrors.roles }}</small></fieldset>
        </div>
        <div class="dialog-actions"><button type="button" class="btn btn-outline-secondary" :disabled="creating" @click="closeCreate">Cancelar</button><button type="submit" class="btn btn-primary" :disabled="creating"><span v-if="creating" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />Crear usuario</button></div>
      </form>
    </dialog>

    <dialog ref="resetDialog" class="user-dialog reset-user-dialog" aria-labelledby="reset-user-title" @close="clearPasswords" @cancel="handleDialogCancel">
      <form novalidate @submit.prevent="submitReset">
        <div class="dialog-heading"><div><span class="eyebrow">Acción administrativa</span><h2 id="reset-user-title">Reiniciar contraseña</h2><p>{{ resetTarget?.displayName || resetTarget?.userName }} · {{ resetTarget?.email }}</p></div><button type="button" class="btn-close" aria-label="Cerrar" :disabled="resetting" @click="closeReset" /></div>
        <div class="dialog-body"><div v-if="resetError" class="alert alert-danger" role="alert">{{ resetError }}</div><p class="reset-warning">Confirma que es la cuenta correcta. La API no envía la contraseña por correo ni exige cambiarla en el próximo inicio de sesión.</p><label for="reset-user-password" class="form-label">Nueva contraseña *</label><input id="reset-user-password" v-model="resetPassword" class="form-control" type="password" autocomplete="new-password" :disabled="resetting"><small class="field-hint">Mínimo 6 caracteres, mayúscula, minúscula, número y símbolo.</small></div>
        <div class="dialog-actions"><button type="button" class="btn btn-outline-secondary" :disabled="resetting" @click="closeReset">Cancelar</button><button type="submit" class="btn btn-danger" :disabled="resetting"><span v-if="resetting" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />Confirmar reinicio</button></div>
      </form>
    </dialog>
  </main>
</template>

<style scoped>
.tenant-users-page{min-width:0;color:#101828}.users-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1.25rem;margin-bottom:1.2rem}.breadcrumb-line{display:flex;align-items:center;gap:.45rem;color:#667085;font-size:.78rem}.breadcrumb-line i{font-size:.68rem}.users-header h1{margin:.35rem 0 .2rem;font-size:1.7rem;font-weight:750}.users-header p,.list-heading p{margin:0;color:#667085;font-size:.85rem}.header-actions{display:flex;gap:.55rem}.header-actions .btn{min-height:42px;border-radius:10px;font-weight:650}.users-card{border:1px solid #e3e9f2;border-radius:16px;background:#fff;overflow:hidden}.list-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.2rem;border-bottom:1px solid #e8edf4}.list-heading h2{margin:0 0 .2rem;font-size:1rem;font-weight:750}.count-badge,.self-badge{display:inline-flex;padding:.3rem .6rem;border-radius:999px;background:#eff8ff;color:#175cd3;font-size:.72rem;font-weight:700;white-space:nowrap}.table th{padding:.75rem 1rem;background:#f8fafc;color:#667085;font-size:.72rem;white-space:nowrap}.table td{padding:.85rem 1rem;border-color:#edf1f6;font-size:.83rem}.table td strong,.table td small{display:block}.table td small{margin-top:.15rem;color:#667085}.role-badge{display:inline-flex;margin:.12rem;padding:.24rem .45rem;border-radius:6px;background:#eef4ff;color:#344c7a;font-size:.7rem;font-weight:650}.no-roles{color:#b42318;font-size:.76rem}.list-state,.state-card{display:flex;min-height:235px;align-items:center;justify-content:center;flex-direction:column;gap:.6rem;padding:1.5rem;color:#667085;text-align:center}.list-state i,.state-card i{font-size:1.75rem;color:#98a2b3}.list-state p,.state-card p{margin:0}.state-card{border:1px solid #e3e9f2;border-radius:16px;background:#fff}.state-card h2{margin:0;color:#101828;font-size:1.2rem}.unknown-banner{display:flex;align-items:center;justify-content:space-between;gap:1rem}.unknown-banner p{margin:.3rem 0 0}.unknown-banner .btn{flex:0 0 auto}.capability-note{margin:1rem 0;color:#667085;font-size:.78rem}.mobile-users{display:none}.user-dialog{width:min(740px,calc(100% - 2rem));max-height:calc(100dvh - 2rem);padding:0;margin:auto;border:0;border-radius:16px;box-shadow:0 25px 70px rgba(15,23,42,.28);overflow-y:auto;color:#101828}.reset-user-dialog{width:min(500px,calc(100% - 2rem))}.user-dialog::backdrop{background:rgba(15,23,42,.55)}.dialog-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.15rem 1.3rem;border-bottom:1px solid #e5eaf2}.dialog-heading>div{min-width:0}.dialog-heading h2{margin:.1rem 0 .25rem;font-size:1.2rem}.dialog-heading p{margin:0;color:#667085;font-size:.82rem;overflow-wrap:anywhere}.eyebrow{color:#175cd3;font-size:.7rem;font-weight:750;text-transform:uppercase;letter-spacing:.04em}.dialog-body{padding:1.2rem 1.3rem}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem}.wide-field{grid-column:1/-1}.form-label{margin-bottom:.3rem;color:#344054;font-size:.8rem;font-weight:650}.form-control{min-height:42px;border-color:#d5deea}.field-error,.field-hint{display:block;margin-top:.3rem;font-size:.72rem}.field-error{color:#b42318}.field-hint{color:#667085}.roles-fieldset{margin-top:1.2rem;padding:1rem;border:1px solid #e3e9f2;border-radius:12px}.roles-fieldset legend{float:none;width:auto;margin:0;padding:0 .25rem;font-size:.86rem;font-weight:750}.roles-fieldset>p{margin:0 0 .75rem;color:#667085;font-size:.76rem}.role-group+.role-group{margin-top:.7rem}.role-group>strong{display:block;margin-bottom:.35rem;color:#344054;font-size:.76rem}.role-options{display:flex;flex-wrap:wrap;gap:.4rem}.role-options label{display:inline-flex;align-items:center;gap:.35rem;padding:.4rem .55rem;border:1px solid #dbe3ef;border-radius:8px;font-size:.75rem;cursor:pointer}.role-options input{accent-color:#0d6efd}.dialog-actions{display:flex;justify-content:flex-end;gap:.55rem;padding:1rem 1.3rem;border-top:1px solid #e5eaf2;background:#f8fafc}.dialog-actions .btn{min-height:42px}.reset-warning{padding:.75rem;border-radius:9px;background:#fffaeb;color:#92400e;font-size:.8rem}.user-mobile-card{display:flex;flex-direction:column;gap:.3rem;padding:1rem;border-bottom:1px solid #e8edf4}.user-mobile-card>strong{font-size:.9rem}.user-mobile-card>small,.username{color:#667085;font-size:.76rem;overflow-wrap:anywhere}.mobile-roles{margin:.35rem 0}.user-mobile-card .btn{margin-top:.5rem;min-height:42px}
@media(max-width:767.98px){.users-header{flex-direction:column}.header-actions{width:100%}.header-actions .btn{flex:1}.desktop-users{display:none}.mobile-users{display:block}.unknown-banner{align-items:flex-start;flex-direction:column}.unknown-banner .btn{width:100%}.form-grid{grid-template-columns:1fr}.wide-field{grid-column:auto}}
@media(max-width:575.98px){.users-header h1{font-size:1.4rem}.header-actions{flex-direction:column}.list-heading{align-items:flex-start;flex-direction:column}.dialog-heading,.dialog-body,.dialog-actions{padding-right:1rem;padding-left:1rem}.dialog-actions{flex-direction:column-reverse}.dialog-actions .btn{width:100%}}
</style>
