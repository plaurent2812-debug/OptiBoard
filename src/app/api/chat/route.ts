import { openai } from '@ai-sdk/openai';
import { streamText, tool, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { getEffectiveOrgId } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';

export const maxDuration = 60; // Allow enough time for tool calling

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Security: Identify the organization context
        const orgId = await getEffectiveOrgId();

        if (!orgId) {
            return new Response('Unauthorized', { status: 401 });
        }

        const supabase = await createClient();

        const result = await streamText({
            model: openai('gpt-4o'),
            messages: await convertToModelMessages(messages),
            system: `Tu es OptiPro, l'assistant intelligent et amical intégré à l'application Optiboard. 
Tu aides les artisans (plombiers, électriciens, peintres...) à gérer leur entreprise. 
Tu peux rechercher leurs projets, trouver leurs dépenses, et leur donner des résumés de leur trésorerie.
Sois concis, professionnel et utilise des termes clairs. Si tu ne trouves pas une donnée, dis-le honnêtement.
⚠️ Important : Formatte tes réponses avec des puces (tirets) ou des retours à la ligne pour être très lisible sur mobile. Ne fais jamais de longs paragraphes denses.`,
            tools: {
                get_projects: tool({
                    description: 'Obtenir la liste des projets (chantiers) de l\'artisan',
                    parameters: z.object({
                        status: z.enum(['DEVIS', 'EN_COURS', 'TERMINE', 'ARCHIVE']).optional().describe("Filtrer par statut (optionnel)"),
                    }),
                    execute: async ({ status }: { status?: string }) => {
                        let query = supabase.from('projects').select('id, title, status, budget, total_ht, created_at, clients(name)').eq('organization_id', orgId);
                        if (status) query = query.eq('status', status);
                        const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
                        if (error) return { error: error.message };
                        return data || [];
                    },
                } as any),
                get_dashboard_stats: tool({
                    description: 'Obtenir une synthèse générale de la trésorerie (combien facturé, combien dépensé) pour l\'artisan',
                    parameters: z.object({}),
                    execute: async () => {
                        const { data, error } = await supabase.from('organization_stats')
                            .select('total_chiffre_affaire_encaisse_ht, total_achats_materiel_ht')
                            .eq('organization_id', orgId)
                            .maybeSingle();

                        if (error) return { error: error.message };
                        if (!data) return { total_chiffre_affaire_encaisse_HT: 0, total_achats_materiel_HT: 0 };

                        const stats = data as any;
                        return {
                            total_chiffre_affaire_encaisse_HT: stats.total_chiffre_affaire_encaisse_ht,
                            total_achats_materiel_HT: stats.total_achats_materiel_ht
                        };
                    },
                } as any),
                search_expenses: tool({
                    description: 'Rechercher une dépense ou un achat',
                    parameters: z.object({
                        keyword: z.string().describe("Mot clé pour chercher la dépense"),
                    }),
                    execute: async ({ keyword }: { keyword: string }) => {
                        const { data, error } = await supabase.from('documents')
                            .select('id, amount_ht, created_at, url, status')
                            .eq('organization_id', orgId)
                            .eq('type', 'ACHAT')
                            .or(`url.ilike.%${keyword}%,status.ilike.%${keyword}%`)
                            .order('created_at', { ascending: false })
                            .limit(10);

                        if (error) return { error: error.message };
                        return data || [];
                    }
                } as any)
            },
            maxSteps: 5
        } as any);

        return (result as any).toDataStreamResponse();
    } catch (error) {
        console.error("Chat API error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
