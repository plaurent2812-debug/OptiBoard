import { logger, task } from "@trigger.dev/sdk/v3";
import OpenAI, { toFile } from "openai";
import { createClient } from "@supabase/supabase-js";

// Clients will be initialized inside the task run function
type VoiceMemoPayload = {
    captureId: string;
    storageUrl: string;
    organizationId: string;
};

export const processVoiceMemoTask = task({
    id: "process-voice-memo",
    retry: {
        maxAttempts: 3,
        minTimeoutInMs: 1000,
        maxTimeoutInMs: 10000,
        factor: 2,
        randomize: true,
    },
    run: async (payload: VoiceMemoPayload) => {
        logger.info("Processing voice memo with Whisper AI", { payload });

        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            // 1. Fetch the audio file from the storage URL
            const response = await fetch(payload.storageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio file from storage: ${response.statusText}`);
            }

            // Convert the downloaded stream directly to an OpenAI File avoiding OOM
            const audioFile = await toFile(response, 'audio.m4a', { type: 'audio/m4a' });

            // 2. Transcribe with Whisper
            const transcription = await openai.audio.transcriptions.create({
                file: audioFile,
                model: "whisper-1",
                language: "fr"
            });

            const transcribedText = transcription.text;
            logger.info("Whisper Transcription", { transcribedText });

            // 3. Summarize / Extract actionable intel using GPT
            const summaryResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "Tu es un assistant récapitulant les dictées vocales d'un chef de chantier. Fais un résumé ultra-concis (1-2 phrases) de l'action à mener ou de la note prise."
                    },
                    {
                        role: "user",
                        content: transcribedText
                    }
                ]
            });

            const summaryText = summaryResponse.choices[0]?.message?.content || transcribedText;
            logger.info("AI Summary generated", { summaryText });

            // 4. Update the Capture status and attach the transcript/summary
            const { error: captureError } = await supabase
                .from("captures")
                .update({
                    processed: true,
                    summary: summaryText
                })
                .eq("id", payload.captureId);

            if (captureError) {
                logger.error("Error updating capture status", { captureError });
                throw captureError;
            }

            return { success: true, transcribedText, summary: summaryText };

        } catch (error) {
            logger.error("Failed to process voice memo", { error: error instanceof Error ? error.message : "Unknown error" });
            throw error;
        }
    }
});
