import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are set for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project-id.supabase.co";
// Using the service role key to bypass RLS when updating from a webhook
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

// Initialize Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export async function POST(request: Request) {
    try {
        // Strict authorization check
        const authHeader = request.headers.get("authorization");
        const webhookSecret = process.env.TRIGGER_WEBHOOK_SECRET;

        // Fails-Closed: if no secret exists in env OR mismatch, deny access.
        if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { document_id, status, amount_ht, processed } = body;

        if (!document_id) {
            return NextResponse.json({ error: "Missing document_id" }, { status: 400 });
        }

        // Prepare update payload
        const payload: { status?: string; amount_ht?: number } = {};
        if (status !== undefined) payload.status = status;
        if (amount_ht !== undefined) payload.amount_ht = amount_ht;

        // Update the document in Supabase
        const { data: document, error: docError } = await supabaseAdmin
            .from('documents')
            .update(payload)
            .eq('id', document_id)
            .select()
            .single();

        if (docError) {
            console.error("Supabase update error:", docError);
            return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
        }

        // If there is an associated capture to mark as processed
        if (processed !== undefined && body.capture_id) {
            const { error: captureError } = await supabaseAdmin
                .from('captures')
                .update({ processed })
                .eq('id', body.capture_id);

            if (captureError) {
                console.error("Failed to update capture:", captureError);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Document updated successfully via webhook.",
            data: document
        });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
