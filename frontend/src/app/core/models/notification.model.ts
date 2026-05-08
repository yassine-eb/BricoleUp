export interface Notification {
  id: number;
  titre: string;
  message: string;
  type_notif: 'booking' | 'message' | 'review' | 'payment' | 'system';
  lue: boolean;
  lien: string;
  created_at: string;
}
