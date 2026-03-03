import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuoteActions } from "./QuoteActions";
import { DownloadQuoteButton } from "@/components/documents/DownloadQuoteButton";
import { CheckCircle2, Clock, MapPin, Building2, Check, X, ArrowRight, ShieldCheck } from "lucide-react";

export default async function ClientPortalPage({
    params
}: {
    params: Promise<{ projectId: string }>
}) {
    const resolvedParams = await params;
    const projectId = resolvedParams.projectId;
    const supabase = await createClient();

    // Fetch Project with Organization details
    const { data: projectResp, error: projectError } = await supabase
        .from('projects')
        .select(`
            *,
            client:client_id(name, address),
            organization:organization_id(name)
        `)
        .eq('id', projectId)
        .single();

    if (projectError || !projectResp) {
        console.error("Portal Project fetch error:", projectError);
        notFound();
    }

    const project = projectResp as any;

    // Safely parse relationships
    const clientData = typeof project.client === 'object' && project.client ? (project.client as { name?: string, address?: string }) : null;
    const orgData = typeof project.organization === 'object' && project.organization ? (project.organization as { name?: string }) : null;

    // Fetch Devis content if exists
    const { data: devisDocs } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('type', 'DEVIS')
        .order('created_at', { ascending: false })
        .limit(1);

    const devis = devisDocs?.[0];
    const currentDevis = devis as any;

    // Attempt to parse line items from the url field if it was saved via our generator
    let lineItems = [];
    if (currentDevis?.url && currentDevis.url.startsWith('[')) {
        try {
            lineItems = JSON.parse(currentDevis.url);
        } catch (e) {
            console.error("Failed to parse devis line items");
        }
    }

    // Determine the progress step
    const progressSteps = [
        { id: 'DEVIS', label: 'Devis', icon: Clock },
        { id: 'EN_COURS', label: 'Chantier en cours', icon: Clock },
        { id: 'TERMINE', label: 'Terminé / Facturé', icon: CheckCircle2 }
    ];

    const currentStepIndex = progressSteps.findIndex(s => s.id === project.status);
    // If it's archived, it's a special case, we'll handle it visually.

    if (project.status === 'ARCHIVE') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <X className="w-8 h-8 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Projet Archivé</h1>
                <p className="text-muted-foreground">Ce devis ou projet n'est plus actif.</p>
            </div>
        );
    }

    // Build PDF props if devis exists
    const pdfData = currentDevis ? {
        organizationName: orgData?.name || 'Votre Artisan',
        clientName: clientData?.name || 'Client',
        clientAddress: clientData?.address || '',
        projectTitle: project.title,
        quoteDate: new Date(currentDevis.created_at).toLocaleDateString('fr-FR'),
        items: lineItems,
        totalHT: currentDevis.amount_ht || 0,
        quoteId: currentDevis.id.split('-')[0].toUpperCase(),
    } : null;

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">
            {/* Header / Org Branding */}
            <div className="flex flex-col items-center justify-center pt-8 pb-10 text-center gap-2">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                    <Building2 className="w-7 h-7" />
                </div>
                <h1 className="text-[14px] font-bold text-muted-foreground uppercase tracking-widest">{orgData?.name || 'Votre Artisan'}</h1>
                <h2 className="text-3xl font-black tracking-tight mt-1">{project.title}</h2>
            </div>

            {/* Progress Tracker Tracker */}
            <div className="mb-10 relative">
                <div className="absolute top-1/2 left-4 right-4 h-1 bg-border -translate-y-1/2 rounded-full -z-10" />
                <div className="absolute top-1/2 left-4 h-1 bg-primary -translate-y-1/2 rounded-full -z-10 transition-all duration-500"
                    style={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / (progressSteps.length - 1)) * 100 : 0}%` }}
                />

                <div className="flex justify-between">
                    {progressSteps.map((step, index) => {
                        const isCompleted = index < currentStepIndex || (index === currentStepIndex && project.status === 'TERMINE');
                        const isCurrent = index === currentStepIndex && project.status !== 'TERMINE';

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-white' :
                                    isCurrent ? 'bg-background border-primary text-primary shadow-[0_0_0_4px_rgba(var(--primary),0.1)]' :
                                        'bg-background border-border text-muted-foreground'
                                    }`}>
                                    {isCompleted ? <Check className="w-4 h-4" /> : <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-primary' : 'bg-transparent'}`} />}
                                </div>
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${isCurrent || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Information Panel */}
            <Card className="border-border shadow-sm mb-6 rounded-2xl overflow-hidden">
                <div className="bg-secondary/40 p-4 border-b border-border/50 flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground">Détails de l'intervention</span>
                    <Badge variant="outline" className="bg-background">#{project.id.split('-')[0].toUpperCase()}</Badge>
                </div>
                <CardContent className="p-5 flex flex-col gap-4">
                    <div className="flex gap-3 items-start text-sm">
                        <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-foreground">{clientData?.name}</p>
                            <p className="text-muted-foreground mt-0.5">{clientData?.address || "Lieu non précisé"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quote / Devis Section */}
            {project.status === 'DEVIS' && currentDevis && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-bold text-xl px-1">Proposition commerciale</h3>

                    <Card className="border-border shadow-md rounded-2xl overflow-hidden border-t-4 border-t-primary">
                        <CardContent className="p-0">
                            <div className="p-5 flex flex-col gap-5">
                                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground">Devis émis le</p>
                                        <p className="font-bold">{new Date(currentDevis.created_at).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                                        <div className="text-left sm:text-right">
                                            <p className="text-sm font-semibold text-muted-foreground">Total HT</p>
                                            <p className="text-3xl font-black text-primary">{(currentDevis.amount_ht || 0).toLocaleString('fr-FR')} €</p>
                                        </div>
                                        {pdfData && (
                                            <DownloadQuoteButton
                                                pdfData={pdfData}
                                                filename={`Devis_${project.title.replace(/\s+/g, '_')}.pdf`}
                                            />
                                        )}
                                    </div>
                                </div>

                                {lineItems.length > 0 && (
                                    <div className="mt-2 text-sm border-t border-dashed border-border/60 pt-4 flex flex-col gap-3">
                                        <p className="font-bold text-foreground">Détail des prestations :</p>
                                        <div className="bg-secondary/30 rounded-xl p-3 border border-border">
                                            {lineItems.map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                                    <div className="flex-1 pr-4">
                                                        <p className="font-semibold text-foreground">{item.description}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">Qté : {item.quantity} × {item.price}€</p>
                                                    </div>
                                                    <div className="font-bold shrink-0">
                                                        {(item.quantity * item.price).toLocaleString('fr-FR')} €
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Client Actions */}
                            <div className="bg-primary/5 p-5 border-t border-primary/10">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-start gap-2 text-xs font-semibold text-primary/80 mb-2">
                                        <ShieldCheck className="w-4 h-4 shrink-0" />
                                        <p>En acceptant ce devis, vous donnez votre accord pour le démarrage des travaux aux conditions indiquées.</p>
                                    </div>
                                    <QuoteActions projectId={projectId} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* In Progress Status */}
            {project.status === 'EN_COURS' && (
                <div className="flex flex-col items-center justify-center p-8 bg-primary/10 rounded-2xl border border-primary/20 text-center animate-in zoom-in-95 mt-6">
                    <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">Travaux en cours</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">Le devis a été accepté et le chantier est programmé. Votre artisan vous tiendra au courant de l'avancement.</p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-16 text-center text-sm font-medium text-muted-foreground flex items-center justify-center gap-1.5 grayscale opacity-50">
                Propulsé par <ArrowRight className="w-3 h-3" /> <span className="font-black">OptiPro</span>
            </div>
        </div>
    );
}
