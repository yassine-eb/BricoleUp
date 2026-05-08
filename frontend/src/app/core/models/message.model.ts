import { User } from './user.model';

export interface Message {
  id: number;
  sender: User;
  contenu: string;
  type_message: 'text' | 'fichier' | 'devis';
  fichier: string | null;
  lu: boolean;
  sent_at: string;
}

export interface Conversation {
  id: number;
  participants: User[];
  booking: string | null;
  last_message: Message | null;
  unread_count: number;
  created_at: string;
}

export interface WsMessage {
  type: 'message.new' | 'message.read' | 'typing';
  message_id?: number;
  contenu?: string;
  sender_id?: string;
  sender_name?: string;
  sent_at?: string;
  type_message?: string;
  user_id?: string;
  user_name?: string;
  is_typing?: boolean;
  reader_id?: string;
}
