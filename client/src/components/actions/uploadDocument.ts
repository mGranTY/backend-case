import {Documento} from "@/components/actions/getDocuments.ts";

export default async function uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('document', file);

    const data = await fetch(import.meta.env.VITE_API_URL + `/uploadDocument`, {
        method: 'POST',
        headers: {
            // No 'Content-Type' header needed for FormData
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('Session')!)}`,
        },
        body: formData,
    });

    return await data.json() as { doc: Documento };
}
