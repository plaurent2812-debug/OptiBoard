import { BottomTabBar } from "@/components/navigation/BottomTabBar";
import { cookies } from "next/headers";
import { LogOut, Bot } from "lucide-react";
import Link from "next/link";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const impersonatedOrgName = cookieStore.get("impersonation_org_name")?.value;

  return (
    <div className="pb-24">
      {impersonatedOrgName && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 sticky top-0 z-50 flex items-center justify-between shadow-md">
          <div className="font-bold text-sm tracking-wide">
            Support: {impersonatedOrgName}
          </div>
          <form action={async () => {
            "use server";
            const { stopImpersonation } = await import("@/app/actions/impersonate");
            await stopImpersonation();
          }}>
            <button type="submit" className="flex items-center gap-1.5 text-xs font-bold uppercase hover:opacity-80 transition-opacity bg-background/20 px-2.5 py-1.5 rounded-full ring-1 ring-background/30">
              <LogOut className="w-3.5 h-3.5" /> Quitter
            </button>
          </form>
        </div>
      )}
      {children}

      {/* Floating Action Button (FAB) - Assistant IA */}
      <Link href="/chat" className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-background hover:scale-105 transition-transform active:scale-95">
        <Bot className="w-6 h-6" />
      </Link>

      <BottomTabBar />
    </div>
  );
}
