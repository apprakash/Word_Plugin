// Define all interfaces used in the application
export interface ChatMessage {
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messages: ChatMessage[];
}

export interface ToolOperation {
  name: string;
  input: any;
}

export interface FormattingOptions {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  size?: number;
}
