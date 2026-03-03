import { task, schedules } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Invoice Reminder Task
 * Runs daily and identifies unpaid invoices > 30 days.
 * Logs reminders into the activities table for the dashboard feed.
 */
export const invoiceReminderTask = task({
    id: "invoice-reminders",
    maxDuration: 60,
    run: async () => {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Find unpaid invoices older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: overdueInvoices, error } = await supabase
            .from("documents")
            .select(`
                id, 
                organization_id, 
                project_id, 
                amount_ht, 
                amount_ttc, 
                created_at,
                reference_number
            `)
            .eq("type", "FACTURE")
            .neq("status", "PAYEE")
            .lt("created_at", thirtyDaysAgo.toISOString());

        if (error) {
            console.error("Error fetching overdue invoices:", error);
            return { success: false, error: error.message };
        }

        if (!overdueInvoices || overdueInvoices.length === 0) {
            return { success: true, message: "No overdue invoices found", count: 0 };
        }

        // Create activity entries for each overdue invoice
        const activities = overdueInvoices.map((invoice: any) => ({
            organization_id: invoice.organization_id,
            type: "RELANCE",
            title: `Facture impayée depuis +30j`,
            description: `La facture ${invoice.reference_number || invoice.id.split("-")[0].toUpperCase()} de ${invoice.amount_ht}€ HT est en attente de paiement depuis plus de 30 jours.`,
            metadata: {
                document_id: invoice.id,
                project_id: invoice.project_id,
                amount_ht: invoice.amount_ht,
                days_overdue: Math.floor((Date.now() - new Date(invoice.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            },
        }));

        const { error: activityError } = await supabase
            .from("activities")
            .insert(activities);

        if (activityError) {
            console.error("Error creating reminder activities:", activityError);
            return { success: false, error: activityError.message };
        }

        return {
            success: true,
            message: `Created ${activities.length} invoice reminders`,
            count: activities.length,
        };
    },
});

/**
 * Weekly Summary Task
 * Generates a weekly activity summary for each organization.
 */
export const weeklySummaryTask = task({
    id: "weekly-summary",
    maxDuration: 120,
    run: async () => {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get all organizations
        const { data: orgs } = await supabase
            .from("organizations")
            .select("id, name");

        if (!orgs || orgs.length === 0) {
            return { success: true, message: "No organizations found" };
        }

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        for (const org of orgs) {
            // Count new projects this week
            const { count: newProjects } = await supabase
                .from("projects")
                .select("*", { count: "exact", head: true })
                .eq("organization_id", org.id)
                .gte("created_at", oneWeekAgo.toISOString());

            // Count new clients this week
            const { count: newClients } = await supabase
                .from("clients")
                .select("*", { count: "exact", head: true })
                .eq("organization_id", org.id)
                .gte("created_at", oneWeekAgo.toISOString());

            // Revenue collected this week
            const { data: paidInvoices } = await supabase
                .from("documents")
                .select("amount_ht")
                .eq("organization_id", org.id)
                .eq("type", "FACTURE")
                .eq("status", "PAYEE")
                .gte("paid_at", oneWeekAgo.toISOString()) as any;

            const weeklyRevenue = (paidInvoices || []).reduce(
                (sum: number, inv: any) => sum + (inv.amount_ht || 0),
                0
            );

            // Create weekly summary activity
            await supabase.from("activities").insert({
                organization_id: org.id,
                type: "RESUME_HEBDO",
                title: `Résumé de la semaine`,
                description: [
                    `📊 ${newProjects || 0} nouveau(x) projet(s)`,
                    `👤 ${newClients || 0} nouveau(x) client(s)`,
                    `💰 ${weeklyRevenue.toLocaleString("fr-FR")} € encaissés`,
                ].join(" • "),
                metadata: {
                    new_projects: newProjects || 0,
                    new_clients: newClients || 0,
                    weekly_revenue: weeklyRevenue,
                    period_start: oneWeekAgo.toISOString(),
                    period_end: new Date().toISOString(),
                },
            });
        }

        return { success: true, message: `Weekly summary generated for ${orgs.length} organizations` };
    },
});
