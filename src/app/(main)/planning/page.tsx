import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    // 0 = Sunday, we want Monday = 0
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

const MONTHS_FR = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default async function PlanningPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient();
    const orgId = await getEffectiveOrgId();

    const resolvedParams = await searchParams;
    const now = new Date();
    const year = parseInt(resolvedParams.year as string) || now.getFullYear();
    const month = parseInt(resolvedParams.month as string) ?? now.getMonth();
    const currentMonth = typeof resolvedParams.month === 'string' ? parseInt(resolvedParams.month) : now.getMonth();

    // Fetch projects with dates
    const { data: projects } = await supabase
        .from("projects")
        .select("id, title, status, start_date, end_date, address, client:client_id(name)")
        .eq("organization_id", orgId)
        .neq("status", "ARCHIVE") as any;

    const projectsList = projects as any[] || [];

    // Map projects to days
    const daysInMonth = getDaysInMonth(year, currentMonth);
    const firstDay = getFirstDayOfMonth(year, currentMonth);

    const projectsByDay: Record<number, any[]> = {};
    for (const project of projectsList) {
        if (project.start_date) {
            const startDate = new Date(project.start_date);
            if (startDate.getFullYear() === year && startDate.getMonth() === currentMonth) {
                const day = startDate.getDate();
                if (!projectsByDay[day]) projectsByDay[day] = [];
                projectsByDay[day].push(project);
            }
        }
        if (project.end_date) {
            const endDate = new Date(project.end_date);
            if (endDate.getFullYear() === year && endDate.getMonth() === currentMonth) {
                const day = endDate.getDate();
                if (!projectsByDay[day]) projectsByDay[day] = [];
                // Avoid duplicates
                if (!projectsByDay[day].find((p: any) => p.id === project.id)) {
                    projectsByDay[day].push(project);
                }
            }
        }
    }

    // Navigation links
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? year - 1 : year;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? year + 1 : year;

    const today = now.getDate();
    const isCurrentMonth = year === now.getFullYear() && currentMonth === now.getMonth();

    // Upcoming projects (sorted by start_date)
    const upcomingProjects = projectsList
        .filter(p => p.start_date && new Date(p.start_date) >= new Date(now.toDateString()))
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
        .slice(0, 5);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "DEVIS": return "bg-amber-500";
            case "EN_COURS": return "bg-primary";
            case "TERMINE": return "bg-emerald-500";
            default: return "bg-muted-foreground";
        }
    };

    return (
        <div className="p-4 flex flex-col gap-5 pb-28 min-h-screen">
            {/* Header */}
            <div className="mt-2">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-primary" /> Planning
                </h1>
                <p className="text-muted-foreground text-sm font-medium">Vue mensuelle de vos chantiers</p>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between">
                <Link href={`/planning?year=${prevYear}&month=${prevMonth}`}>
                    <button className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </Link>
                <h2 className="text-lg font-bold">
                    {MONTHS_FR[currentMonth]} {year}
                </h2>
                <Link href={`/planning?year=${nextYear}&month=${nextMonth}`}>
                    <button className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </Link>
            </div>

            {/* Calendar Grid */}
            <Card className="border-border shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-border">
                        {DAYS_FR.map(day => (
                            <div key={day} className="py-2 text-center text-[11px] font-bold text-muted-foreground uppercase">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar cells */}
                    <div className="grid grid-cols-7">
                        {/* Empty cells before first day */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square border-b border-r border-border/30 bg-muted/20" />
                        ))}

                        {/* Day cells */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayProjects = projectsByDay[day] || [];
                            const isToday = isCurrentMonth && day === today;

                            return (
                                <div
                                    key={day}
                                    className={`min-h-[60px] p-1 border-b border-r border-border/30 relative ${isToday ? "bg-primary/5" : ""}`}
                                >
                                    <span className={`text-[11px] font-bold block text-center mb-0.5 ${isToday
                                        ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center mx-auto"
                                        : "text-muted-foreground"
                                        }`}>
                                        {day}
                                    </span>
                                    {dayProjects.slice(0, 2).map((p: any) => (
                                        <Link href={`/projects/${p.id}`} key={p.id}>
                                            <div className={`text-[9px] font-semibold text-white px-1 py-0.5 rounded truncate mt-0.5 ${getStatusColor(p.status)} hover:opacity-80 transition-opacity`}>
                                                {p.title}
                                            </div>
                                        </Link>
                                    ))}
                                    {dayProjects.length > 2 && (
                                        <span className="text-[9px] text-muted-foreground font-semibold block text-center">
                                            +{dayProjects.length - 2}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Projects */}
            <div className="flex flex-col gap-3 mt-2">
                <h3 className="font-bold text-lg">Prochains chantiers</h3>
                {upcomingProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-6 text-center border border-dashed border-border">
                        Aucun chantier planifié. Ajoutez des dates de début à vos projets.
                    </p>
                ) : (
                    upcomingProjects.map((project) => {
                        const clientName = typeof project.client === 'object' && project.client
                            ? (project.client as any).name
                            : 'Client inconnu';
                        return (
                            <Link href={`/projects/${project.id}`} key={project.id}>
                                <Card className="border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${getStatusColor(project.status)}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">{project.title}</p>
                                            <p className="text-xs text-muted-foreground font-medium">{clientName}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-bold text-primary">
                                                {new Date(project.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                            </p>
                                            {project.address && (
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end mt-0.5">
                                                    <MapPin className="w-2.5 h-2.5" /> {project.address}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
