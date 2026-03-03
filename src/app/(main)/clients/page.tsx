import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, ChevronRight, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', orgId)
        .order('name', { ascending: true });

    if (error) {
        console.error(error);
    }

    const clientsList = clients as any[] || [];

    return (
        <div className="p-4 flex flex-col gap-6 pb-28 min-h-screen bg-background">
            {/* Header */}
            <div className="flex justify-between items-center mt-2">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary">Clients</h1>
                    <p className="text-muted-foreground font-medium mt-1">Gérez votre base client</p>
                </div>
                <Link href="/clients/new">
                    <Button size="icon" className="w-12 h-12 rounded-full shadow-sm">
                        <Plus className="w-6 h-6" />
                    </Button>
                </Link>
            </div>

            {/* Client List */}
            <div className="flex flex-col gap-3 mt-2">
                {clientsList.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-secondary/30 mt-4">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="font-medium text-foreground">Aucun client trouvé.</p>
                        <p className="text-sm mt-1">Commencez par ajouter votre premier client.</p>
                    </div>
                ) : (
                    clientsList.map((client) => (
                        <Link href={`/clients/${client.id}`} key={client.id}>
                            <Card className="overflow-hidden border-border bg-card shadow-sm rounded-2xl hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                                <CardContent className="p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[17px] leading-tight text-foreground">{client.name}</h3>
                                                {client.email && (
                                                    <p className="text-[13px] text-muted-foreground flex items-center gap-1 mt-1">
                                                        <Mail className="w-3.5 h-3.5" /> {client.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-50" />
                                    </div>

                                    {(client.phone || client.address) && (
                                        <div className="flex gap-4 pt-3 border-t border-border/60">
                                            {client.phone && (
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                                    <Phone className="w-3.5 h-3.5 text-primary" /> {client.phone}
                                                </div>
                                            )}
                                            {client.address && (
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground truncate max-w-[150px]">
                                                    <MapPin className="w-3.5 h-3.5 text-primary" /> <span className="truncate">{client.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
