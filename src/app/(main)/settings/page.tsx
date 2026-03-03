import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, CreditCard, FileText, Save } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

async function saveSettings(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    const payload: any = {
        organization_id: orgId,
        siret: formData.get("siret") || null,
        tva_number: formData.get("tva_number") || null,
        legal_form: formData.get("legal_form") || null,
        address: formData.get("address") || null,
        city: formData.get("city") || null,
        postal_code: formData.get("postal_code") || null,
        phone: formData.get("phone") || null,
        email: formData.get("email") || null,
        website: formData.get("website") || null,
        bank_iban: formData.get("bank_iban") || null,
        bank_bic: formData.get("bank_bic") || null,
        default_tva_rate: parseFloat(formData.get("default_tva_rate") as string) || 20,
        quote_prefix: formData.get("quote_prefix") || "D",
        invoice_prefix: formData.get("invoice_prefix") || "F",
        quote_validity_days: parseInt(formData.get("quote_validity_days") as string) || 30,
        payment_terms_days: parseInt(formData.get("payment_terms_days") as string) || 30,
        monthly_revenue_target: parseFloat(formData.get("monthly_revenue_target") as string) || 0,
    };

    await (supabase.from("organization_settings") as any)
        .upsert(payload, { onConflict: "organization_id" });

    // Update org name
    const orgName = formData.get("org_name");
    if (orgName) {
        await supabase
            .from("organizations")
            // @ts-expect-error Supabase typing
            .update({ name: orgName })
            .eq("id", orgId);
    }

    redirect("/settings?saved=1");
}

export default async function SettingsPage() {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .single() as any;

    const { data: settings } = await (supabase
        .from("organization_settings") as any)
        .select("*")
        .eq("organization_id", orgId)
        .single();

    const s = settings || {};

    return (
        <div className="p-4 flex flex-col gap-5 pb-28 min-h-screen">
            <div className="mt-2">
                <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground text-sm font-medium">Configurez votre espace OptiBoard</p>
            </div>

            <form action={saveSettings} className="flex flex-col gap-5">
                {/* Company Identity */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" /> Identité de l&apos;entreprise
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="org_name" className="text-xs font-semibold">Nom de l&apos;entreprise</Label>
                            <Input id="org_name" name="org_name" defaultValue={org?.name || ""} className="h-11 bg-muted/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="siret" className="text-xs font-semibold">N° SIRET</Label>
                                <Input id="siret" name="siret" defaultValue={s.siret || ""} className="h-11 bg-muted/50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="tva_number" className="text-xs font-semibold">TVA Intra.</Label>
                                <Input id="tva_number" name="tva_number" defaultValue={s.tva_number || ""} className="h-11 bg-muted/50" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="legal_form" className="text-xs font-semibold">Forme juridique</Label>
                            <Input id="legal_form" name="legal_form" placeholder="Auto-entrepreneur, SARL..." defaultValue={s.legal_form || ""} className="h-11 bg-muted/50" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="address" className="text-xs font-semibold">Adresse</Label>
                            <Input id="address" name="address" defaultValue={s.address || ""} className="h-11 bg-muted/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="postal_code" className="text-xs font-semibold">Code Postal</Label>
                                <Input id="postal_code" name="postal_code" defaultValue={s.postal_code || ""} className="h-11 bg-muted/50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="city" className="text-xs font-semibold">Ville</Label>
                                <Input id="city" name="city" defaultValue={s.city || ""} className="h-11 bg-muted/50" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-xs font-semibold">Téléphone</Label>
                                <Input id="phone" name="phone" defaultValue={s.phone || ""} className="h-11 bg-muted/50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={s.email || ""} className="h-11 bg-muted/50" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="website" className="text-xs font-semibold">Site web</Label>
                            <Input id="website" name="website" defaultValue={s.website || ""} className="h-11 bg-muted/50" />
                        </div>
                    </CardContent>
                </Card>

                {/* Banking */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary" /> Coordonnées bancaires
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="bank_iban" className="text-xs font-semibold">IBAN</Label>
                            <Input id="bank_iban" name="bank_iban" defaultValue={s.bank_iban || ""} className="h-11 bg-muted/50 font-mono text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="bank_bic" className="text-xs font-semibold">BIC / SWIFT</Label>
                            <Input id="bank_bic" name="bank_bic" defaultValue={s.bank_bic || ""} className="h-11 bg-muted/50 font-mono" />
                        </div>
                    </CardContent>
                </Card>

                {/* Preferences */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" /> Préférences de facturation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="default_tva_rate" className="text-xs font-semibold">TVA par défaut (%)</Label>
                                <Input id="default_tva_rate" name="default_tva_rate" type="number" step="0.1" defaultValue={s.default_tva_rate || 20} className="h-11 bg-muted/50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="monthly_revenue_target" className="text-xs font-semibold">Objectif CA mensuel (€)</Label>
                                <Input id="monthly_revenue_target" name="monthly_revenue_target" type="number" defaultValue={s.monthly_revenue_target || 0} className="h-11 bg-muted/50" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="quote_prefix" className="text-xs font-semibold">Préfixe Devis</Label>
                                <Input id="quote_prefix" name="quote_prefix" defaultValue={s.quote_prefix || "D"} className="h-11 bg-muted/50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="invoice_prefix" className="text-xs font-semibold">Préfixe Factures</Label>
                                <Input id="invoice_prefix" name="invoice_prefix" defaultValue={s.invoice_prefix || "F"} className="h-11 bg-muted/50" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="quote_validity_days" className="text-xs font-semibold">Validité devis (jours)</Label>
                                <Input id="quote_validity_days" name="quote_validity_days" type="number" defaultValue={s.quote_validity_days || 30} className="h-11 bg-muted/50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="payment_terms_days" className="text-xs font-semibold">Délai de paiement (jours)</Label>
                                <Input id="payment_terms_days" name="payment_terms_days" type="number" defaultValue={s.payment_terms_days || 30} className="h-11 bg-muted/50" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <button
                    type="submit"
                    className="w-full h-14 text-base font-bold shadow-md rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
                >
                    <Save className="w-5 h-5" />
                    Enregistrer les modifications
                </button>
            </form>
        </div>
    );
}
