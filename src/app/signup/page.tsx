"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function SignupPage() {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (password.length < 6) {
            toast.error("Le mot de passe doit contenir au moins 6 caractères.")
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    company_name: companyName,
                },
            },
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        toast.success("Compte créé avec succès !")
        router.push("/onboarding")
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10">
            <Card className="w-full max-w-md bg-card border-border shadow-2xl">
                <CardHeader className="space-y-1 items-center mb-2">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-primary/25">
                        <Rocket className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Créer votre compte</CardTitle>
                    <CardDescription className="text-center">
                        Lancez votre activité en 2 minutes.<br />
                        Gestion de projet, devis, facturation & IA.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignup}>
                    <CardContent className="space-y-4 pb-0">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Prénom</Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="Jean"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="h-12 bg-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Nom</Label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="Dupont"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="h-12 bg-muted/50"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Nom de votre entreprise</Label>
                            <Input
                                id="companyName"
                                type="text"
                                placeholder="Plomberie Dupont"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                                className="h-12 bg-muted/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email professionnel</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="jean@dupont-plomberie.fr"
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
                                placeholder="Minimum 6 caractères"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="h-12 bg-muted/50"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pt-8">
                        <Button
                            type="submit"
                            className="w-full h-14 text-base font-bold shadow-md rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                            disabled={loading}
                        >
                            {loading ? "Création en cours..." : "Créer mon compte gratuitement"}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            Déjà un compte ?{" "}
                            <Link href="/login" className="text-primary font-semibold hover:underline">
                                Se connecter
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
