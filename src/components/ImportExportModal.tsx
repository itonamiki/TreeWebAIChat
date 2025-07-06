import React, { useState, useRef } from 'react';
import { ExportData, parseImportFile, mergeConversations, validateConversation } from '../utils/exportImport';
import { Conversation } from '../types/chat';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onImport: (conversations: Conversation[]) => void;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  conversations,
  onImport
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    data: ExportData;
    stats: { added: number; updated: number; skipped: number };
  } | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsImporting(true);

    try {
      const data = await parseImportFile(file);
      
      // データ検証
      const invalidConversations = data.conversations.filter(conv => !validateConversation(conv));
      if (invalidConversations.length > 0) {
        throw new Error(`Invalid conversation data found: ${invalidConversations.length} conversations`);
      }

      // マージプレビュー
      const { stats } = mergeConversations(conversations, data.conversations);
      setImportPreview({ data, stats });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;

    const { merged } = mergeConversations(conversations, importPreview.data.conversations);
    onImport(merged);
    handleClose();
  };

  const handleClose = () => {
    setImportPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            インポート・エクスポート
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {!importPreview ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSONファイルをインポート
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  disabled={isImporting}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {isImporting && (
                  <p className="text-sm text-gray-500 mt-2">ファイルを解析中...</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  現在の会話数: {conversations.length}
                </p>
                <p className="text-xs text-gray-500">
                  インポート時は既存データとマージされ、重複は更新日時の新しい方が優先されます。
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-sm font-medium text-green-800 mb-2">
                  インポートプレビュー
                </h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p>📁 新規追加: {importPreview.stats.added}件</p>
                  <p>🔄 更新: {importPreview.stats.updated}件</p>
                  <p>⏭️ スキップ: {importPreview.stats.skipped}件</p>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>エクスポート日時: {new Date(importPreview.data.exportDate).toLocaleString()}</p>
                <p>バージョン: {importPreview.data.version}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            キャンセル
          </button>
          {importPreview && (
            <button
              onClick={handleConfirmImport}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              インポート実行
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;