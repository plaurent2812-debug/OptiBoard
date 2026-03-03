import { cookies } from "next/headers";
import { createClient } from "./supabase/server";

export async function getEffectiveOrgId() {
    // 1. Check if an impersonation cookie exists (only set by Super Admins)
    const cookieStore = await cookies();
    const impersonatedOrgId = cookieStore.get("impersonation_org_id")?.value;

    if (impersonatedOrgId) {
        return impersonatedOrgId;
    }

    // 2. Otherwise fetch the real user's profile
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (!profile) throw new Error("Profile not found");

    return (profile as any).organization_id;
}
