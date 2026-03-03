"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save, StickyNote } from "lucide-react";
import { saveProjectNotes } from "@/app/actions/projects";
import { toast } from "sonner";

export function ProjectNotesEditor({ projectId, initialNotes }: { projectId: string; initialNotes: string }) {
    const [notes, setNotes] = useState(initialNotes || "");
    const [loading, setLoading] = useState(false);
    const [dirty, setDirty] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        const result = await saveProjectNotes(projectId, notes);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Notes sauvegardées !");
            setDirty(false);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-primary" /> Notes du projet
                </h3>
                {dirty && (
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={loading}
                        className="h-8 gap-1.5 text-xs font-bold rounded-lg"
                    >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {loading ? "Sauvegarde..." : "Sauvegarder"}
                    </Button>
                )}
            </div>
            <textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
                placeholder="Ajoutez des notes, observations, points importants..."
                className="w-full min-h-[120px] p-3 text-sm bg-muted/30 border border-border rounded-xl resize-y outline-none focus:border-primary/50 transition-colors font-medium placeholder:text-muted-foreground/60"
            />
        </div>
    );
}
