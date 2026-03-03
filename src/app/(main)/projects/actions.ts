"use server";

import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteProject(projectId: string) {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('organization_id', orgId);

    if (error) {
        throw new Error("Erreur de suppression: " + error.message);
    }

    revalidatePath("/projects");
    redirect("/projects");
}

export async function archiveProject(projectId: string) {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    const { error } = await supabase
        .from('projects')
        // @ts-expect-error Supabase typing
        .update({ status: 'ARCHIVE' })
        .eq('id', projectId)
        .eq('organization_id', orgId);

    if (error) {
        throw new Error("Erreur lors de l'archivage: " + error.message);
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
}
