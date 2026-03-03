"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FolderKanban, CircleDollarSign, Users, AlignLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { getCurrentOrgId } from "@/app/actions/org";
import { toast } from "sonner";

export default function NewProjectPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);

    // Form states
    const [title, setTitle] = useState("");
    const [clientId, setClientId] = useState("");
    const [budget, setBudget] = useState("");
    const [description, setDescription] = useState("");

    // Load clients for the select dropdown
    useEffect(() => {
        async function loadClients() {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const orgId = await getCurrentOrgId();

            if (orgId) {
                const { data } = await supabase
                    .from('clients')
                    .select('id, name')
                    .eq('organization_id', orgId)
                    .order('name');
                if (data) setClients(data);
            }
        }
        loadClients();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Le nom du projet est obligatoire");
            return;
        }

        setIsLoading(true);

        try {
            const supabase = createClient();

            // Get current user session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Non authentifié");

            const orgId = await getCurrentOrgId();
            if (!orgId) throw new Error("Organisation introuvable");

            const payload: any = {
                organization_id: orgId,
                title: title.trim(),
                description: description.trim() || null,
                client_id: clientId || null,
                budget: budget ? parseFloat(budget) : null,
                status: 'DEVIS'
            };

            const { error: insertError } = await supabase
                .from('projects')
                // @ts-expect-error Supabase strict typing
                .insert([payload]);

            if (insertError) throw insertError;

            toast.success("Projet créé avec succès");
            router.push("/projects");
            router.refresh();

        } catch (error: any) {
            console.error("Error creating project:", error);
            toast.error(error.message || "Erreur lors de la création du projet");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 flex flex-col gap-6 pb-28 min-h-screen bg-background">
            <header className="flex items-center gap-3 mt-2">
                <Link href="/projects">
                    <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 shrink-0 hover:bg-muted text-muted-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Nouveau Projet</h1>
                    <p className="text-xs text-muted-foreground">Créer un chantier ou mission</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5 flex flex-col gap-4">

                        <div className="space-y-1.5">
                            <Label htmlFor="title" className="text-[13px] font-bold text-foreground">Nom du Projet *</Label>
                            <div className="relative">
                                <FolderKanban className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="title"
                                    placeholder="Ex: Rénovation Salle de Bain"
                                    className="pl-10 h-11 bg-secondary/50 border-border"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="client" className="text-[13px] font-bold text-foreground">Client Associé</Label>
                            <div className="relative">
                                <Users className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground z-10" />
                                <select
                                    id="client"
                                    className="flex h-11 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 appearance-none"
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    disabled={isLoading || clients.length === 0}
                                >
                                    <option value="">Sélectionner un client...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            {clients.length === 0 && (
                                <p className="text-[11px] text-muted-foreground">Aucun client trouvé. <Link href="/clients/new" className="text-primary underline">Créez-en un d'abord</Link>.</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="text-[13px] font-bold text-foreground">Description / Détails</Label>
                            <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <Textarea
                                    id="description"
                                    placeholder="Ex: Refaire les peintures, changer le lavabo..."
                                    className="pl-10 min-h-[100px] bg-secondary/50 border-border resize-y"
                                    value={description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="budget" className="text-[13px] font-bold text-foreground">Budget Estimé (€ HT)</Label>
                            <div className="relative">
                                <CircleDollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="budget"
                                    type="number"
                                    placeholder="Ex: 5000"
                                    className="pl-10 h-11 bg-secondary/50 border-border"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">Pour estimer votre marge avec les factures d'achat.</p>
                        </div>

                    </CardContent>
                </Card>

                <div className="pt-4">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full h-12 font-bold text-[15px] shadow-sm"
                        disabled={isLoading}
                    >
                        {isLoading ? "Création en cours..." : "Créer le projet"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
