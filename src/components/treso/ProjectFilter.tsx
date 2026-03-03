"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Project = {
    id: string;
    title: string;
};

export function ProjectFilter({ projects, selectedId }: { projects: Project[], selectedId?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value === "ALL") {
            params.delete("project");
        } else {
            params.set("project", value);
        }

        router.push(`/treso?${params.toString()}`);
        router.refresh();
    };

    return (
        <div className="w-full">
            <Select value={selectedId || "ALL"} onValueChange={handleValueChange}>
                <SelectTrigger className="w-full bg-card border-border shadow-sm h-12 font-semibold">
                    <SelectValue placeholder="Sélectionner un projet..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="ALL" className="font-bold text-primary">Global (Tous les projets)</SelectItem>
                        {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                                {project.title}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}
