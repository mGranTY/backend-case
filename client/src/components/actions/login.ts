
type LoginResponse = {
    session: string
    success: boolean
}

export async function login(email: string, password: string) {
    const data =  await fetch(import.meta.env.VITE_API_URL + '/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    return await data.json() as LoginResponse
}

type RegisterResponse = {
    message: string
    success: boolean
}

export async function register(email: string, password: string) {
    const data = await fetch(import.meta.env.VITE_API_URL + '/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })

    return await data.json() as RegisterResponse
}