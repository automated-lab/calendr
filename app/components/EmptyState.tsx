import { Button } from "@/components/ui/button";
import { Ban, PlusCircle } from "lucide-react";
import Link from "next/link";

interface iAppProps {
    title: string;
    description: string;
    buttonText: string;
    href: string;
}

export function EmptyState({ title, description, buttonText, href }: iAppProps) {
    return(
        <div className="flex flex-col items-center justify-center h-full flex-1 rounded-md border border-dashed p-8 text-center animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-center size-20 rounded-full bg-primary/10">
                <Ban className="size-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mt-6">{title}</h2>
            <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
            <Button className="mt-4" asChild>
                <Link href={href}><PlusCircle className="size-4 mr-2" />{buttonText}</Link>
            </Button>
        </div>
    )
}