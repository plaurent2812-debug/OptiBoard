"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus, FileText, MapPin, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { getCurrentOrgId } from "@/app/actions/org";
import { toast } from "sonner";

export default function NewClientPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [notes, setNotes] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Le nom du client est obligatoire");
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
                name: name.trim(),
                email: email.trim() || null,
                phone: phone.trim() || null,
                address: address.trim() || null
            };

            const { error: insertError } = await supabase
                .from('clients')
                // @ts-expect-error Supabase strict typing
                .insert([payload]);

            if (insertError) throw insertError;

            toast.success("Client créé avec succès");
            router.push("/clients");
            router.refresh();

        } catch (error: any) {
            console.error("Error creating client:", error);
            toast.error(error.message || "Erreur lors de la création du client");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 flex flex-col gap-6 pb-28 min-h-screen bg-background">
            <header className="flex items-center gap-3 mt-2">
                <Link href="/clients">
                    <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 shrink-0 hover:bg-muted text-muted-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Nouveau Client</h1>
                    <p className="text-xs text-muted-foreground">Ajouter une fiche d'information</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5 flex flex-col gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-[13px] font-bold text-foreground">Nom / Entreprise *</Label>
                            <div className="relative">
                                <UserPlus className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="name"
                                    placeholder="Ex: Jean Dupont ou SARL Exemple"
                                    className="pl-10 h-11 bg-secondary/50 border-border"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-[13px] font-bold text-foreground">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="jean.dupont@email.com"
                                    className="pl-10 h-11 bg-secondary/50 border-border"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-[13px] font-bold text-foreground">Téléphone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="06 12 34 56 78"
                                    className="pl-10 h-11 bg-secondary/50 border-border"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="address" className="text-[13px] font-bold text-foreground">Adresse Postale</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <textarea
                                    id="address"
                                    placeholder="12 rue des Fleurs\n75001 Paris"
                                    className="flex w-full rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 min-h-[80px] bg-secondary/50 border-border resize-none border"
                                    value={address}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAddress(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Optional notes local only for now unless we add it to the schema */}
                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-[13px] font-bold text-foreground">Notes internes</Label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <textarea
                                    id="notes"
                                    placeholder="Client exigeant, préfère être appelé le matin..."
                                    className="flex w-full rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 min-h-[80px] bg-secondary/50 border-border resize-none border"
                                    value={notes}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">Les notes internes ne sont pas visibles par le client.</p>
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
                        {isLoading ? "Création en cours..." : "Créer le client"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
