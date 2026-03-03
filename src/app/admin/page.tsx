import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, FolderKanban, LogOut } from "lucide-react";

export default async function AdminDashboard() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch all organizations
    const { data: organizations } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-primary">OptiPro Console</h1>
                        <p className="text-muted-foreground mt-1">Gérez l&apos;ensemble des artisans (Super Admin)</p>
                    </div>
                    <form action="/auth/signout" method="post">
                        <Button variant="outline" className="gap-2 border-border" size="sm">
                            <LogOut className="w-4 h-4" /> Déconnexion
                        </Button>
                    </form>
                </div>

                {/* Organizations List */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-primary" /> Organisations ({organizations?.length || 0})
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(organizations as any[])?.map((org) => (
                            <Card key={org.id} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-5 flex flex-col gap-4">
                                    <div>
                                        <h3 className="font-bold text-lg">{org.name}</h3>
                                        <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full ring-1 ring-primary/20">
                                                Plan: {org.subscription_plan}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Utilisateurs</span>
                                            <span className="font-semibold text-foreground mt-0.5">--</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-1"><FolderKanban className="w-3.5 h-3.5" /> Projets</span>
                                            <span className="font-semibold text-foreground mt-0.5">--</span>
                                        </div>
                                    </div>

                                    <form action={async (formData) => {
                                        "use server";
                                        const { startImpersonation } = await import("@/app/actions/impersonate");
                                        await startImpersonation(formData);
                                    }}>
                                        <input type="hidden" name="orgId" value={org.id} />
                                        <input type="hidden" name="orgName" value={org.name} />
                                        <Button type="submit" className="w-full font-bold shadow-sm" variant="default">
                                            Gérer en tant qu&apos;Artisan
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        ))}

                        {organizations?.length === 0 && (
                            <p className="text-muted-foreground py-8 text-center col-span-full bg-muted/20 rounded-xl border border-dashed border-border">
                                Aucune organisation trouvée.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
