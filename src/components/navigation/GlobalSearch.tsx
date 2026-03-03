"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Search, X, FolderKanban, Users, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
    type: "project" | "client" | "document";
    id: string;
    title: string;
    subtitle: string;
    href: string;
}

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            setLoading(true);
            const searchResults: SearchResult[] = [];
            const q = `%${query}%`;

            // Search projects
            const { data: projects } = await supabase
                .from("projects")
                .select("id, title, status")
                .ilike("title", q)
                .limit(5) as any;

            if (projects) {
                projects.forEach((p: any) => {
                    searchResults.push({
                        type: "project",
                        id: p.id,
                        title: p.title || "Sans titre",
                        subtitle: p.status || "",
                        href: `/projects/${p.id}`,
                    });
                });
            }

            // Search clients
            const { data: clients } = await supabase
                .from("clients")
                .select("id, name, phone")
                .ilike("name", q)
                .limit(5) as any;

            if (clients) {
                clients.forEach((c: any) => {
                    searchResults.push({
                        type: "client",
                        id: c.id,
                        title: c.name,
                        subtitle: c.phone || "",
                        href: `/clients/${c.id}`,
                    });
                });
            }

            setResults(searchResults);
            setLoading(false);
        }, 300);

        return () => clearTimeout(timeout);
    }, [query]);

    const getIcon = (type: string) => {
        switch (type) {
            case "project": return <FolderKanban className="w-4 h-4 text-primary" />;
            case "client": return <Users className="w-4 h-4 text-violet-500" />;
            case "document": return <FileText className="w-4 h-4 text-amber-500" />;
            default: return null;
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm text-muted-foreground font-medium hover:border-primary/30 hover:bg-muted/70 transition-all"
            >
                <Search className="w-4 h-4" />
                Rechercher un client, un projet...
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col">
            {/* Search Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="flex-1 bg-transparent text-lg font-medium outline-none placeholder:text-muted-foreground/60"
                />
                <button
                    onClick={() => { setOpen(false); setQuery(""); setResults([]); }}
                    className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading && (
                    <p className="text-sm text-muted-foreground text-center py-8">Recherche en cours...</p>
                )}
                {!loading && query && results.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucun résultat pour &quot;{query}&quot;</p>
                )}
                {results.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {results.map((result) => (
                            <Link
                                key={`${result.type}-${result.id}`}
                                href={result.href}
                                onClick={() => { setOpen(false); setQuery(""); setResults([]); }}
                            >
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        {getIcon(result.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{result.title}</p>
                                        <p className="text-xs text-muted-foreground font-medium">{result.subtitle}</p>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">
                                        {result.type === "project" ? "Projet" : result.type === "client" ? "Client" : "Doc"}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                {!query && (
                    <p className="text-sm text-muted-foreground text-center py-8">Tapez pour rechercher parmi vos clients et projets</p>
                )}
            </div>
        </div>
    );
}
