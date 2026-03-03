"use server";

import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";
import { revalidatePath } from "next/cache";

/**
 * Save or update project notes.
 */
export async function saveProjectNotes(projectId: string, notes: string) {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    const { error } = await supabase
        .from("projects")
        // @ts-expect-error Supabase typing for new columns
        .update({ notes })
        .eq("id", projectId)
        .eq("organization_id", orgId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

/**
 * Update project dates (start_date, end_date) for calendar planning.
 */
export async function updateProjectDates(
    projectId: string,
    startDate: string | null,
    endDate: string | null
) {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    const { error } = await supabase
        .from("projects")
        // @ts-expect-error Supabase typing for new columns
        .update({
            start_date: startDate || null,
            end_date: endDate || null,
        })
        .eq("id", projectId)
        .eq("organization_id", orgId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/planning");
    return { success: true };
}
