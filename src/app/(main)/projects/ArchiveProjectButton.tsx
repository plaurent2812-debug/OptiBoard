"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import { archiveProject } from "./actions";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ArchiveProjectButton({ projectId, currentStatus }: { projectId: string, currentStatus: string }) {
    const [isArchiving, setIsArchiving] = useState(false);
    const [open, setOpen] = useState(false);

    if (currentStatus === 'ARCHIVE') return null;

    const handleArchive = async () => {
        setIsArchiving(true);
        try {
            await archiveProject(projectId);
            toast.success("Chantier archivé !");
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'archivage.");
        } finally {
            setIsArchiving(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 shrink-0 border border-transparent hover:border-primary/30 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors" title="Archiver ce chantier">
                    <Archive className="w-5 h-5" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Archiver ce chantier ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Le chantier n&apos;apparaîtra plus dans vos projets en cours, mais restera accessible dans l&apos;historique et ses données financières seront conservées.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleArchive}
                        disabled={isArchiving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                    >
                        {isArchiving ? "Archivage..." : "Archiver le chantier"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
