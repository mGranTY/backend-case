/**
 * v0 by Vercel.
 * @see https://v0.dev/t/ZCa1C8kpmZC
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenu
} from "@/components/ui/dropdown-menu"
import {TableHead, TableRow, TableHeader, TableCell, TableBody, Table} from "@/components/ui/table"
import {Link} from "react-router-dom";
import {SVGProps, useEffect, useState} from "react";
import { JSX } from "react/jsx-runtime";
import useGetDocuments from "@/hooks/useGetDocuments.tsx";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import deleteDocument from "@/components/actions/deleteDocument.ts";
import uploadDocument from "@/components/actions/uploadDocument.ts";




export default function Dashboard() {

    //Hooks
    const queryClient = useQueryClient()

    const [searchParams, setSearchParams] = useState<string>('')
    const { data, isLoading, refetch } = useGetDocuments(`${searchParams}`)
    //Functions
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if(event.target.files && event.target.files[0]){
            const file = event.target.files[0];
            uploadMutation?.mutate(file)
            setSearchParams('')
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            refetch()
        }, 1000)

        return () => clearTimeout(delayDebounceFn)
    }, [searchParams])

    //Query
    const uploadMutation = useMutation({
        mutationFn: (file: File) => uploadDocument(file),
        onSuccess: (data) => {
            if(data){
                void queryClient.invalidateQueries()
            }
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (hash: string) => deleteDocument(hash),
            onSuccess: (data) => {
                if(data){
                    void queryClient.invalidateQueries()
                }
            }
    })


    // User Interface
    if(isLoading && !data){
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-gray-900"/>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
                <Link className="lg:hidden" to={'/'}>
                    <Package2Icon className="h-6 w-6"/>
                    <span className="sr-only">Home</span>
                </Link>
                <div className="w-full flex-1">
                    <form>
                        <div className="relative">
                            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400"/>
                            <Input
                                className="w-full bg-white shadow-none appearance-none pl-8 md:w-2/3 lg:w-1/3 dark:bg-gray-950"
                                placeholder="Search documents..."
                                type="search"
                                onChange={(e) => setSearchParams(e.target.value)}
                            />
                        </div>
                    </form>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            className="rounded-full border border-gray-200 w-8 h-8 dark:border-gray-800"
                            size="icon"
                            variant="ghost"
                        >
                            <img
                                alt="Avatar"
                                className="rounded-full"
                                height="32"
                                src="/placeholder.svg"
                                style={{
                                    aspectRatio: "32/32",
                                    objectFit: "cover",
                                }}
                                width="32"
                            />
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <div className="flex items-center">
                    <h1 className="font-semibold text-lg md:text-2xl">Documents</h1>

                    <Button className="ml-auto" size="sm">
                        <input
                            type="file"
                            accept=".pdf, .docx, .jpg, .jpeg, .png"
                            onChange={(e) => handleFileChange(e)}
                            className="ml-auto"
                        />
                    </Button>
                </div>
                <div className="border shadow-sm rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead className="max-w-[150px]">Name</TableHead>
                                <TableHead className="hidden md:table-cell">Keywords</TableHead>
                                {/*<TableHead className="hidden md:table-cell">Last Updated</TableHead>*/}
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.docs.map(doc => <TableRow key={doc.originalname}>
                                <TableCell>
                                    <img
                                        alt="Document image"
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={doc.mimetype === "application/pdf" ?  "src/assets/pdf-icon.png" : doc.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? "src/assets/docx.png" : "src/assets/image.png"}
                                        width="64"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{doc.originalname}</TableCell>
                                <TableCell className="hidden md:table-cell">{doc.keywords.toString()}</TableCell>
                                <TableCell>
                                    <Button className="mr-2" size="icon" variant="outline">
                                        <PencilIcon className="h-4 w-4"/>
                                        <span className="sr-only">Edit</span>
                                    </Button>
                                    <Button onClick={() => deleteMutation?.mutate(doc.hash)} size="icon" variant="outline">
                                        <TrashIcon className="h-4 w-4"/>
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </div>
    )
}

function Package2Icon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
            <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/>
            <path d="M12 3v6"/>
        </svg>
    )
}


function PencilIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
        </svg>
    )
}


function SearchIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
        </svg>
    )
}


function TrashIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>
    )
}
