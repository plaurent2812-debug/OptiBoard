import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";

export async function GET() {
    try {
        const supabase = await createClient();
        const orgId = await getEffectiveOrgId();

        if (!orgId) {
            return new NextResponse("Unauthorized: No Organization ID", { status: 401 });
        }

        // Fetch all ACHAT documents for this ORG
        const { data: achats, error } = await supabase
            .from("documents")
            .select(`
                id,
                created_at,
                amount_ht,
                amount_ttc,
                tax_amount,
                status,
                supplier:supplier_id(name),
                project:project_id(title)
            `)
            .eq("organization_id", orgId)
            .eq("type", "ACHAT")
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        // Create CSV Header
        const csvRows = [
            ["ID", "Date", "Fournisseur", "Projet", "Montant HT", "TVA", "Montant TTC", "Statut"].join(",")
        ];

        // Format Rows
        (achats as any[])?.forEach((achat) => {
            const date = new Date(achat.created_at).toLocaleDateString('fr-FR');
            const supplier = typeof achat.supplier === 'object' && achat.supplier ? (achat.supplier as { name: string }).name || 'Inconnu' : 'Inconnu';
            const project = typeof achat.project === 'object' && achat.project ? (achat.project as { title: string }).title || 'Général' : 'Général';
            const status = achat.status || 'En attente';

            // Format numbers safely and replace dots with commas for French Excel compatibility
            const ht = (achat.amount_ht || 0).toString().replace('.', ',');
            const tax = (achat.tax_amount || 0).toString().replace('.', ',');
            const ttc = (achat.amount_ttc || 0).toString().replace('.', ',');

            // Escape strings that might have commas to avoid breaking CSV format
            const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

            csvRows.push([
                achat.id,
                date,
                escapeCsv(supplier),
                escapeCsv(project),
                ht,
                tax,
                ttc,
                escapeCsv(status)
            ].join(","));
        });

        // Generate final CSV string
        const csvString = csvRows.join("\n");

        // Return as downloadable file
        return new NextResponse(csvString, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="export_comptable_optiboard_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error: unknown) {
        console.error("CSV Export Error:", error);
        return new NextResponse("Failed to generate export", { status: 500 });
    }
}
