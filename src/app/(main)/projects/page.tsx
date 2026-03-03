import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderKanban, MoreVertical, TrendingDown, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function getStatusBadge(status: string) {
    switch (status) {
        case 'DEVIS':
            return <Badge variant="outline" className="text-secondary-foreground border-border px-3 py-1 font-semibold bg-secondary/50">Devis</Badge>;
        case 'EN_COURS':
            return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 px-3 py-1 font-semibold">En cours</Badge>;
        case 'TERMINE':
            return <Badge className="bg-success/10 text-success hover:bg-success/20 border-0 px-3 py-1 font-semibold">Terminé</Badge>;
        case 'ARCHIVE':
            return <Badge variant="secondary" className="opacity-50 px-3 py-1 font-semibold">Archivé</Badge>;
        default:
            return null;
    }
}

export const dynamic = 'force-dynamic';

export default async function ProjectsPipeline() {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
            id,
            title,
            status,
            budget,
            margin,
            client:client_id(name)
        `)
        .eq('organization_id', orgId)
        .neq('status', 'ARCHIVE')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Projects Fetch Error:", JSON.stringify(error, null, 2), error?.message || error);
    }

    const projectsResponse = projects as any[] || [];

    // Default mock margin for visual effect until we implement full financial tracking per project
    const defaultMarginTarget = 30;

    return (
        <div className="p-4 flex flex-col gap-6 pb-28">
            {/* Header */}
            <div className="flex justify-between items-center mt-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Projets</h1>
                    <p className="text-muted-foreground">Suivi de votre pipeline</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/projects/new">
                        <Button size="icon" className="w-12 h-12 rounded-full shadow-sm">
                            <Plus className="w-6 h-6" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Project List */}
            <div className="flex flex-col gap-4 mt-2">
                {projectsResponse.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-secondary/30">
                        <p className="font-medium text-foreground">Aucun projet pour le moment.</p>
                        <p className="text-sm mt-1">Utilisez l&apos;ajout rapide pour en créer un.</p>
                    </div>
                ) : (
                    projectsResponse.map((project) => {
                        // Calculate mock or real margin based on budget estimate vs total
                        const rev = project.budget || 0; // Total project value
                        const marginValue = project.margin || 0; // Absolute margin
                        const marginPercent = rev > 0 ? Math.round((marginValue / rev) * 100) : 0;
                        const isMarginGood = marginPercent >= defaultMarginTarget;
                        const clientName = typeof project.client === 'object' && project.client ? ((project.client as unknown) as { name: string }).name : 'Client inconnu';

                        return (
                            <Link href={`/projects/${project.id}`} key={project.id}>
                                <Card className="overflow-hidden border-border bg-card shadow-sm rounded-2xl hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                                    <CardContent className="p-5 flex flex-col gap-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <h3 className="font-bold text-[18px] leading-tight">{project.title}</h3>
                                                <p className="text-[14px] text-muted-foreground font-medium mt-1">
                                                    Client: {clientName}
                                                </p>
                                            </div>
                                            <button className="p-2 -mr-3 -mt-2 text-muted-foreground active:bg-muted rounded-xl transition-colors">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-end pb-4 border-b border-border/60">
                                            <span className="font-black text-3xl tracking-tight text-foreground">{rev.toLocaleString('fr-FR')} <span className="text-xl text-muted-foreground font-bold">€</span></span>
                                            <div className="mb-1">{getStatusBadge(project.status || '')}</div>
                                        </div>

                                        {/* Visual Margin Indicator */}
                                        <div className="flex flex-col gap-2 mt-1">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-semibold text-muted-foreground">
                                                    Marge estimée
                                                </span>
                                                <span className={`font-bold flex items-center gap-1.5 ${isMarginGood ? 'text-success' : 'text-destructive'}`}>
                                                    {marginPercent}%
                                                    {isMarginGood ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                </span>
                                            </div>
                                            <Progress
                                                value={Math.max(0, Math.min(100, marginPercent))}
                                                className="h-2.5 bg-muted"
                                                indicatorClassName={isMarginGood ? "bg-success" : "bg-destructive"}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
