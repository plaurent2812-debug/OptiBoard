"use client";

import { useTransition } from "react";
import { acceptQuote, declineQuote } from "./actions";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

export function QuoteActions({ projectId }: { projectId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleAccept = () => {
        startTransition(async () => {
            try {
                await acceptQuote(projectId);
                toast.success("Devis accepté ! L'artisan a été prévenu.");
            } catch (error) {
                toast.error("Erreur lors de l'acceptation du devis.");
            }
        });
    };

    const handleDecline = () => {
        if (!confirm("Êtes-vous sûr de vouloir refuser ce devis sans y donner suite ?")) return;

        startTransition(async () => {
            try {
                await declineQuote(projectId);
                toast.success("Devis refusé.");
            } catch (error) {
                toast.error("Erreur lors du refus du devis.");
            }
        });
    };

    return (
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
                onClick={handleAccept}
                disabled={isPending}
                className="flex-1 h-12 text-[15px] font-bold gap-2 shadow-md"
            >
                {isPending ? "Traitement..." : <><Check className="w-5 h-5" /> Accepter le devis</>}
            </Button>
            <Button
                onClick={handleDecline}
                disabled={isPending}
                variant="outline"
                className="flex-none sm:w-1/3 h-12 text-[15px] font-semibold text-muted-foreground gap-2 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
                <X className="w-5 h-5" /> Refuser
            </Button>
        </div>
    );
}
