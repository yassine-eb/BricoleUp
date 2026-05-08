import { User } from './user.model';
import { Annonce } from './ad.model';

export interface Devis {
  id: number;
  description: string;
  montant: number;
  duree_jours: number;
  accepte: boolean | null;
  created_at: string;
}

export interface Booking {
  id: string;
  annonce: Annonce;
  prestataire: User;
  prix_final: number;
  commission: number;
  statut_booking: 'devis_envoye' | 'accepte' | 'en_cours' | 'termine' | 'litige' | 'annule';
  statut_paiement: 'en_attente' | 'escrow' | 'libere' | 'rembourse';
  stripe_payment_intent: string;
  date_prestation: string | null;
  validated_at: string | null;
  created_at: string;
  devis: Devis | null;
}

export interface BookingCreatePayload {
  annonce_id: string;
  prix_final: number;
  date_prestation?: string;
  devis: {
    description: string;
    montant: number;
    duree_jours: number;
  };
}
