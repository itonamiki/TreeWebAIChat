import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatNode, ApiSettings } from '../types/chat';

interface ChatHistoryProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, model: string, settings: ApiSettings) => void;
  selectedNodeId?: string;
  isLoading?: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  apiSettings: ApiSettings;
  onApiSettingsChange: (settings: ApiSettings) => void;
  chatNodes: ChatNode[];
  selectedPath: ChatNode[];
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, onSendMessage, selectedNodeId, isLoading = false, selectedModel, onModelChange, apiSettings, onApiSettingsChange, chatNodes, selectedPath }) => {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 最後のメッセージが空のassistantメッセージかどうかを判定
  const hasEmptyAssistantMessage = messages.length > 0 && 
    messages[messages.length - 1].role === 'assistant' && 
    !messages[messages.length - 1].content;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim(), selectedModel, apiSettings);
      setInput('');
    }
  };

  const availableModels = [
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4 (Latest)' },
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-3-7-sonnet-latest', label: 'Claude Sonnet 3.7' },
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (20241022)' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (20241022)' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ];

  const getModelDisplayName = (modelId: string | undefined): string => {
    if (!modelId) return 'Claude 3 Sonnet'; // デフォルト表示名
    
    const modelMap: { [key: string]: string } = {
      'claude-opus-4-20250514': 'Claude Opus 4',
      'claude-sonnet-4-20250514': 'Claude Sonnet 4',
      'claude-3-7-sonnet-latest': 'Claude Sonnet 3.7',
      'claude-3-5-sonnet-latest': 'Claude 3.5 Sonnet',
      'claude-3-5-haiku-latest': 'Claude 3.5 Haiku',
      'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
      'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku'
    };
    
    return modelMap[modelId] || 'Claude 3 Sonnet';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center mt-8">
            新しい会話を始めましょう
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => {
              const nodeIndex = Math.floor(index / 2);
              const isAssistantMessage = message.role === 'assistant';
              const node = isAssistantMessage && selectedPath[nodeIndex] ? selectedPath[nodeIndex] : null;
              
              return (
                <div key={index} className={`flex gap-3 ${
                  message.role === 'user' 
                    ? 'bg-blue-50 p-3 rounded-lg' 
                    : ''
                }`}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {message.role === 'user' 
                        ? 'You' 
                        : `Assistant (${getModelDisplayName(node?.model)}${
                            node?.apiSettings 
                              ? `, T:${node.apiSettings.temperature || 0.7}, Tokens:${node.apiSettings.maxTokens || 1024}` 
                              : ''
                          })`
                      }
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {message.content || (message.role === 'assistant' && isLoading ? (
                        <div className="text-gray-600">
                          <div className="flex items-center gap-1">
                            <div className="animate-bounce">●</div>
                            <div className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</div>
                            <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</div>
                          </div>
                        </div>
                      ) : message.content)}
                    </div>
                  </div>
                </div>
              );
            })}
            {isLoading && !hasEmptyAssistantMessage && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  🤖
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Assistant ({getModelDisplayName(selectedModel)}, T:{apiSettings.temperature || 0.7}, Tokens:{apiSettings.maxTokens || 1024})
                  </div>
                  <div className="text-gray-600">
                    <div className="flex items-center gap-1">
                      <div className="animate-bounce">●</div>
                      <div className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</div>
                      <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <div className="mb-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            type="button"
          >
            <span>{showSettings ? '▼' : '▶'}</span>
            <span>モデル設定 ({getModelDisplayName(selectedModel)}, T:{apiSettings.temperature || 0.7})</span>
          </button>
          
          {showSettings && (
            <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                disabled={isLoading}
              >
                {availableModels.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Temperature</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={apiSettings.temperature || 0.7}
                    onChange={(e) => onApiSettingsChange({
                      ...apiSettings,
                      temperature: parseFloat(e.target.value)
                    })}
                    className="w-full"
                    disabled={isLoading}
                  />
                  <span className="text-xs text-gray-500">{apiSettings.temperature || 0.7}</span>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Tokens</label>
                  <select
                    value={apiSettings.maxTokens || 1024}
                    onChange={(e) => onApiSettingsChange({
                      ...apiSettings,
                      maxTokens: parseInt(e.target.value)
                    })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    disabled={isLoading}
                  >
                    <option value={512}>512</option>
                    <option value={1024}>1024</option>
                    <option value={2048}>2048</option>
                    <option value={4096}>4096</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Top P</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={apiSettings.topP || 0.9}
                  onChange={(e) => onApiSettingsChange({
                    ...apiSettings,
                    topP: parseFloat(e.target.value)
                  })}
                  className="w-full"
                  disabled={isLoading}
                />
                <span className="text-xs text-gray-500">{apiSettings.topP || 0.9}</span>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力... (Ctrl+Enterで送信)"
            className="flex-1 px-4 py-3 min-h-[44px] max-h-[200px] border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 resize-none overflow-y-auto"
            disabled={isLoading}
            rows={1}
            style={{
              height: 'auto',
              minHeight: '44px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 200) + 'px';
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (input.trim() && !isLoading) {
                  onSendMessage(input.trim(), selectedModel, apiSettings);
                  setInput('');
                  // Reset textarea height
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                }
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? '送信中...' : '送信'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatHistory;