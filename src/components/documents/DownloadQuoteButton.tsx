"use client";

import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuotePDF } from '@/components/documents/QuotePDF';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DownloadProps {
    pdfData: any;
    filename: string;
    variant?: "default" | "outline" | "ghost" | "secondary";
    label?: string;
}

export function DownloadQuoteButton({ pdfData, filename, variant = "outline", label = "Télécharger le PDF" }: DownloadProps) {
    // We need to delay rendering PDFDownloadLink until after mounting to avoid Next.js hydration mismatch
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return (
        <Button variant={variant} disabled className="gap-2">
            <FileText className="w-4 h-4" /> Chargement du PDF...
        </Button>
    );

    return (
        <PDFDownloadLink
            document={<QuotePDF {...pdfData} />}
            fileName={filename}
            className="w-full sm:w-auto"
        >
            {({ blob, url, loading, error }) => (
                <Button variant={variant} disabled={loading} className="gap-2 w-full sm:w-auto">
                    {loading ? (
                        <>
                            <FileText className="w-4 h-4 animate-pulse" /> Génération...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" /> {label}
                        </>
                    )}
                </Button>
            )}
        </PDFDownloadLink>
    );
}
