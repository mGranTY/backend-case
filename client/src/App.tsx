import {BrowserRouter, Route, Routes} from "react-router-dom";
import LoginPage from "@/components/LoginPage.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import useAuth from "@/hooks/useAuth.tsx";
import Dashboard from "@/components/Dashboard.tsx";

const queryClient = new QueryClient();

export default function App() {
    const session = useAuth()
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    {session ? <Route path="/dashboard" element={<Dashboard />} /> : null}
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}