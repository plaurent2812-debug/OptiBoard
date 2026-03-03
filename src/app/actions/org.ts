"use server";

import { getEffectiveOrgId } from "@/utils/auth";

export async function getCurrentOrgId() {
    return await getEffectiveOrgId();
}
