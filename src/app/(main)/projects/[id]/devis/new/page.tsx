"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, Plus, FileSignature } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { getCurrentOrgId } from "@/app/actions/org";
import { toast } from "sonner";

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    price: number;
}

export default function NewQuotePage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const projectId = params.id;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Initial Line Item
    const [items, setItems] = useState<LineItem[]>([
        { id: Math.random().toString(), description: "Main d'œuvre", quantity: 1, price: 1500 }
    ]);

    const addItem = () => {
        setItems([
            ...items,
            { id: Math.random().toString(), description: "", quantity: 1, price: 0 }
        ]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof LineItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const totalHT = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tvaRate = 20; // Will be configurable from org settings later
    const totalTVA = totalHT * (tvaRate / 100);
    const totalTTC = totalHT + totalTVA;

    const handleSubmit = async () => {
        if (items.some(i => !i.description.trim())) {
            toast.error("Veuillez remplir toutes les descriptions des lignes.");
            return;
        }

        if (totalHT <= 0) {
            toast.error("Le devis doit avoir un montant supérieur à 0.");
            return;
        }

        setIsLoading(true);

        try {
            const supabase = createClient();

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Non authentifié");

            const orgId = await getCurrentOrgId();
            if (!orgId) throw new Error("Organisation introuvable");

            // 1. Create the document record
            const docPayload: any = {
                organization_id: orgId,
                project_id: projectId,
                type: 'DEVIS',
                status: 'EN_ATTENTE',
                amount_ht: totalHT,
                tva_rate: tvaRate,
                amount_ttc: totalTTC,
                url: '', // No longer used for line items
            };

            const { data: newDoc, error: insertError } = await supabase
                .from('documents')
                // @ts-expect-error Supabase typing
                .insert([docPayload])
                .select('id')
                .single() as any;

            if (insertError) throw insertError;

            // 2. Insert line items into document_items
            const lineItems = items.map((item, index) => ({
                document_id: newDoc.id,
                description: item.description,
                quantity: item.quantity,
                unit_price_ht: item.price,
                tva_rate: tvaRate,
                sort_order: index,
            }));

            const { error: itemsError } = await (supabase
                .from('document_items') as any)
                .insert(lineItems);

            if (itemsError) throw itemsError;

            // 3. Update the project status and total
            const updatePayload: any = { status: 'DEVIS', total_ht: totalHT };
            await supabase
                .from('projects')
                // @ts-expect-error Supabase typing
                .update(updatePayload)
                .eq('id', projectId);

            toast.success("Devis généré avec succès !");
            router.push(`/projects/${projectId}`);
            router.refresh();

        } catch (error: any) {
            console.error("Error creating devis:", error);
            toast.error("Erreur lors de la génération du devis");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 flex flex-col gap-6 pb-28 min-h-screen bg-background">
            <header className="flex items-center gap-3 mt-2">
                <Link href={`/projects/${projectId}`}>
                    <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 shrink-0 hover:bg-muted text-muted-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-primary">Nouveau Devis</h1>
                    <p className="text-xs text-muted-foreground">Ajoutez vos prestations</p>
                </div>
            </header>

            <div className="flex flex-col gap-4">
                {items.map((item, index) => (
                    <Card key={item.id} className="border-border shadow-sm overflow-hidden">
                        <div className="bg-secondary/40 px-4 py-2 flex justify-between items-center border-b border-border/50">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ligne {index + 1}</span>
                            {items.length > 1 && (
                                <button onClick={() => removeItem(item.id)} className="text-destructive/80 hover:text-destructive p-1 rounded-md transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <CardContent className="p-4 flex flex-col gap-3">
                            <div>
                                <Input
                                    placeholder="Description de la prestation..."
                                    className="bg-background border-border"
                                    value={item.description}
                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase ml-1 block mb-1">Qté</span>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="1"
                                        className="bg-background border-border"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase ml-1 block mb-1">Prix U. HT</span>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="bg-background border-border pl-6"
                                            value={item.price}
                                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                            disabled={isLoading}
                                        />
                                        <span className="absolute left-2.5 top-[10px] text-muted-foreground text-sm font-medium">€</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right mt-1">
                                <span className="text-sm font-bold text-foreground">{(item.quantity * item.price).toLocaleString('fr-FR')} €</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Button
                    variant="outline"
                    className="border-dashed border-2 h-12 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    onClick={addItem}
                    disabled={isLoading}
                >
                    <Plus className="w-4 h-4 mr-2" /> Ajouter une ligne
                </Button>

                {/* Total Area */}
                <Card className="mt-4 border-border shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-0">
                        <div className="p-4 flex justify-between items-center border-b border-border/50">
                            <span className="text-sm font-semibold text-muted-foreground">Total HT</span>
                            <span className="font-bold text-lg">{totalHT.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div className="p-4 flex justify-between items-center border-b border-border/50 bg-muted/30">
                            <span className="text-sm font-semibold text-muted-foreground">TVA ({tvaRate}%)</span>
                            <span className="font-bold text-lg">{totalTVA.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                        </div>
                        <div className="p-5 flex justify-between items-center bg-primary text-primary-foreground">
                            <span className="font-semibold">Total TTC</span>
                            <span className="font-black text-3xl tracking-tight">{totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="pt-4">
                <Button
                    onClick={handleSubmit}
                    size="lg"
                    className="w-full h-12 font-bold text-[15px] shadow-sm gap-2"
                    disabled={isLoading || totalHT <= 0}
                >
                    <FileSignature className="w-5 h-5" />
                    {isLoading ? "Enregistrement..." : "Finaliser le Devis"}
                </Button>
            </div>
        </div>
    );
}
