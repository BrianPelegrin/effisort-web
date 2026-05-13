
import { defineStore } from "pinia"


interface ILoginUser {
    userName: string;
    password: string;
}

interface IUser {
    id: string;
    tenantId: string;    
    name: string;
    lastName: string;
    userName: string;
    avatar: string;
}

export const useAuthStore = defineStore('authStore', ()=>{

    const user = useState<IUser | null>('user')
    const token = useState<string | null>('token')
    const isInitialized = useState<boolean>('initialized')
    const isAuthenticated = computed(()=> Boolean(token.value))

    const initFromStorage = () =>{

        console.log('Inicializando auth...');
        
        if(import.meta.server || isInitialized.value) return;

        token.value = localStorage.getItem('token');
        const userRaw = localStorage.getItem('user')
        user.value = userRaw ? JSON.parse(userRaw) : null;
        isInitialized.value = true;
    }

    const setSession = ( tokenToSet: string, userToSet: IUser ) =>{

        token.value = tokenToSet;
        user.value = userToSet ?? user.value;

        if(import.meta.server) return ;

        localStorage.setItem('token', tokenToSet)
        if(user.value){
            localStorage.setItem('user', JSON.stringify(user.value))
        }

    }

    const clearSession = () =>{
        token.value = '';
        user.value = null;

        if(import.meta.server) return;
        
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    const logout = async () =>{
        clearSession()
        await navigateTo('/auth/login')
    }

    return {
        isAuthenticated,
        user,
        token,
        isInitialized,
        // ACTIONs
        initFromStorage,
        setSession,
        logout,

    }

})