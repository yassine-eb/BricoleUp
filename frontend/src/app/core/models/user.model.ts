export interface Profile {
  bio: string;
  competences: string[];
  certifications: string[];
  portfolio_urls: string[];
  note_moyenne: number;
  nb_avis: number;
  rayon_km: number;
  tarif_horaire: number | null;
  abonnement: 'free' | 'pro';
  missions_terminees: number;
  match_score?: number | null;
}

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  full_name: string;
  role: 'client' | 'prestataire';
  phone: string;
  avatar: string | null;
  localisation: string;
  latitude: number | null;
  longitude: number | null;
  kyc_status: 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  date_joined: string;
  profile: Profile | null;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username?: string;
  nom: string;
  prenom: string;
  role: 'client' | 'prestataire';
  phone?: string;
  localisation?: string;
  password: string;
  password2: string;
  profile?: Partial<Profile>;
}
