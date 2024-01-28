import {useQuery} from "@tanstack/react-query";
import getDocuments from "@/components/actions/getDocuments.ts";


export default function useGetDocuments(searchParam: string = ''){
    return useQuery({
        queryKey: ["Documentos"],
        queryFn: () => getDocuments(searchParam)
    })
}