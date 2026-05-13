<script setup lang="ts">
definePageMeta({
    layout: "auth",
})

const auth = useAuthStore()
const { $api } = useNuxtApp()

const form = reactive({
    email: "",
    password: "",
    remember: true,
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref("")

async function onSubmit() {

    auth.setSession('TOKEN',{
        id: '1737',
        name: 'Brian',
        lastName: 'Pelegrin',
        tenantId: 'EF1737',
        avatar: 'usuario.jpg',
        userName: 'brianpelegrin'
    })
    
    await  navigateTo('/admin')
    // loading.value = true
    // error.value = ""

    // try {
    //     // Ajusta al shape real de tu backend:
    //     // POST /auth/login => { token: string, user: {...} }
    //     const res = await $api<{ token: string; user: any }>("/auth/login", {
    //         method: "POST",
    //         body: { email: form.email, password: form.password },
    //     })

    //     auth.setSession(res.token, res.user)
    //     await navigateTo("/admin")
    // } catch (e: any) {
    //     error.value = "Credenciales inválidas o error de servidor."
    // } finally {
    //     loading.value = false
    // }
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
                <label class="form-label">Correo</label>
                <input v-model.trim="form.email" type="email" class="form-control form-control-lg rounded-12"
                    placeholder="tu@correo.com" autocomplete="email" required />
            </div>

            <div class="mb-3">
                <label class="form-label d-flex justify-content-between">
                    <span>Contraseña</span>
                    <a href="#" class="text-decoration-none small">¿Olvidaste tu contraseña?</a>
                </label>

                <div class="input-group input-group-lg">
                    <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                        class="form-control rounded-12-left" placeholder="••••••••" autocomplete="current-password"
                        required />
                    <button type="button" class="btn btn-outline-secondary rounded-12-right"
                        @click="showPassword = !showPassword">
                        {{ showPassword ? "Ocultar" : "Mostrar" }}
                    </button>
                </div>
            </div>

            <div class="d-flex align-items-center justify-content-between mb-3">
                <div class="form-check">
                    <input v-model="form.remember" class="form-check-input" type="checkbox" id="remember" />
                    <label class="form-check-label" for="remember">Recordarme</label>
                </div>
            </div>

            <div v-if="error" class="alert alert-danger py-2" role="alert">
                {{ error }}
            </div>

            <button type="submit"
                class="btn btn-primary btn-lg w-100 d-inline-flex align-items-center justify-content-center gap-2 rounded-12"
                :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                <span>{{ loading ? "Entrando..." : "Entrar" }}</span>
            </button>

            <div class="d-flex align-items-center gap-3 my-4">
                <div class="flex-grow-1 border-top"></div>
                <div class="text-muted small">o</div>
                <div class="flex-grow-1 border-top"></div>
            </div>

            <button type="button" class="btn btn-outline-success btn-lg w-100 rounded-12">
                Registrate con nosotros
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
