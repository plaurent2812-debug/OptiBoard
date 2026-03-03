"use client";

import { Home, FolderKanban, CircleDollarSign, MessageSquare, Plus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MagicPushDrawer } from "./MagicPushDrawer";

export function BottomTabBar() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
            <Link href="/" className={cn("flex flex-col items-center gap-1 min-w-[64px]", pathname === "/" ? "text-primary font-semibold" : "text-muted-foreground")}>
                <Home className="w-6 h-6" />
                <span className="text-[10px] font-medium">Home</span>
            </Link>

            <Link href="/projects" className={cn("flex flex-col items-center gap-1 min-w-[64px]", pathname?.startsWith("/projects") ? "text-primary font-semibold" : "text-muted-foreground")}>
                <FolderKanban className="w-6 h-6" />
                <span className="text-[10px] font-medium">Projets</span>
            </Link>

            <div className="relative -top-6">
                <MagicPushDrawer>
                    <button className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform border-4 border-background">
                        <Plus className="w-8 h-8" />
                    </button>
                </MagicPushDrawer>
            </div>

            <Link href="/treso" className={cn("flex flex-col items-center gap-1 min-w-[64px]", pathname?.startsWith("/treso") ? "text-primary font-semibold" : "text-muted-foreground")}>
                <CircleDollarSign className="w-6 h-6" />
                <span className="text-[10px] font-medium">Tréso</span>
            </Link>

            <Link href="/clients" className={cn("flex flex-col items-center gap-1 min-w-[64px]", pathname?.startsWith("/clients") ? "text-primary font-semibold" : "text-muted-foreground")}>
                <Users className="w-6 h-6" />
                <span className="text-[10px] font-medium">Clients</span>
            </Link>
        </div>
    );
}
