import {Documento} from "@/components/actions/getDocuments.ts";


export default async function deleteDocument(hash: string) {
    const data = await fetch(import.meta.env.VITE_API_URL + `/deleteDocument/${hash}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('Session')!)}`}
    })

    return await data.json() as { doc: Documento}
}