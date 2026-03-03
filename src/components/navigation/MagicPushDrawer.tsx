"use client";

import { Camera, Mic, LifeBuoy, Loader2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from "@/components/ui/drawer";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function MagicPushDrawer({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [audioIntent, setAudioIntent] = useState<"MEMO" | "PROJECT">("MEMO");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrgId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();
        if (profile) {
          const profileData = profile as any;
          if (profileData.organization_id) {
            setOrgId(profileData.organization_id);
          }
        }
      }
    };
    fetchOrgId();
  }, []);

  const handleUpload = async (file: File | Blob, type: "IMAGE" | "AUDIO", intent: "MEMO" | "PROJECT" | "RECEIPT" = "MEMO") => {
    try {
      setUploading(true);
      const fileExt = type === "IMAGE" ? (file as File).name.split('.').pop() : "webm"; // Assuming webm for audio blobs
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${orgId || 'unknown'}/captures/${fileName}`;

      // 1. Upload file to Supabase Storage (assuming bucket 'captures' exists)
      const { error: uploadError } = await supabase.storage
        .from('captures')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('captures')
        .getPublicUrl(filePath);

      const { data: captureDataRaw, error: dbError } = await supabase
        .from('captures')
        // @ts-expect-error Supabase types are not perfectly synced
        .insert({
          organization_id: orgId!,
          type: type,
          storage_url: publicUrl,
          processed: false,
          intent: intent // Add intent to the database record
        })
        .select()
        .single();

      const captureData = captureDataRaw as any;

      if (dbError) {
        throw dbError;
      }

      // 3. Trigger Background AI Job
      const triggerResponse = await fetch("/api/trigger-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captureId: captureData.id,
          storageUrl: publicUrl,
          organizationId: orgId,
          type: type,
          intent: intent
        })
      });

      if (!triggerResponse.ok) {
        const errorData = await triggerResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start AI background job");
      }

      alert("Fichier envoyé ! L'IA est en cours d'analyse en arrière-plan.");
    } catch (error: any) {
      console.warn('Error uploading:', typeof error === 'object' ? JSON.stringify(error, null, 2) : error, error?.message);
      toast.error("Erreur lors de l'upload", { description: error?.message || "Veuillez réessayer" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "IMAGE" | "AUDIO", intent: "MEMO" | "PROJECT" | "RECEIPT" = "MEMO") => {
    if (!event.target.files || event.target.files.length === 0) return;
    if (!orgId) {
      toast.error("Erreur d'authentification");
      return;
    }
    const file = event.target.files[0];
    await handleUpload(file, type, intent);
  };

  const startRecording = async (intent: "MEMO" | "PROJECT") => {
    if (!orgId) {
      toast.error("Veuillez patienter...", { description: "Chargement du profil en cours." });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        handleUpload(audioBlob, "AUDIO", intent);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false); // Stop recording state
      };

      setAudioChunks(chunks);
      setAudioIntent(intent);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.warn("Microphone access denied:", err.message || err);
      toast.error("Accès au microphone refusé", {
        description: "Veuillez autoriser le micro dans les réglages système de votre Mac ou de votre navigateur."
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualClient, setManualClient] = useState("");
  const [manualProject, setManualProject] = useState("");

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error("Profil non chargé");
      return;
    }
    if (!manualClient.trim() || !manualProject.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setUploading(true);
    try {
      // Create Client
      let clientId;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('name', manualClient.trim())
      if (existingClient) {
        const clientData = existingClient as any;
        clientId = clientData.id;
      } else {
        const { data: newClientRaw, error: clientErr } = await supabase
          .from('clients')
          // @ts-expect-error Supabase strict typing
          .insert({ organization_id: orgId, name: manualClient.trim() })
          .select()
          .single();
        if (clientErr) throw clientErr;
        const newClient = newClientRaw as any;
        clientId = newClient.id;
      }

      // Create Project
      const { error: projectErr } = await supabase
        .from('projects')
        // @ts-expect-error Supabase strict typing
        .insert({
          organization_id: orgId,
          client_id: clientId,
          title: manualProject.trim(),
          status: 'DEVIS'
        });

      if (projectErr) throw projectErr;

      toast.success("Chantier créé avec succès !");
      setShowManualForm(false);
      setManualClient("");
      setManualProject("");
      setIsOpen(false);
      router.refresh(); // Tells Next.js to re-fetch Server Components (updates the Projects list)
    } catch (err: unknown) {
      console.error("Submission error:", err);
      toast.error("Erreur lors de la création", {
        description: err instanceof Error ? err.message : JSON.stringify(err)
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="pb-8 pt-4 px-4 bg-card border-t border-border">
        {/* We need a title for accessibility even if visually hidden */}
        <DrawerTitle className="sr-only">Menu d&apos;ajout rapide</DrawerTitle>
        <div className="flex flex-col gap-4">
          {uploading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-sm font-medium text-foreground">Traitement en cours...</p>
            </div>
          ) : (
            <>
              {showManualForm ? (
                <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="text-center mb-2">
                    <h3 className="font-bold text-xl text-foreground">Saisie Manuelle</h3>
                    <p className="text-sm text-muted-foreground mt-1">Créez un nouveau chantier instantanément</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground ml-1">Nom du Client</label>
                      <input
                        type="text"
                        value={manualClient}
                        onChange={(e) => setManualClient(e.target.value)}
                        placeholder="Ex: Jean Dupont"
                        className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground ml-1">Titre du Chantier</label>
                      <input
                        type="text"
                        value={manualProject}
                        onChange={(e) => setManualProject(e.target.value)}
                        placeholder="Ex: Rénovation Cuisine"
                        className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-1/3 rounded-xl h-12 font-bold"
                      onClick={() => setShowManualForm(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="w-2/3 rounded-xl h-12 font-bold"
                    >
                      Sauvegarder
                    </Button>
                  </div>
                </form>
              ) : isRecording ? (
                <div className="flex flex-col items-center justify-center p-6 bg-red-500/10 rounded-xl border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                    </div>
                    <span className="text-lg font-semibold text-red-500">Enregistrement en cours...</span>
                  </div>
                  <p className="text-sm text-red-400 mt-2">Cliquez pour arrêter l&apos;enregistrement</p>
                  <Button onClick={stopRecording} className="mt-4 bg-red-500 hover:bg-red-600 text-white">
                    Arrêter l&apos;enregistrement
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Voice Memo */}
                  <button
                    onClick={() => startRecording("MEMO")}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-accent transition-colors"
                  >
                    <div className="bg-success/20 p-3 rounded-full">
                      <Mic className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-bold text-base text-foreground">Note Vocale</span>
                      <span className="text-xs text-muted-foreground font-medium">Mémo, avancement, todo</span>
                    </div>
                  </button>

                  {/* Project Voice */}
                  <button
                    onClick={() => startRecording("PROJECT")}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-accent transition-colors"
                  >
                    <div className="bg-primary/20 p-3 rounded-full">
                      <Mic className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-bold text-base text-foreground">Nouveau Chantier Vocal</span>
                      <span className="text-xs text-muted-foreground font-medium">Créer à partir d&apos;un vocal</span>
                    </div>
                  </button>

                  {/* Manual Project */}
                  <button
                    onClick={() => setShowManualForm(true)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-accent transition-colors col-span-1 sm:col-span-2 justify-center py-3 bg-muted/30"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <LifeBuoy className="w-5 h-5 text-muted-foreground" />
                      <span className="font-bold text-[15px] text-foreground">Saisie Manuelle (Chantier)</span>
                    </div>
                  </button>

                  {/* Photo Capture */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e, "IMAGE", "MEMO")}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-accent transition-colors"
                  >
                    <div className="bg-orange-500/20 p-3 rounded-full">
                      <Camera className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-bold text-base text-foreground">Photo</span>
                      <span className="text-xs text-muted-foreground font-medium">Document, tableau blanc, plan</span>
                    </div>
                  </button>

                  {/* Receipt Capture */}
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      fileInputRef.current?.setAttribute('data-intent', 'RECEIPT'); // Store intent for handleFileUpload
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-accent transition-colors"
                  >
                    <div className="bg-purple-500/20 p-3 rounded-full">
                      <Camera className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-bold text-base text-foreground">Reçu</span>
                      <span className="text-xs text-muted-foreground font-medium">Note de frais, facture</span>
                    </div>
                  </button>
                </div>
              )}
            </>
          )}
          {/* Safe area padding for newer iPhones */}
          <div className="h-6 w-full" />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

