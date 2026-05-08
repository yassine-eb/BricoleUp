import { User } from './user.model';

export interface Categorie {
  id: number;
  nom: string;
  icone: string;
  slug: string;
}

export interface AnnonceImage {
  id: number;
  image: string;
  ordre: number;
}

export interface Annonce {
  id: string;
  client: User;
  titre: string;
  description: string;
  categorie: Categorie | null;
  budget_min: number;
  budget_max: number;
  localisation: string;
  latitude: number;
  longitude: number;
  urgence: boolean;
  statut: 'ouverte' | 'en_cours' | 'terminee' | 'annulee';
  date_souhaitee: string | null;
  boost_actif: boolean;
  boost_expire_at: string | null;
  created_at: string;
  expires_at: string | null;
  images: AnnonceImage[];
  distance_km: number | null;
  match_score: number | null;
  city?: { name_fr?: string; name?: string } | null;
  created_by?: { username?: string } | null;
  skill?: { name_fr?: string } | null;
}

export interface AnnonceCreatePayload {
  titre: string;
  description: string;
  categorie_id?: number;
  budget_min: number;
  budget_max: number;
  localisation: string;
  latitude: number;
  longitude: number;
  urgence?: boolean;
  date_souhaitee?: string;
  expires_at?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
