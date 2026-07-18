export interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  status: "online" | "offline" | "away";
  last_seen_at?: string | null;
}

export interface Reaction {
  emoji: string;
  count: number;
  user_ids: number[];
}

export interface Message {
  id: number;
  conversation_id: number;
  user_id: number;
  content: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: User;
  reactions?: Reaction[];
}

export interface Conversation {
  id: number;
  type: "direct" | "group";
  name?: string | null;
  avatar_url?: string | null;
  last_message_at?: string | null;
  members: User[];
  last_message?: Message | null;
  unread_count: number;
}

