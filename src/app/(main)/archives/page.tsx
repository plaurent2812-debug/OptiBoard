import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FolderCheck, Receipt, ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ArchivesPage() {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    // 1. Fetch Completed Projects
    const { data: finishedProjects } = await supabase
        .from("projects")
        .select(`
            id, title, total_ht, status, created_at,
            client:clients(name)
        `)
        .eq("organization_id", orgId)
        .in("status", ["TERMINE", "ARCHIVE"])
        .order("created_at", { ascending: false });

    // 2. Fetch Paid Factures
    const { data: paidFactures } = await supabase
        .from("documents")
        .select("id, amount_ht, created_at, status")
        .eq("organization_id", orgId)
        .eq("type", "FACTURE")
        .eq("status", "PAYEE")
        .order("created_at", { ascending: false });

    // 3. Fetch All Achats (Expenses)
    const { data: expenses } = await supabase
        .from("documents")
        .select("id, amount_ht, created_at, status")
        .eq("organization_id", orgId)
        .eq("type", "ACHAT")
        .order("created_at", { ascending: false });

    return (
        <div className="p-4 flex flex-col gap-6 min-h-screen bg-background">
            <div className="flex items-center gap-3 mt-2">
                <Link href="/treso">
                    <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 hover:bg-muted">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-primary">Archives</h1>
                    <p className="text-muted-foreground font-medium text-sm mt-0.5">Historique complet</p>
                </div>
            </div>

            <Tabs defaultValue="projets" className="w-full mt-2">
                <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-xl h-14">
                    <TabsTrigger value="projets" className="rounded-lg font-bold text-xs h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
                        <FolderCheck className="w-4 h-4 mr-1.5" /> Projets
                    </TabsTrigger>
                    <TabsTrigger value="factures" className="rounded-lg font-bold text-xs h-full data-[state=active]:bg-success data-[state=active]:text-success-foreground data-[state=active]:shadow-md transition-all">
                        <Receipt className="w-4 h-4 mr-1.5" /> Factures
                    </TabsTrigger>
                    <TabsTrigger value="depenses" className="rounded-lg font-bold text-xs h-full data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground data-[state=active]:shadow-md transition-all">
                        <ShoppingCart className="w-4 h-4 mr-1.5" /> Achats
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="projets" className="m-0 flex flex-col gap-3">
                        {finishedProjects?.length === 0 ? (
                            <p className="text-center text-muted-foreground bg-muted/20 py-10 rounded-xl border border-dashed border-border text-sm font-medium">Aucun projet terminé ou archivé.</p>
                        ) : (
                            finishedProjects?.map((project: { id: string, title: string, total_ht: number, status: string, created_at: string, client?: { name: string } | { name: string }[] | null }) => (
                                <Card key={project.id} className="border-border shadow-sm">
                                    <CardContent className="p-4 flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-[16px] leading-tight">{project.title}</h3>
                                                <p className="text-sm text-primary font-semibold mt-1">
                                                    {(Array.isArray(project.client) ? project.client[0]?.name : project.client?.name) || 'Client Inconnu'}
                                                </p>
                                            </div>
                                            <span className="font-black tracking-tight whitespace-nowrap ml-4">{project.total_ht?.toLocaleString('fr-FR')} €</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                                            <span className="text-xs text-muted-foreground font-medium">{new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">{project.status}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="factures" className="m-0 flex flex-col gap-3">
                        {paidFactures?.length === 0 ? (
                            <p className="text-center text-muted-foreground bg-muted/20 py-10 rounded-xl border border-dashed border-border text-sm font-medium">Aucune facture encaissée disponible.</p>
                        ) : (
                            paidFactures?.map((doc: { id: string, amount_ht: number, created_at: string }) => (
                                <Card key={doc.id} className="border-success/30 shadow-sm bg-success/5">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-[15px] text-success-foreground">Facture Client</h3>
                                            <p className="text-xs text-muted-foreground font-medium mt-1">{new Date(doc.created_at).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                        <div className="font-black text-lg text-success tracking-tight">
                                            + {doc.amount_ht?.toLocaleString('fr-FR')} €
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="depenses" className="m-0 flex flex-col gap-3">
                        {expenses?.length === 0 ? (
                            <p className="text-center text-muted-foreground bg-muted/20 py-10 rounded-xl border border-dashed border-border text-sm font-medium">Aucune dépense ou achat enregistré.</p>
                        ) : (
                            expenses?.map((doc: { id: string, amount_ht: number, created_at: string }) => (
                                <Card key={doc.id} className="border-destructive/20 shadow-sm bg-destructive/5">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-[15px] text-destructive-foreground">Achat / Matériel</h3>
                                            <p className="text-xs text-muted-foreground font-medium mt-1">{new Date(doc.created_at).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                        <div className="font-black text-lg text-destructive tracking-tight">
                                            - {doc.amount_ht?.toLocaleString('fr-FR')} €
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
