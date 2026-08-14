export interface ChatMessage {
  id: string;
  uid: string;
  senderName: string;
  text: string;
  sentAt: number;
  isLocal: boolean;
}
