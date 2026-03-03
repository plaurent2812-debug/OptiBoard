"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (signInError) {
            setError(signInError.message)
            setLoading(false)
            return
        }

        // Role redirection is handled by middleware but we can force a router refresh
        router.refresh()
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
            <div className="absolute top-4 right-4"><ThemeToggle /></div>
            <Card className="w-full max-w-sm bg-card border-border shadow-xl">
                <CardHeader className="space-y-1 items-center mb-2">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-2">
                        <Settings className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
                    <CardDescription>
                        Accédez à votre espace OptiBoard
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 pb-0">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="jean@artisan.fr"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 bg-muted/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 bg-muted/50"
                            />
                        </div>
                        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pt-8">
                        <Button type="submit" className="w-full h-14 text-base font-bold shadow-md rounded-xl" disabled={loading}>
                            {loading ? "Chargement..." : "Se connecter"}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            Pas encore de compte ?{" "}
                            <Link href="/signup" className="text-primary font-semibold hover:underline">
                                Créer un compte
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
