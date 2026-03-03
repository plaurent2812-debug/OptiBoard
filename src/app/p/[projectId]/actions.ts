"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function acceptQuote(projectId: string) {
    const supabase = await createClient();

    // In a real scenario, we might want to sign this securely or log the IP
    // For now, we update the project status to EN_COURS
    const payload: any = { status: 'EN_COURS' };
    const { error } = await supabase
        .from('projects')
        // @ts-expect-error Supabase typing
        .update(payload)
        .eq('id', projectId);

    if (error) {
        throw new Error(error.message);
    }

    // Also update the document status if we had a proper Devis row
    const docPayload: any = { status: 'ACCEPTE' };
    const { error: docError } = await supabase
        .from('documents')
        // @ts-expect-error Supabase typing
        .update(docPayload)
        .eq('project_id', projectId)
        .eq('type', 'DEVIS');

    if (docError) {
        console.error("Warning: could not update document status", docError);
    }

    revalidatePath(`/p/${projectId}`);
    return { success: true };
}

export async function declineQuote(projectId: string) {
    const supabase = await createClient();

    const declinePayload: any = { status: 'ARCHIVE' };
    const { error } = await supabase
        .from('projects')
        // @ts-expect-error Supabase typing
        .update(declinePayload)
        .eq('id', projectId);

    if (error) {
        throw new Error(error.message);
    }

    const declineDocPayload: any = { status: 'REFUSE' };
    const { error: docError } = await supabase
        .from('documents')
        // @ts-expect-error Supabase typing
        .update(declineDocPayload)
        .eq('project_id', projectId)
        .eq('type', 'DEVIS');

    if (docError) {
        console.error("Warning: could not update document status", docError);
    }

    revalidatePath(`/p/${projectId}`);
    return { success: true };
}
