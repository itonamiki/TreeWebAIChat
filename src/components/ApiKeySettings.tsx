import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ApiKeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useLocalStorage('claude-api-key', '');
  const [inputValue, setInputValue] = useState(apiKey);
  const [isVisible, setIsVisible] = useState(false);

  const handleSave = () => {
    setApiKey(inputValue);
    onClose();
  };

  const handleClear = () => {
    setInputValue('');
    setApiKey('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Claude API設定</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              APIキー
            </label>
            <div className="relative">
              <input
                type={isVisible ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {isVisible ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              APIキーはブラウザのローカルストレージに保存されます
            </p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>APIキーの取得方法:</strong><br />
              1. <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a>にアクセス<br />
              2. API Keysページでキーを作成<br />
              3. 作成されたキーをここに入力
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            クリア
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySettings;