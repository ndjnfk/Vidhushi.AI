import type { ConsultationRequestOut } from "@/lib/bookings";

export interface ChatMessageOut {
  id: string;
  sender: "client" | "host";
  text: string;
  created_at: string; // UTC, no offset
  read_at: string | null;
}

export interface ChatThreadOut {
  can_send: boolean;
  messages: ChatMessageOut[];
}

export interface ChatConversationOut {
  request: ConsultationRequestOut;
  last_message: ChatMessageOut | null;
  unread: number;
}

// Chat endpoints rooted at `base` ("/bookings/<id>" for the client,
// "/admin/bookings/<id>" for Vidushi Ji), sent with the given fetcher.
export function makeChatApi(base: string, fetcher: <T>(path: string, options?: RequestInit) => Promise<T>) {
  return {
    thread: (after?: string) => fetcher<ChatThreadOut>(`${base}/chat${after ? `?after=${encodeURIComponent(after)}` : ""}`),
    send: (text: string) => fetcher<ChatMessageOut>(`${base}/chat`, { method: "POST", body: JSON.stringify({ text }) }),
  };
}

export type ChatApi = ReturnType<typeof makeChatApi>;
