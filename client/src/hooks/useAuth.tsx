
export default function useAuth(){
    const session = localStorage.getItem('Session')
    if(!session || session == 'undefined'){
        return false
    }
    return session
}