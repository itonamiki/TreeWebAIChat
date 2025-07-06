export interface ApiSettings {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface ChatNode {
  id: string;
  question: string;
  answer: string;
  parentId: string | null;
  timestamp: number;
  model?: string;
  apiSettings?: ApiSettings;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  nodes: ChatNode[];
}