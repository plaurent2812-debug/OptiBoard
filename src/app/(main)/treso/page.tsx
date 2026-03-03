import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowDownRight, ArrowUpRight, Banknote, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectFilter } from "@/components/treso/ProjectFilter";

export default async function TresoPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    const resolvedSearchParams = await searchParams;
    const selectedProjectId = resolvedSearchParams.project as string | undefined;

    // Fetch all active projects for the dropdown
    const { data: allProjects } = await supabase
        .from("projects")
        .select("id, title")
        .eq("organization_id", orgId)
        .in("status", ["DEVIS", "EN_COURS"]);

    // Fetch Devis (Only if global or if the selected project is a DEVIS)
    let devisQuery = supabase
        .from("projects")
        .select("total_ht")
        .eq("organization_id", orgId)
        .eq("status", "DEVIS");

    if (selectedProjectId) {
        devisQuery = devisQuery.eq("id", selectedProjectId);
    }
    const { data: devisProjects } = await devisQuery;
    const devisProjectsResponse = devisProjects as any[] || [];
    const totalDevis = devisProjectsResponse.reduce((acc, p) => acc + (p.total_ht || 0), 0) || 0;

    // Fetch Factures
    let facturesQuery = supabase
        .from("documents")
        .select("amount_ht, status")
        .eq("organization_id", orgId)
        .eq("type", "FACTURE");

    if (selectedProjectId) {
        facturesQuery = facturesQuery.eq("project_id", selectedProjectId);
    }
    const { data: factures } = await facturesQuery;
    const facturesResponse = factures as any[] || [];
    // Sum factures that are not PAYEE
    const totalFacturesToCollect = facturesResponse
        .filter(f => f.status !== "PAYEE")
        .reduce((acc, f) => acc + (f.amount_ht || 0), 0) || 0;

    // Fetch Achats
    let achatsQuery = supabase
        .from("documents")
        .select("amount_ht")
        .eq("organization_id", orgId)
        .eq("type", "ACHAT");

    if (selectedProjectId) {
        achatsQuery = achatsQuery.eq("project_id", selectedProjectId);
    }
    const { data: achats } = await achatsQuery;
    const achatsResponse = achats as any[] || [];
    const totalAchats = achatsResponse.reduce((acc, a) => acc + (a.amount_ht || 0), 0) || 0;

    // Fetch recent documents (Achats & Factures)
    let recentDocsQuery = supabase
        .from("documents")
        .select("id, type, amount_ht, created_at, status")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(10);

    if (selectedProjectId) {
        recentDocsQuery = recentDocsQuery.eq("project_id", selectedProjectId);
    }
    const { data: recentDocs } = await recentDocsQuery;
    const recentDocsResponse = recentDocs as any[] || [];

    return (
        <div className="p-4 flex flex-col gap-6 min-h-screen bg-background pb-28">
            <div className="mt-2 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary">Trésorerie</h1>
                    <p className="text-muted-foreground font-medium mt-1">Gérez vos revenus et dépenses</p>
                </div>
                <div className="flex items-center gap-2">
                    <a href="/api/export-compta" download>
                        <Button variant="outline" size="sm" className="font-bold border-primary text-primary hover:bg-primary/10 shadow-sm text-xs h-9">
                            <Download className="w-4 h-4 mr-1" /> Export Comptable
                        </Button>
                    </a>
                    <Link href="/archives">
                        <Button variant="outline" size="sm" className="font-bold border-border shadow-sm text-xs h-9">
                            Archives
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Project Filter Dropdown */}
            <ProjectFilter projects={allProjects || []} selectedId={selectedProjectId} />

            <div className="grid grid-cols-2 gap-4">
                {/* Factures à encaisser */}
                <Card className="col-span-2 bg-card border-l-4 border-l-success border-t-border border-r-border border-b-border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-success">
                            <ArrowDownRight className="w-5 h-5" /> À encaisser
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tracking-tight">{totalFacturesToCollect.toLocaleString('fr-FR')} €</div>
                        <p className="text-sm text-foreground/70 mt-1.5 font-semibold">Factures en attente de paiement</p>
                    </CardContent>
                </Card>

                {/* Dépenses */}
                <Card className="border-border shadow-sm border-l-4 border-l-destructive">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                            <ArrowUpRight className="w-4 h-4" /> Achats
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tight">{totalAchats.toLocaleString('fr-FR')} €</div>
                        <p className="text-[11px] text-muted-foreground font-semibold mt-1">Dépenses du {selectedProjectId ? 'projet' : 'mois'}</p>
                    </CardContent>
                </Card>

                {/* Devis */}
                <Card className="border-border shadow-sm border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                            <FileText className="w-4 h-4" /> {selectedProjectId ? 'Budget' : 'Devis'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tight">{totalDevis.toLocaleString('fr-FR')} €</div>
                        <p className="text-[11px] text-muted-foreground font-semibold mt-1">{selectedProjectId ? 'Total prévu' : 'En attente de signature'}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Historique */}
            <div className="mt-4 flex flex-col gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                    <Banknote className="w-6 h-6" /> Derniers Mouvements
                </h2>

                <div className="flex flex-col gap-3">
                    {recentDocsResponse.length === 0 ? (
                        <p className="text-center text-muted-foreground bg-muted/20 py-10 rounded-xl border border-dashed border-border text-sm font-medium">
                            Aucune transaction récente.<br />
                            <span className="text-xs opacity-70">Ajoutez une facture ou une dépense.</span>
                        </p>
                    ) : (
                        recentDocsResponse.map((doc) => (
                            <Card key={doc.id} className="overflow-hidden border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${doc.type === 'ACHAT' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'
                                            }`}>
                                            {doc.type === 'ACHAT' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[15px]">{doc.type === 'ACHAT' ? 'Dépense / Matériel' : 'Facture client'}</p>
                                            <p className="text-[13px] text-muted-foreground font-medium mt-0.5">
                                                {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                                {doc.status && ` • ${doc.status}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`font-black text-xl tracking-tight ${doc.type === 'ACHAT' ? 'text-foreground' : 'text-success'}`}>
                                        {doc.type === 'ACHAT' ? '-' : '+'}{doc.amount_ht} €
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
