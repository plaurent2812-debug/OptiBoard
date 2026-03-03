import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteProjectButton } from "../DeleteProjectButton";
import { ArchiveProjectButton } from "../ArchiveProjectButton";
import { DownloadQuoteButton } from "@/components/documents/DownloadQuoteButton";
import { FileImage, Banknote, User, Phone, MapPin, Calendar, ArrowLeft, Plus, AlignLeft, Receipt } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ConvertToInvoiceButton, MarkAsPaidButton } from "@/components/documents/InvoiceActions";

export default async function ProjectDetailsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    // Fetch Project Data
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
            *,
            client:client_id(name, phone, address)
        `)
        .eq('id', projectId)
        .eq('organization_id', orgId)
        .single();

    if (projectError || !project) {
        notFound();
    }
    const projectData = project as any;

    // Safely parse client relationships
    const clientData = typeof projectData.client === 'object' && projectData.client ? (projectData.client as { name?: string, phone?: string, address?: string }) : null;
    const clientName = clientData?.name || 'Inconnu';
    const clientPhone = clientData?.phone || 'Non renseigné';
    const clientAddress = clientData?.address || 'Non renseignée';

    // Fetch Org Name for PDF Export
    const { data: orgReq } = await supabase.from('organizations').select('name').eq('id', orgId).single();
    const orgName = (orgReq as any)?.name || 'OptiPro Artisan';

    // Fetch Documents (Factures/Achats for Treso Tab)
    const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

    // Fetch document items for all devis/factures
    const documentsList = documents as any[] || [];
    const docIds = documentsList.map(d => d.id);
    let allDocItems: any[] = [];
    if (docIds.length > 0) {
        const { data: items } = await (supabase
            .from('document_items') as any)
            .select('*')
            .in('document_id', docIds)
            .order('sort_order', { ascending: true });
        allDocItems = items || [];
    }

    // Fetch Captures (Images/Memos for Documents Tab)
    const { data: captures } = await supabase
        .from('captures')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

    const projectImages = (captures as any[])?.filter(c => c.type === 'IMAGE') || [];

    const getDocStatusBadge = (type: string, status: string) => {
        if (type === 'ACHAT') return <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">Dépense</Badge>;
        switch (status) {
            case 'EN_ATTENTE': return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[10px]">En attente</Badge>;
            case 'ACCEPTE': return <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-[10px]">Accepté</Badge>;
            case 'PAYEE': return <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 text-[10px]">Payée</Badge>;
            default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
        }
    };

    const getDocTypeLabel = (type: string) => {
        switch (type) {
            case 'DEVIS': return 'Devis';
            case 'FACTURE': return 'Facture';
            case 'ACHAT': return 'Dépense';
            default: return type;
        }
    };

    return (
        <div className="p-4 flex flex-col gap-6 min-h-screen bg-background pb-28">
            <div className="flex items-center gap-3 mt-2">
                <Link href="/projects">
                    <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 shrink-0 border border-transparent hover:border-border hover:bg-muted">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </Button>
                </Link>
                <div className="flex-1 truncate">
                    <h1 className="text-2xl font-black tracking-tight truncate text-primary">{projectData.title}</h1>
                    <Badge variant="outline" className="mt-1 font-semibold">{projectData.status}</Badge>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1">
                    <ArchiveProjectButton projectId={projectId} currentStatus={projectData.status} />
                    <DeleteProjectButton projectId={projectId} />
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full grid-cols-3 grid h-auto p-1 bg-muted/50 rounded-xl border border-border sticky top-4 z-10">
                    <TabsTrigger value="overview" className="rounded-lg py-2.5 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">Détails</TabsTrigger>
                    <TabsTrigger value="treso" className="rounded-lg py-2.5 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">Trésorerie</TabsTrigger>
                    <TabsTrigger value="docs" className="rounded-lg py-2.5 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                                <User className="w-4 h-4" /> Client
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 flex flex-col gap-3">
                            <p className="font-bold text-lg">{clientName}</p>
                            <div className="flex flex-col gap-2 text-sm text-muted-foreground font-medium">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> {clientPhone}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> {clientAddress}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                                <AlignLeft className="w-4 h-4" /> Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                {projectData.description || "Aucune description renseignée pour ce chantier."}
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="treso" className="mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 p-4 bg-muted/40 rounded-xl border border-border">
                            <span className="text-xs font-bold text-muted-foreground">Budget</span>
                            <span className="font-extrabold text-xl">{projectData.budget || 0} €</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                            <span className="text-xs font-bold">Total Vendu</span>
                            <span className="font-extrabold text-xl">{projectData.total_ht || 0} €</span>
                        </div>
                    </div>

                    <div className="flex flex-row justify-between items-center mt-2 mb-2">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-muted-foreground" /> Mouvements
                        </h3>
                        <Link href={`/projects/${projectId}/devis/new`}>
                            <Button variant="outline" size="sm" className="h-8 shadow-sm gap-1.5 rounded-lg text-xs font-semibold">
                                <Plus className="w-3.5 h-3.5" /> Créer Devis
                            </Button>
                        </Link>
                    </div>

                    {(!documentsList || documentsList.length === 0) ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-card rounded-xl border border-dashed border-border text-center">
                            <Banknote className="w-8 h-8 text-muted-foreground mb-3" />
                            <p className="font-semibold text-foreground">Aucune dépense ou facture/devis</p>
                            <p className="text-sm text-muted-foreground mt-1">Les éléments apparaîtront ici.</p>
                        </div>
                    ) : (
                        documentsList.map((doc) => {
                            // Get line items for this document
                            const docItems = allDocItems.filter(item => item.document_id === doc.id);

                            // Build PDF data from document_items (or fallback to old JSON approach)
                            let pdfData = null;
                            if ((doc.type === 'DEVIS' || doc.type === 'FACTURE') && docItems.length > 0) {
                                pdfData = {
                                    organizationName: orgName,
                                    clientName: clientName,
                                    clientAddress: clientAddress,
                                    projectTitle: projectData.title,
                                    quoteDate: new Date(doc.created_at).toLocaleDateString('fr-FR'),
                                    items: docItems.map((item: any) => ({
                                        description: item.description,
                                        quantity: item.quantity,
                                        price: item.unit_price_ht,
                                    })),
                                    totalHT: doc.amount_ht || 0,
                                    quoteId: doc.id.split('-')[0].toUpperCase()
                                };
                            } else if (doc.type === 'DEVIS' && doc.url && doc.url.startsWith('[')) {
                                // Legacy fallback for old JSON-based devis
                                try {
                                    const items = JSON.parse(doc.url);
                                    pdfData = {
                                        organizationName: orgName,
                                        clientName: clientName,
                                        clientAddress: clientAddress,
                                        projectTitle: projectData.title,
                                        quoteDate: new Date(doc.created_at).toLocaleDateString('fr-FR'),
                                        items: items,
                                        totalHT: doc.amount_ht || 0,
                                        quoteId: doc.id.split('-')[0].toUpperCase()
                                    };
                                } catch (e) { /* ignore */ }
                            }

                            const isDevisAccepte = doc.type === 'DEVIS' && doc.status === 'ACCEPTE';
                            const isFactureUnpaid = doc.type === 'FACTURE' && doc.status !== 'PAYEE';

                            return (
                                <div key={doc.id} className="flex flex-col gap-3 p-4 bg-card rounded-xl border border-border shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold">{getDocTypeLabel(doc.type)}</p>
                                                {getDocStatusBadge(doc.type, doc.status)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mt-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                                {doc.reference_number && ` • ${doc.reference_number}`}
                                            </div>
                                        </div>
                                        <div className={`font-black text-lg ${doc.type === 'ACHAT' ? 'text-foreground' : 'text-success'}`}>
                                            {doc.type === 'ACHAT' ? '-' : '+'}{doc.amount_ht} €
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="pt-2 border-t border-border/50 flex justify-end gap-2 flex-wrap">
                                        {pdfData && (
                                            <DownloadQuoteButton
                                                pdfData={pdfData}
                                                filename={`${getDocTypeLabel(doc.type)}_${projectData.title.replace(/\s+/g, '_')}.pdf`}
                                                variant="outline"
                                                label={`PDF ${getDocTypeLabel(doc.type)}`}
                                            />
                                        )}
                                        {isDevisAccepte && (
                                            <ConvertToInvoiceButton devisId={doc.id} projectId={projectId} />
                                        )}
                                        {isFactureUnpaid && (
                                            <MarkAsPaidButton documentId={doc.id} projectId={projectId} />
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </TabsContent>

                <TabsContent value="docs" className="mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm text-muted-foreground font-medium mb-2">
                        Retrouvez ici toutes les photos liées à ce chantier (prises via l&apos;ajout rapide).
                    </p>

                    {(!projectImages || projectImages.length === 0) ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-card rounded-xl border border-dashed border-border text-center">
                            <FileImage className="w-8 h-8 text-muted-foreground mb-3" />
                            <p className="font-semibold text-foreground">Aucun document photographié</p>
                            <p className="text-sm text-muted-foreground mt-1">Utilisez le bouton &quot;Photo&quot; du Magic Push.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {projectImages.map((img) => (
                                <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted shadow-sm">
                                    {(img as any).storage_url ? (
                                        <Image
                                            src={(img as any).storage_url}
                                            alt="Document Projet"
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            Aucune image
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                        <p className="text-[10px] text-white/90 font-medium">
                                            {new Date((img as any).created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
