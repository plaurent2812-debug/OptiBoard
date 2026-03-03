import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { createProjectAudioTask } from "@/trigger/create-project";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if TRIGGER_SECRET_KEY is properly configured
        const triggerKey = process.env.TRIGGER_SECRET_KEY;
        if (!triggerKey || triggerKey.includes("placeholder")) {
            console.error("TRIGGER_SECRET_KEY is not configured or is still a placeholder value");
            return NextResponse.json(
                { error: "Trigger.dev is not configured. Please set TRIGGER_SECRET_KEY in your environment variables." },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { storageUrl, type, organizationId, projectId, intent } = body;

        if (!storageUrl || !type || !organizationId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Project Creation intent (Audio)
        if (intent === "PROJECT" && type === "AUDIO") {
            const handle = await tasks.trigger<typeof createProjectAudioTask>("create-project-audio", {
                storageUrl,
                organizationId
            });
            return NextResponse.json({ success: true, triggerId: handle.id });
        }

        // 2. Receipt Processing (Image)
        if (type === "IMAGE") {
            const handle = await tasks.trigger("receipt-vision", {
                storageUrl,
                organizationId,
                projectId
            });
            return NextResponse.json({ success: true, triggerId: handle.id });
        }

        // 3. Voice Memo Processing (Audio)
        else if (type === "AUDIO") {
            const handle = await tasks.trigger("voice-memo", {
                storageUrl,
                organizationId,
                projectId
            });
            return NextResponse.json({ success: true, triggerId: handle.id });
        }

        return NextResponse.json({ error: "Unsupported capture type or intent" }, { status: 400 });

    } catch (error: unknown) {
        const err = error as Error;
        console.error("Trigger capture error:", err.message, err.stack);
        return NextResponse.json(
            { error: `Trigger.dev error: ${err.message}` },
            { status: 500 }
        );
    }
}

