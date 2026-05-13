export default defineNuxtRouteMiddleware((to) =>{

    console.log('validating auth')
    
    if(!to.path.startsWith('/admin')) return;

    const authStore = useAuthStore();

    if(import.meta.client && !authStore.isInitialized) authStore.initFromStorage();


    if(!authStore.isAuthenticated){
        return navigateTo('/auth/login')
    }

})