import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrgId } from "@/utils/auth";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, CheckCircle, FolderKanban, Users, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const orgId = await getEffectiveOrgId();

  // Get user profile for greeting
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user?.id || "")
    .single() as any;

  const firstName = profile?.first_name || "Artisan";

  // Get organization name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single() as any;

  // KPIs: Active projects count
  const { count: activeProjectsCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .in("status", ["EN_COURS", "DEVIS"]);

  // KPIs: Clients count
  const { count: clientsCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  // KPIs: Pending quotes value (Devis en attente)
  const { data: devisProjects } = await supabase
    .from("projects")
    .select("total_ht")
    .eq("organization_id", orgId)
    .eq("status", "DEVIS");
  const devisResponse = devisProjects as any[] || [];
  const totalDevisEnAttente = devisResponse.reduce((acc, p) => acc + (p.total_ht || 0), 0);

  // KPIs: Invoices to collect
  const { data: factures } = await supabase
    .from("documents")
    .select("amount_ht, status")
    .eq("organization_id", orgId)
    .eq("type", "FACTURE");
  const facturesResponse = factures as any[] || [];
  const totalAEncaisser = facturesResponse
    .filter(f => f.status !== "PAYEE")
    .reduce((acc, f) => acc + (f.amount_ht || 0), 0);
  const totalEncaisse = facturesResponse
    .filter(f => f.status === "PAYEE")
    .reduce((acc, f) => acc + (f.amount_ht || 0), 0);

  // Recent projects for quick access
  const { data: recentProjects } = await supabase
    .from("projects")
    .select("id, title, status, client:client_id(name)")
    .eq("organization_id", orgId)
    .neq("status", "ARCHIVE")
    .order("created_at", { ascending: false })
    .limit(4);
  const recentProjectsResponse = recentProjects as any[] || [];

  // Revenue target (from org settings or fallback)
  const { data: orgSettings } = await (supabase
    .from("organization_settings") as any)
    .select("monthly_revenue_target")
    .eq("organization_id", orgId)
    .single();
  const revenueTarget = orgSettings?.monthly_revenue_target || 10000;
  const revenueProgress = revenueTarget > 0 ? Math.min(100, Math.round((totalEncaisse / revenueTarget) * 100)) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DEVIS": return "bg-amber-100 text-amber-700 border-amber-200";
      case "EN_COURS": return "bg-primary/10 text-primary border-primary/20";
      case "TERMINE": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DEVIS": return "Devis";
      case "EN_COURS": return "En cours";
      case "TERMINE": return "Terminé";
      default: return status;
    }
  };

  return (
    <div className="p-4 flex flex-col gap-5 pb-28">
      {/* Header */}
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {org?.name || "Votre espace OptiBoard"}
          </p>
        </div>
        <Link href="/profile">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md shadow-primary/20">
            {firstName.charAt(0).toUpperCase()}
          </div>
        </Link>
      </div>

      {/* Revenue Widget */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 border-none shadow-lg relative overflow-hidden text-primary-foreground">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium opacity-80">
              Objectif Mois: {revenueTarget.toLocaleString("fr-FR")} €
            </span>
            <span className="text-4xl font-black tracking-tight">
              {totalEncaisse.toLocaleString("fr-FR")} €
            </span>
            <span className="text-[13px] flex items-center gap-1.5 mt-2 font-semibold bg-white/20 text-white w-fit px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
              <TrendingUp className="w-4 h-4" />
              {revenueProgress}% de l&apos;objectif
            </span>
          </div>
          {/* Circular Progress */}
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="8"
                strokeDasharray={`${revenueProgress * 2.64} 264`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-bold text-xl">
              {revenueProgress}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/projects">
          <Card className="border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="w-4.5 h-4.5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">Projets actifs</span>
              </div>
              <span className="text-3xl font-black tracking-tight">{activeProjectsCount || 0}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/clients">
          <Card className="border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Users className="w-4.5 h-4.5 text-violet-500" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">Clients</span>
              </div>
              <span className="text-3xl font-black tracking-tight">{clientsCount || 0}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/treso">
          <Card className="border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">À encaisser</span>
              </div>
              <span className="text-2xl font-black tracking-tight">{totalAEncaisser.toLocaleString("fr-FR")} €</span>
            </CardContent>
          </Card>
        </Link>
        <Card className="border-border shadow-sm h-full">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <FileText className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <span className="text-sm font-semibold text-muted-foreground">Devis en attente</span>
            </div>
            <span className="text-2xl font-black tracking-tight">{totalDevisEnAttente.toLocaleString("fr-FR")} €</span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <div className="flex flex-col gap-3 mt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Projets récents
          </h2>
          <Link href="/projects" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentProjectsResponse.length === 0 ? (
          <Card className="border-dashed border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground font-medium">Aucun projet pour le moment.</p>
              <Link href="/projects/new" className="text-primary font-semibold text-sm hover:underline mt-2 inline-block">
                Créer votre premier projet →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentProjectsResponse.map((project) => {
              const clientName = typeof project.client === "object" && project.client
                ? (project.client as any).name
                : "Client inconnu";
              return (
                <Link href={`/projects/${project.id}`} key={project.id}>
                  <Card className="border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[15px] truncate">{project.title || "Sans titre"}</h3>
                        <p className="text-[13px] text-muted-foreground font-medium mt-0.5 truncate">
                          {clientName}
                        </p>
                      </div>
                      <span className={`text-[12px] font-bold px-3 py-1 rounded-full border shrink-0 ml-3 ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
