import {useState} from "react";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useMutation} from "@tanstack/react-query";
import {login} from "@/components/actions/login.ts";
import {useNavigate} from "react-router-dom";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate()
    const loginMutation = useMutation({
        mutationFn: () => login(email, password),
        onError: () => {
            localStorage.clear()
            setIsAuthError(true)
        },
        onSuccess: (data) => {
            if(!data.success){
                localStorage.clear()
                setIsAuthError(true)
            }
            if(data.session){
                localStorage.setItem('Session', JSON.stringify(data.session));
                setTimeout(() => {
                    navigate("/dashboard")
                }, 500)
            }

        }
    })

    const [isAuthError, setIsAuthError] = useState<boolean>(false)

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md mx-auto space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Login</h1>
                    <p className="text-gray-500 dark:text-gray-400">Enter your email below to login to your account</p>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input value={email} onChange={(e) => {
                            setEmail(e.target.value)
                        }} id="email" placeholder="m@example.com" required type="email"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input value={password} onChange={(e) => {
                            setPassword(e.target.value)
                        }} id="password" required type="password"/>
                    </div>
                    <Button onClick={() => loginMutation?.mutate()} className="w-full" type="submit">
                        Login
                    </Button>
                    <Button onClick={() => loginMutation?.mutate()} className="w-full" variant="outline">
                        Register
                    </Button>
                </div>
                {isAuthError && <div className="fixed bottom-0 right-0 m-6">
                    <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold">Error</h3>
                                <p>Something went wrong please try again.</p>
                            </div>
                            <button className="text-white">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"
                                          strokeWidth={2}/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>}
            </div>
        </div>
    )
}