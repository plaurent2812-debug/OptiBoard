import { Inter } from "next/font/google";

export default function PublicPortalLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary/20">
            {children}
        </div>
    );
}
