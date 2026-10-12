<script setup lang="ts">
import { ApiError } from '~/utils/api'
import { isUnknownUserMutationResult, passwordPolicyError } from '~/utils/tenant-users'

const { changeOwnPassword } = useTenantUsersApi()
const route = useRoute()
const dialog = ref<HTMLDialogElement | null>(null)
const currentPassword = ref('')
const newPassword = ref('')
const submitting = ref(false)
const error = ref('')
const success = ref('')

function clearPasswords() {
  currentPassword.value = ''
  newPassword.value = ''
}

function open() {
  error.value = ''
  success.value = ''
  clearPasswords()
  dialog.value?.showModal()
}

function close() {
  if (submitting.value) return
  dialog.value?.close()
}

function handleCancel(event: Event) {
  if (submitting.value) event.preventDefault()
}

async function submit() {
  if (submitting.value) return
  error.value = ''
  success.value = ''
  if (!currentPassword.value) {
    error.value = 'Escribe tu contraseña actual.'
    return
  }
  const policyError = passwordPolicyError(newPassword.value)
  if (policyError) {
    error.value = policyError
    return
  }

  submitting.value = true
  try {
    await changeOwnPassword({ currentPassword: currentPassword.value, newPassword: newPassword.value })
    success.value = 'Contraseña actualizada correctamente.'
  } catch (caught) {
    error.value = caught instanceof ApiError && caught.status === 403
      ? 'Sin permisos para cambiar la contraseña.'
      : isUnknownUserMutationResult(caught)
        ? 'No pudimos confirmar el cambio. No lo repetiremos automáticamente; verifica cuál contraseña funciona antes de intentarlo de nuevo.'
        : 'No pudimos cambiar la contraseña. Comprueba la contraseña actual y los requisitos de la nueva.'
  } finally {
    clearPasswords()
    submitting.value = false
  }
}

watch(() => route.fullPath, () => { clearPasswords(); dialog.value?.close() })
onBeforeUnmount(() => { clearPasswords(); dialog.value?.close() })
defineExpose({ open })
</script>

<template>
  <dialog ref="dialog" class="password-dialog" aria-labelledby="own-password-title" @close="clearPasswords" @cancel="handleCancel">
    <form novalidate @submit.prevent="submit">
      <div class="dialog-heading">
        <span class="dialog-icon"><i class="bi bi-shield-lock" aria-hidden="true" /></span>
        <div><h2 id="own-password-title">Cambiar mi contraseña</h2><p>Escribe la contraseña actual y define una nueva.</p></div>
        <button type="button" class="btn-close" aria-label="Cerrar" :disabled="submitting" @click="close" />
      </div>
      <div class="dialog-body">
        <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
        <div v-if="success" class="alert alert-success" role="status">{{ success }}</div>
        <label for="current-password" class="form-label">Contraseña actual</label>
        <input id="current-password" v-model="currentPassword" class="form-control" type="password" autocomplete="current-password" :disabled="submitting" required>
        <label for="new-own-password" class="form-label mt-3">Nueva contraseña</label>
        <input id="new-own-password" v-model="newPassword" class="form-control" type="password" autocomplete="new-password" :disabled="submitting" required>
        <small class="password-hint">Mínimo 6 caracteres, con mayúscula, minúscula, número y símbolo.</small>
      </div>
      <div class="dialog-actions">
        <button type="button" class="btn btn-outline-secondary" :disabled="submitting" @click="close">Cerrar</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting"><span v-if="submitting" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />Guardar contraseña</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.password-dialog{width:min(490px,calc(100% - 2rem));max-height:calc(100dvh - 2rem);padding:0;margin:auto;border:0;border-radius:16px;box-shadow:0 25px 70px rgba(15,23,42,.28);overflow-y:auto;color:#101828}
.password-dialog::backdrop{background:rgba(15,23,42,.55)}
.dialog-heading{display:flex;align-items:flex-start;gap:.8rem;padding:1.25rem 1.35rem;border-bottom:1px solid #e5eaf2}
.dialog-heading>div{flex:1;min-width:0}.dialog-heading h2{margin:0;font-size:1.15rem}.dialog-heading p{margin:.3rem 0 0;color:#667085;font-size:.84rem}
.dialog-icon{display:grid;width:38px;height:38px;flex:0 0 38px;border-radius:10px;background:#eef5ff;color:#0d6efd;place-items:center}
.dialog-body{padding:1.25rem 1.35rem}.form-label{color:#344054;font-size:.83rem;font-weight:650}.form-control{min-height:44px;border-color:#d5deea}.password-hint{display:block;margin-top:.45rem;color:#667085;font-size:.75rem}
.dialog-actions{display:flex;justify-content:flex-end;gap:.6rem;padding:1rem 1.35rem;border-top:1px solid #e5eaf2;background:#f8fafc}.dialog-actions .btn{min-height:42px}
@media(max-width:575.98px){.dialog-heading,.dialog-body,.dialog-actions{padding-right:1rem;padding-left:1rem}.dialog-actions{flex-direction:column-reverse}.dialog-actions .btn{width:100%}}
</style>
