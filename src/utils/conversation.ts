import { Conversation, ChatNode } from '../types/chat';

export const createNewConversation = (): Conversation => {
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: '新しい会話',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nodes: []
  };
};

export const updateConversationTitle = (
  conversation: Conversation,
  nodes: ChatNode[]
): Conversation => {
  if (nodes.length > 0) {
    const firstNode = nodes.find(node => node.parentId === null);
    if (firstNode) {
      return {
        ...conversation,
        title: firstNode.question.slice(0, 50) + (firstNode.question.length > 50 ? '...' : ''),
        updatedAt: Date.now()
      };
    }
  }
  return conversation;
};