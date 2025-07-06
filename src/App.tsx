import React, { useState, useMemo, useEffect } from 'react';
import './App.css';
import ConversationList from './components/ConversationList';
import TreeView from './components/TreeView';
import ChatHistory from './components/ChatHistory';
import ApiKeySettings from './components/ApiKeySettings';
import ImportExportModal from './components/ImportExportModal';
import { Conversation } from './types/chat';
import { getPathToRoot, pathToMessages, createNewNode } from './utils/chatTree';
import { createNewConversation, updateConversationTitle } from './utils/conversation';
import { useLocalStorage } from './hooks/useLocalStorage';
import { claudeApiService, ClaudeMessage, ApiSettings } from './services/claudeApi';
import { exportConversations } from './utils/exportImport';

function App() {
  const [conversations, setConversations] = useLocalStorage<Conversation[]>('treechats-conversations', []);
  const [currentConversationId, setCurrentConversationId] = useLocalStorage<string | null>('treechats-current-conversation', null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [apiKey] = useLocalStorage('claude-api-key', '');
  const [selectedModel, setSelectedModel] = useLocalStorage('claude-selected-model', 'claude-sonnet-4-20250514');
  const [apiSettings, setApiSettings] = useLocalStorage<ApiSettings>('claude-api-settings', {
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.9
  });
  const [treePanelWidth] = useLocalStorage('tree-panel-width', '40%');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 初期化 - 初回起動時のみサンプルデータを作成
  useEffect(() => {
    if (conversations.length === 0) {
      const initialConversation = createNewConversation();
      initialConversation.nodes = [
        { 
          id: '1', 
          question: 'ReactでTodoアプリを作る方法を教えて', 
          answer: 'Reactでシンプルなtodoアプリを作成する手順を説明します。\n\n1. まず、Create React Appでプロジェクトを作成します\n2. stateでタスクリストを管理します\n3. 入力フォームとタスクリストコンポーネントを作成します\n4. 追加・削除機能を実装します', 
          parentId: null, 
          timestamp: Date.now() 
        },
        { 
          id: '2', 
          question: 'stateの管理はどうすればいい？', 
          answer: 'Reactでのstate管理にはいくつかの方法があります:\n\n1. useState Hook - シンプルなstate管理に最適\n2. useReducer Hook - 複雑なstate更新ロジックに適している\n3. Context API - コンポーネント間でのstate共有\n4. 外部ライブラリ (Redux, Zustand, Recoil) - 大規模アプリケーション向け', 
          parentId: '1', 
          timestamp: Date.now() + 1000 
        },
      ];
      const updatedConversation = updateConversationTitle(initialConversation, initialConversation.nodes);
      setConversations([updatedConversation]);
      setCurrentConversationId(updatedConversation.id);
    } else if (conversations.length > 0 && !currentConversationId) {
      // 保存された会話があるが、現在の会話が選択されていない場合は最新の会話を選択
      const latestConversation = conversations.sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setCurrentConversationId(latestConversation.id);
    }
  }, [conversations, currentConversationId, setConversations, setCurrentConversationId]);

  // APIキーが変更されたらClaude APIサービスを更新
  useEffect(() => {
    if (apiKey) {
      claudeApiService.setApiKey(apiKey);
    }
  }, [apiKey]);

  // パネル幅の初期化のみ（リサイズ監視は削除）
  useEffect(() => {
    const treePanel = document.querySelector('.tree-panel') as HTMLElement;
    if (treePanel && treePanelWidth) {
      treePanel.style.width = treePanelWidth;
    }
  }, [treePanelWidth]);

  const currentConversation = useMemo(() => {
    return conversations.find(c => c.id === currentConversationId);
  }, [conversations, currentConversationId]);

  const chatNodes = useMemo(() => {
    return currentConversation?.nodes || [];
  }, [currentConversation?.nodes]);

  const selectedPath = useMemo(() => {
    if (!selectedNodeId || !currentConversation) return [];
    return getPathToRoot(selectedNodeId, chatNodes);
  }, [selectedNodeId, chatNodes, currentConversation]);

  const messages = useMemo(() => {
    return pathToMessages(selectedPath);
  }, [selectedPath]);

  const handleNewConversation = () => {
    const newConversation = createNewConversation();
    setConversations([...conversations, newConversation]);
    setCurrentConversationId(newConversation.id);
    setSelectedNodeId('');
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    setSelectedNodeId('');
  };

  const handleExportConversations = () => {
    exportConversations(conversations);
  };

  const handleImportConversations = (importedConversations: Conversation[]) => {
    setConversations(importedConversations);
  };

  const handleSendMessage = async (question: string, model: string, settings: ApiSettings) => {
    if (!currentConversation) return;

    // 1. まず質問のみのノードを即座に作成・表示
    const parentId = selectedNodeId || null;
    const tempNode = createNewNode(question, "", parentId, model, settings);
    
    const tempNodes = [...chatNodes, tempNode];
    const tempConversation = updateConversationTitle(
      { ...currentConversation, nodes: tempNodes },
      tempNodes
    );
    
    // 即座に状態更新（質問が表示される）
    setConversations(conversations.map(c => 
      c.id === currentConversationId ? tempConversation : c
    ));
    setSelectedNodeId(tempNode.id);

    // 2. ローディング開始
    setIsLoading(true);
    let answer: string;

    try {
      console.log('API Service configured:', claudeApiService.isConfigured());
      console.log('API Key exists:', !!apiKey);
      console.log('API Key length:', apiKey.length);
      console.log('Selected model:', model);
      console.log('API Settings:', settings);
      
      if (claudeApiService.isConfigured()) {
        // 選択されたパスに基づいてメッセージ履歴を構築
        const contextMessages: ClaudeMessage[] = messages;
        const newMessages: ClaudeMessage[] = [...contextMessages, { role: 'user', content: question }];
        
        console.log('Sending messages to Claude:', newMessages);
        answer = await claudeApiService.sendMessage(newMessages, model, settings);
      } else {
        answer = 'APIキーが設定されていません。左下の「API設定」から設定してください。';
      }
    } catch (error) {
      console.error('Claude API Error:', error);
      answer = `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`;
    } finally {
      setIsLoading(false);
    }
    
    // 3. 同じノードに回答を追加
    const finalNode = { ...tempNode, answer };
    const finalNodes = [...chatNodes, finalNode];
    const finalConversation = updateConversationTitle(
      { ...currentConversation, nodes: finalNodes },
      finalNodes
    );
    
    setConversations(conversations.map(c => 
      c.id === currentConversationId ? finalConversation : c
    ));
    // selectedNodeIdは変更しない（既にtempNode.idに設定済み）
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <ConversationList
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExport={handleExportConversations}
        onOpenImport={() => setIsImportModalOpen(true)}
      />
      
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {currentConversation?.title || 'TreeChats'}
            </h1>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs ${
                claudeApiService.isConfigured() 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {claudeApiService.isConfigured() ? 'API接続済み' : 'API未設定'}
              </span>
              <span className="text-xs text-gray-500">
                APIキー: {apiKey ? `${apiKey.slice(0, 10)}...` : '未設定'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          <div 
            className="tree-panel bg-white flex flex-col border-r border-gray-200"
            style={{ width: treePanelWidth }}
          >
            <h2 className="text-lg font-semibold p-4 pb-2 border-b">会話の木構造</h2>
            <div className="flex-1 p-4 overflow-hidden">
              <TreeView 
                nodes={chatNodes}
                onNodeClick={setSelectedNodeId}
                selectedNodeId={selectedNodeId}
              />
            </div>
          </div>
          
          <div className="flex-1 bg-white flex flex-col">
            <h2 className="text-lg font-semibold p-4 pb-2 border-b">チャット</h2>
            <div className="flex-1 overflow-hidden">
              <ChatHistory 
                messages={messages} 
                onSendMessage={handleSendMessage}
                selectedNodeId={selectedNodeId}
                isLoading={isLoading}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                apiSettings={apiSettings}
                onApiSettingsChange={setApiSettings}
                chatNodes={chatNodes}
                selectedPath={selectedPath}
              />
            </div>
          </div>
        </div>
      </div>
      
      <ApiKeySettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      
      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        conversations={conversations}
        onImport={handleImportConversations}
      />
    </div>
  );
}

export default App;
