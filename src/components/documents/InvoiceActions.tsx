"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Check, Loader2 } from "lucide-react";
import { convertDevisToFacture, markFactureAsPaid } from "@/app/actions/documents";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ConvertToInvoiceButton({ devisId, projectId }: { devisId: string; projectId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleConvert = async () => {
        setLoading(true);
        const result = await convertDevisToFacture(devisId, projectId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Facture créée avec succès !");
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleConvert}
            disabled={loading}
            className="gap-1.5 text-xs font-bold border-primary text-primary hover:bg-primary/10 h-8 rounded-lg"
        >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            {loading ? "Création..." : "Convertir en Facture"}
        </Button>
    );
}

export function MarkAsPaidButton({ documentId, projectId }: { documentId: string; projectId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleMarkPaid = async () => {
        setLoading(true);
        const result = await markFactureAsPaid(documentId, projectId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Facture marquée comme payée !");
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleMarkPaid}
            disabled={loading}
            className="gap-1.5 text-xs font-bold border-emerald-500 text-emerald-600 hover:bg-emerald-50 h-8 rounded-lg"
        >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {loading ? "Mise à jour..." : "Marquer Payée"}
        </Button>
    );
}
