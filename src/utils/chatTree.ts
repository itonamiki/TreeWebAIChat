import { ChatNode, ChatMessage, ApiSettings } from '../types/chat';

export const getPathToRoot = (nodeId: string, nodes: ChatNode[]): ChatNode[] => {
  const path: ChatNode[] = [];
  let currentId: string | null = nodeId;
  
  while (currentId) {
    const searchId: string = currentId; // ループ内で安全に使用するためのコピー
    const node = nodes.find(n => n.id === searchId);
    if (!node) break;
    path.unshift(node);
    currentId = node.parentId;
  }
  
  return path;
};

export const pathToMessages = (path: ChatNode[]): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  
  path.forEach(node => {
    messages.push({ role: 'user', content: node.question });
    messages.push({ role: 'assistant', content: node.answer });
  });
  
  return messages;
};

export const createNewNode = (
  question: string,
  answer: string,
  parentId: string | null,
  model?: string,
  apiSettings?: ApiSettings
): ChatNode => {
  return {
    id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    question,
    answer,
    parentId,
    timestamp: Date.now(),
    model,
    apiSettings
  };
};