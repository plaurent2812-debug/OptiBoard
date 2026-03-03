"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CreditCard, Check, ArrowRight, ArrowLeft, Sparkles } from "lucide-react"
import { toast } from "sonner"

type Step = 1 | 2 | 3

export default function OnboardingPage() {
    const [step, setStep] = useState<Step>(1)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Step 1: Company Identity
    const [siret, setSiret] = useState("")
    const [address, setAddress] = useState("")
    const [city, setCity] = useState("")
    const [postalCode, setPostalCode] = useState("")
    const [phone, setPhone] = useState("")
    const [tvaNumber, setTvaNumber] = useState("")

    // Step 2: Banking
    const [iban, setIban] = useState("")
    const [bic, setBic] = useState("")
    const [defaultTvaRate, setDefaultTvaRate] = useState("20")

    const handleSaveSettings = async () => {
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("Utilisateur non connecté.")
            setLoading(false)
            return
        }

        // Get user's org
        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single() as any

        if (!profile?.organization_id) {
            toast.error("Organisation introuvable.")
            setLoading(false)
            return
        }

        const { error } = await (supabase
            .from("organization_settings") as any)
            .upsert({
                organization_id: profile.organization_id,
                siret: siret || null,
                tva_number: tvaNumber || null,
                address: address || null,
                city: city || null,
                postal_code: postalCode || null,
                phone: phone || null,
                bank_iban: iban || null,
                bank_bic: bic || null,
                default_tva_rate: parseFloat(defaultTvaRate) || 20,
            }, { onConflict: "organization_id" })

        if (error) {
            toast.error("Erreur lors de la sauvegarde: " + error.message)
            setLoading(false)
            return
        }

        toast.success("Configuration terminée !")
        setLoading(false)
    }

    const handleFinish = async () => {
        await handleSaveSettings()
        router.push("/dashboard")
    }

    const handleSkip = () => {
        router.push("/dashboard")
    }

    const stepLabels = [
        { icon: Building2, label: "Identité" },
        { icon: CreditCard, label: "Bancaire" },
        { icon: Check, label: "Terminé" },
    ]

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10">
            {/* Progress Steps */}
            <div className="flex items-center gap-2 mb-8">
                {stepLabels.map((s, i) => {
                    const StepIcon = s.icon
                    const isActive = step === i + 1
                    const isDone = step > i + 1
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isActive
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                : isDone
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                <StepIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">{s.label}</span>
                            </div>
                            {i < 2 && <div className={`w-8 h-0.5 ${step > i + 1 ? "bg-primary" : "bg-border"}`} />}
                        </div>
                    )
                })}
            </div>

            <Card className="w-full max-w-lg bg-card border-border shadow-2xl">
                {/* Step 1: Company Identity */}
                {step === 1 && (
                    <>
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                Identité de votre entreprise
                            </CardTitle>
                            <CardDescription>
                                Ces informations apparaîtront sur vos devis et factures. Vous pouvez les modifier plus tard.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="siret">N° SIRET</Label>
                                    <Input id="siret" placeholder="123 456 789 00012" value={siret} onChange={(e) => setSiret(e.target.value)} className="h-12 bg-muted/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tva">TVA Intracommunautaire</Label>
                                    <Input id="tva" placeholder="FR12345678901" value={tvaNumber} onChange={(e) => setTvaNumber(e.target.value)} className="h-12 bg-muted/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Adresse</Label>
                                <Input id="address" placeholder="12 Rue des Artisans" value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 bg-muted/50" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="postalCode">Code Postal</Label>
                                    <Input id="postalCode" placeholder="75001" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="h-12 bg-muted/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">Ville</Label>
                                    <Input id="city" placeholder="Paris" value={city} onChange={(e) => setCity(e.target.value)} className="h-12 bg-muted/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <Input id="phone" type="tel" placeholder="06 12 34 56 78" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 bg-muted/50" />
                            </div>
                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                                    Passer pour le moment
                                </Button>
                                <Button onClick={() => setStep(2)} className="gap-2 font-bold rounded-xl px-6 h-12">
                                    Suivant <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </>
                )}

                {/* Step 2: Banking */}
                {step === 2 && (
                    <>
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Coordonnées bancaires
                            </CardTitle>
                            <CardDescription>
                                Vos coordonnées bancaires seront affichées sur vos factures pour le virement.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="iban">IBAN</Label>
                                <Input id="iban" placeholder="FR76 1234 5678 9012 3456 7890 123" value={iban} onChange={(e) => setIban(e.target.value)} className="h-12 bg-muted/50 font-mono text-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bic">BIC / SWIFT</Label>
                                <Input id="bic" placeholder="BNPAFRPP" value={bic} onChange={(e) => setBic(e.target.value)} className="h-12 bg-muted/50 font-mono" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tvaRate">Taux de TVA par défaut (%)</Label>
                                <Input id="tvaRate" type="number" step="0.1" placeholder="20" value={defaultTvaRate} onChange={(e) => setDefaultTvaRate(e.target.value)} className="h-12 bg-muted/50" />
                            </div>
                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={() => setStep(1)} className="gap-2 text-muted-foreground">
                                    <ArrowLeft className="w-4 h-4" /> Retour
                                </Button>
                                <Button onClick={() => { handleSaveSettings(); setStep(3); }} className="gap-2 font-bold rounded-xl px-6 h-12">
                                    Suivant <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </>
                )}

                {/* Step 3: Done */}
                {step === 3 && (
                    <>
                        <CardHeader className="space-y-1 items-center text-center pt-10">
                            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-3xl flex items-center justify-center mb-4 shadow-xl shadow-primary/30 animate-bounce">
                                <Sparkles className="w-10 h-10 text-primary-foreground" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Tout est prêt ! 🎉</CardTitle>
                            <CardDescription className="text-base max-w-sm mx-auto">
                                Votre espace OptiBoard est configuré. Vous pouvez maintenant créer votre premier client et votre premier devis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-10 pt-6">
                            <Button
                                onClick={handleFinish}
                                disabled={loading}
                                className="w-full h-14 text-base font-bold shadow-lg rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                {loading ? "Finalisation..." : "Accéder à mon tableau de bord"}
                            </Button>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    )
}
