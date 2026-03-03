import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, CheckCircle, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bonjour, Jean 👋</h1>
          <p className="text-muted-foreground">Voici l&apos;essentiel pour aujourd&apos;hui</p>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/50 shadow-sm shrink-0 hover:bg-primary/30 transition-colors">
            J
          </button>
        </form>
      </div>

      {/* Widget Tréso */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 border-none shadow-md mt-2 relative overflow-hidden text-primary-foreground">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -z-10" />
        <CardContent className="p-6 flex items-center justify-between z-10">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium opacity-80">Objectif Mois: 15 000 €</span>
            <span className="text-4xl font-black tracking-tight">12 450 €</span>
            <span className="text-[13px] flex items-center gap-1.5 mt-2 font-semibold bg-white/20 text-white w-fit px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
              <TrendingUp className="w-4 h-4" /> En bonne voie
            </span>
          </div>
          {/* Circular Progress approximation */}
          <div className="relative w-24 h-24 rounded-full border-[8px] border-white/20 flex items-center justify-center shrink-0 rotate-[135deg]">
            <div className="absolute inset-0 rounded-full border-[8px] border-white border-t-transparent border-r-transparent" />
            <span className="font-bold text-xl rotate-[-135deg]">83%</span>
          </div>
        </CardContent>
      </Card>

      {/* Aujourd'hui */}
      <div className="flex flex-col gap-3 mt-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> Aujourd&apos;hui
        </h2>
        <Card className="overflow-hidden border-border bg-card shadow-sm">
          <CardContent className="p-0">
            <div className="p-4 flex flex-col gap-2 border-b border-border bg-secondary/30">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[17px]">Rénovation Salle de Bain</h3>
                  <p className="text-muted-foreground flex items-center gap-1.5 mt-1.5 text-[14px] font-medium">
                    <MapPin className="w-[18px] h-[18px] text-primary" /> 12 Rue des Lilas, Paris
                  </p>
                </div>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[13px] font-bold ring-1 ring-primary/20">
                  09:00
                </div>
              </div>
            </div>
            <div className="bg-muted/30 p-4">
              <Button className="w-full h-14 text-base font-bold gap-2 rounded-xl shadow-md border border-primary/20" size="lg">
                <Navigation className="w-5 h-5" /> Y aller avec Waze
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fil d'actualité */}
      <div className="flex flex-col gap-3 mt-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" /> Dernières actions
        </h2>
        <div className="flex flex-col relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-border before:via-border/50 before:to-transparent">

          {/* Item 1 */}
          <div className="relative flex items-start gap-4 mb-5">
            <div className="z-10 bg-success border-[3px] border-background w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <span className="text-[11px] font-black text-success-foreground">BD</span>
            </div>
            <div className="flex-1 bg-card border border-border p-3.5 rounded-xl shadow-sm">
              <p className="font-semibold text-[15px]">Facture F-2023-45 envoyée</p>
              <p className="text-[13px] text-muted-foreground mt-1.5 font-medium">Il y a 2h • Client: Martin</p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="relative flex items-start gap-4 mb-2">
            <div className="z-10 bg-primary border-[3px] border-background w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <span className="text-[11px] font-black text-primary-foreground">BD</span>
            </div>
            <div className="flex-1 bg-card border border-border p-3.5 rounded-xl shadow-sm">
              <p className="font-semibold text-[15px]">Devis accepté !</p>
              <p className="text-[13px] text-muted-foreground mt-1.5 font-medium">Il y a 1 jour • Projet: Cuisine Dubois</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
