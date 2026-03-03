export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string
                    name: string
                    subscription_plan: 'Sérénité' | 'Bras Droit' | 'Expert'
                    settings: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    subscription_plan?: 'Sérénité' | 'Bras Droit' | 'Expert'
                    settings?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    subscription_plan?: 'Sérénité' | 'Bras Droit' | 'Expert'
                    settings?: Json
                    created_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    organization_id: string | null
                    role: 'ARTISAN' | 'ADMIN_OPTIPRO' | 'SUPER_ADMIN'
                    created_at: string
                }
                Insert: {
                    id: string
                    organization_id?: string | null
                    role?: 'ARTISAN' | 'ADMIN_OPTIPRO' | 'SUPER_ADMIN'
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string | null
                    role?: 'ARTISAN' | 'ADMIN_OPTIPRO' | 'SUPER_ADMIN'
                    created_at?: string
                }
            }
            clients: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    email: string | null
                    phone: string | null
                    address: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    created_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    organization_id: string
                    client_id: string | null
                    status: 'DEVIS' | 'EN_COURS' | 'TERMINE' | 'ARCHIVE'
                    total_ht: number | null
                    margin: number | null
                    title: string | null
                    budget: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    client_id?: string | null
                    status?: 'DEVIS' | 'EN_COURS' | 'TERMINE' | 'ARCHIVE'
                    total_ht?: number | null
                    margin?: number | null
                    title?: string | null
                    budget?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    client_id?: string | null
                    status?: 'DEVIS' | 'EN_COURS' | 'TERMINE' | 'ARCHIVE'
                    total_ht?: number | null
                    margin?: number | null
                    title?: string | null
                    budget?: number | null
                    created_at?: string
                }
            }
            documents: {
                Row: {
                    id: string
                    organization_id: string
                    project_id: string | null
                    type: 'DEVIS' | 'FACTURE' | 'ACHAT'
                    url: string
                    status: string | null
                    amount_ht: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    project_id?: string | null
                    type: 'DEVIS' | 'FACTURE' | 'ACHAT'
                    url: string
                    status?: string | null
                    amount_ht?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    project_id?: string | null
                    type?: 'DEVIS' | 'FACTURE' | 'ACHAT'
                    url?: string
                    status?: string | null
                    amount_ht?: number | null
                    created_at?: string
                }
            }
            captures: {
                Row: {
                    id: string
                    organization_id: string
                    type: 'IMAGE' | 'AUDIO'
                    storage_url: string
                    processed: boolean
                    summary: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    type: 'IMAGE' | 'AUDIO'
                    storage_url: string
                    processed?: boolean
                    summary?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    type?: 'IMAGE' | 'AUDIO'
                    storage_url?: string
                    processed?: boolean
                    summary?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            organization_stats: {
                Row: {
                    organization_id: string
                    total_chiffre_affaire_encaisse_ht: number
                    total_achats_materiel_ht: number
                }
            }
        }
    }
}
