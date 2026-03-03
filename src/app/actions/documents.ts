"use server";

import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";
import { revalidatePath } from "next/cache";

/**
 * Convert a Devis into a Facture by duplicating the document and its line items
 * with type = 'FACTURE'.
 */
export async function convertDevisToFacture(devisId: string, projectId: string) {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    // 1. Fetch the original devis
    const { data: devis, error: devisError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", devisId)
        .eq("organization_id", orgId)
        .single() as any;

    if (devisError || !devis) {
        return { error: "Devis introuvable." };
    }

    // 2. Create the facture document
    const facturePayload: any = {
        organization_id: orgId,
        project_id: projectId,
        type: "FACTURE",
        status: "EN_ATTENTE",
        amount_ht: devis.amount_ht,
        tva_rate: devis.tva_rate || 20,
        amount_ttc: devis.amount_ttc || devis.amount_ht * 1.2,
        url: "",
        notes: `Facture générée depuis le devis ${devisId.split("-")[0].toUpperCase()}`,
    };

    const { data: newFacture, error: factureError } = await supabase
        .from("documents")
        // @ts-expect-error Supabase typing
        .insert([facturePayload])
        .select("id")
        .single() as any;

    if (factureError || !newFacture) {
        return { error: "Erreur lors de la création de la facture: " + (factureError?.message || "Inconnue") };
    }

    // 3. Copy line items from devis to facture
    const { data: devisItems } = await (supabase
        .from("document_items") as any)
        .select("*")
        .eq("document_id", devisId)
        .order("sort_order", { ascending: true });

    if (devisItems && devisItems.length > 0) {
        const factureItems = devisItems.map((item: any) => ({
            document_id: newFacture.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price_ht: item.unit_price_ht,
            tva_rate: item.tva_rate,
            sort_order: item.sort_order,
        }));

        await (supabase.from("document_items") as any).insert(factureItems);
    }

    // 4. Update the project status to EN_COURS
    await supabase
        .from("projects")
        // @ts-expect-error Supabase typing
        .update({ status: "EN_COURS" })
        .eq("id", projectId);

    revalidatePath(`/projects/${projectId}`);
    return { success: true, factureId: newFacture.id };
}

/**
 * Mark a facture as paid.
 */
export async function markFactureAsPaid(documentId: string, projectId: string) {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    const { error } = await supabase
        .from("documents")
        // @ts-expect-error Supabase typing
        .update({
            status: "PAYEE",
            paid_at: new Date().toISOString(),
        })
        .eq("id", documentId)
        .eq("organization_id", orgId);

    if (error) {
        return { error: "Erreur lors de la mise à jour: " + error.message };
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/treso");
    revalidatePath("/dashboard");
    return { success: true };
}
