import { User } from './user.model';

export interface Review {
  id: number;
  booking: string;
  auteur: User;
  cible: User;
  note: number;
  commentaire: string;
  verified: boolean;
  created_at: string;
}

export interface ReviewCreatePayload {
  booking_id: string;
  note: number;
  commentaire: string;
}
