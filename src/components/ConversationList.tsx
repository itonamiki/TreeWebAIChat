import React from 'react';
import { Conversation } from '../types/chat';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onOpenSettings: () => void;
  onExport: () => void;
  onOpenImport: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onOpenSettings,
  onExport,
  onOpenImport,
}) => {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-4">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
        >
          <span className="text-lg">+</span>
          <span>新しい会話</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">
            会話がありません
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-gray-800'
                      : ''
                  }`}
                >
                  <div className="font-medium truncate">{conversation.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(conversation.updatedAt).toLocaleDateString('ja-JP')}
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-700 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExport}
            className="flex items-center justify-center gap-1 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span>📤</span>
            <span>Export</span>
          </button>
          <button
            onClick={onOpenImport}
            className="flex items-center justify-center gap-1 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span>📥</span>
            <span>Import</span>
          </button>
        </div>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span>⚙️</span>
          <span>API設定</span>
        </button>
      </div>
    </div>
  );
};

export default ConversationList;