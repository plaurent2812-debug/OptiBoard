"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function startImpersonation(formData: FormData) {
    const orgId = formData.get("orgId") as string;
    const orgName = formData.get("orgName") as string;

    if (!orgId || !orgName) return;

    // Verify user is super admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if ((profile as any)?.role !== "SUPER_ADMIN") {
        return; // Unauthorized
    }

    // Set impersonation cookies
    const cookieStore = await cookies();
    cookieStore.set("impersonation_org_id", orgId, { path: "/", maxAge: 60 * 60 * 8 }); // 8 hours
    cookieStore.set("impersonation_org_name", orgName, { path: "/", maxAge: 60 * 60 * 8 });

    redirect("/dashboard");
}

export async function stopImpersonation() {
    const cookieStore = await cookies();
    cookieStore.delete("impersonation_org_id");
    cookieStore.delete("impersonation_org_name");

    redirect("/admin");
}
