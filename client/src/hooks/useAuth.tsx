
export default function useAuth(){
    const session = localStorage.getItem('Session')
    if(!session){
        return false
    }
    return session
}