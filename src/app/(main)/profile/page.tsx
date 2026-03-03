import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Save, ArrowLeft, Settings } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

async function saveProfile(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from("profiles")
        // @ts-expect-error Supabase typing for new columns
        .update({
            first_name: formData.get("first_name") || null,
            last_name: formData.get("last_name") || null,
            phone: formData.get("phone") || null,
        })
        .eq("id", user.id);

    redirect("/profile?saved=1");
}

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, role")
        .eq("id", user.id)
        .single() as any;

    const p = profile || {};

    return (
        <div className="p-4 flex flex-col gap-5 pb-28 min-h-screen">
            <div className="flex items-center gap-3 mt-2">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 shrink-0 hover:bg-muted">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mon Profil</h1>
                    <p className="text-muted-foreground text-sm font-medium">{user.email}</p>
                </div>
            </div>

            {/* Avatar */}
            <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20">
                    <span className="text-4xl font-bold">
                        {(p.first_name || user.email || "?").charAt(0).toUpperCase()}
                    </span>
                </div>
            </div>

            <form action={saveProfile} className="flex flex-col gap-5">
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <UserCircle className="w-4 h-4 text-primary" /> Informations personnelles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="first_name" className="text-xs font-semibold">Prénom</Label>
                                <Input id="first_name" name="first_name" defaultValue={p.first_name || ""} className="h-11 bg-muted/50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="last_name" className="text-xs font-semibold">Nom</Label>
                                <Input id="last_name" name="last_name" defaultValue={p.last_name || ""} className="h-11 bg-muted/50" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-xs font-semibold">Téléphone</Label>
                            <Input id="phone" name="phone" type="tel" defaultValue={p.phone || ""} className="h-11 bg-muted/50" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Email</Label>
                            <Input value={user.email || ""} disabled className="h-11 bg-muted/30 opacity-60" />
                        </div>
                    </CardContent>
                </Card>

                <button
                    type="submit"
                    className="w-full h-14 text-base font-bold shadow-md rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
                >
                    <Save className="w-5 h-5" />
                    Enregistrer
                </button>
            </form>

            <Link href="/settings">
                <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Paramètres de l&apos;entreprise</p>
                        <p className="text-xs text-muted-foreground">SIRET, TVA, logo, IBAN...</p>
                    </div>
                </div>
            </Link>

            <form action="/auth/signout" method="post" className="mt-2">
                <button
                    type="submit"
                    className="w-full h-12 text-sm font-semibold rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
                >
                    Se déconnecter
                </button>
            </form>
        </div>
    );
}
