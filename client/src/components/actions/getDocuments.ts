export type Documento = {
    fieldname: string,
    originalname: string,
    mimetype: string,
    date: Date,
    keywords: Array<string>
    hash: string,
}

export default async function getDocuments(searchParam: string) {
    const data = await fetch(import.meta.env.VITE_API_URL + '/getDocuments?search=' + encodeURIComponent(searchParam || ''), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('Session')!)}`}
    })

    return await data.json() as { docs: Documento[]}
}