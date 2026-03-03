import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";
import OpenAI from "openai";

/**
 * AI Devis Express — Takes a text description and generates structured quote line items.
 * POST /api/ai-devis
 * Body: { description: string }
 * Returns: { items: Array<{ description: string, quantity: number, unit_price_ht: number }> }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const orgId = await getEffectiveOrgId();
        if (!orgId) {
            return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });
        }

        const body = await request.json();
        const { description } = body;

        if (!description || !description.trim()) {
            return NextResponse.json({ error: "Description requise" }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // Fetch org settings for default TVA rate
        const { data: settings } = await (supabase
            .from("organization_settings") as any)
            .select("default_tva_rate")
            .eq("organization_id", orgId)
            .single();

        const defaultTva = settings?.default_tva_rate || 20;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Tu es un assistant spécialisé en devis pour artisans du bâtiment en France.
À partir d'une description de travaux, génère une liste de lignes de devis structurées.
Chaque ligne doit avoir :
- description : description claire de la prestation
- quantity : nombre d'unités (entier ou décimal)
- unit_price_ht : prix unitaire HT en euros (réaliste pour le marché français)

Réponds uniquement en JSON valide avec la structure : { "items": [...] }
Sois précis et réaliste dans les prix. Inclus les matériaux ET la main d'œuvre séparément quand c'est pertinent.`
                },
                {
                    role: "user",
                    content: description
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            return NextResponse.json({ error: "Pas de réponse de l'IA" }, { status: 500 });
        }

        const parsed = JSON.parse(content);
        const items = (parsed.items || []).map((item: any) => ({
            description: item.description || "",
            quantity: item.quantity || 1,
            unit_price_ht: item.unit_price_ht || 0,
            tva_rate: defaultTva,
        }));

        return NextResponse.json({ items, tva_rate: defaultTva });
    } catch (error: any) {
        console.error("AI Devis error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la génération IA: " + (error.message || "Inconnue") },
            { status: 500 }
        );
    }
}
