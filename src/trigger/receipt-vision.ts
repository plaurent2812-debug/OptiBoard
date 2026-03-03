import { logger, task } from "@trigger.dev/sdk/v3";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

// Clients will be initialized inside the task run function
type ReceiptPayload = {
    captureId: string;
    storageUrl: string;
    organizationId: string;
    projectId?: string;
};

export const processReceiptTask = task({
    id: "process-receipt",
    retry: {
        maxAttempts: 3,
        minTimeoutInMs: 1000,
        maxTimeoutInMs: 10000,
        factor: 2,
        randomize: true,
    },
    run: async (payload: ReceiptPayload) => {
        logger.info("Processing receipt with Vision AI", { payload });

        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Define expected structure
            const ReceiptSchema = z.object({
                amount_ht: z.number().describe("Montant HT du reçu ou 0 si introuvable"),
                provider_name: z.string().describe("Nom du fournisseur"),
                document_type: z.enum(['ACHAT', 'FACTURE', 'DEVIS'])
            });

            // 1. Send image to OpenAI Vision
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini", // Optimized for speed and cost
                messages: [
                    {
                        role: "system",
                        content: "Tu es l'assistant financier d'un artisan. Ton but est d'extraire des données de reçus et factures au format JSON."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analyse cette image et extrais les informations dans la structure demandée."
                            },
                            { type: "image_url", image_url: { url: payload.storageUrl } }
                        ]
                    }
                ],
                response_format: zodResponseFormat(ReceiptSchema, "receipt_extraction")
            });

            const jsonContent = response.choices[0]?.message?.content || "{}";
            const result = JSON.parse(jsonContent);

            logger.info("OpenAI Extraction Result", { result });

            // 2. Insert as a Document in Supabase
            const { data: docData, error: docError } = await supabase
                .from("documents")
                .insert({
                    organization_id: payload.organizationId,
                    project_id: payload.projectId || null, // Might be null if it's a general expense
                    type: result.document_type || "ACHAT",
                    url: payload.storageUrl,
                    status: "VALIDE",
                    amount_ht: result.amount_ht || 0
                })
                .select()
                .single();

            if (docError) {
                logger.error("Error inserting document", { docError });
                throw docError;
            }

            // 3. Update the Capture status to processed
            const { error: captureError } = await supabase
                .from("captures")
                .update({ processed: true })
                .eq("id", payload.captureId);

            if (captureError) {
                logger.error("Error updating capture status", { captureError });
                throw captureError;
            }

            return { success: true, document: docData };

        } catch (error) {
            logger.error("Failed to process receipt", { error: error instanceof Error ? error.message : "Unknown error" });
            throw error;
        }
    }
});
