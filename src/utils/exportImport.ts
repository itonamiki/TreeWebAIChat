import { Conversation } from '../types/chat';

export interface ExportData {
  version: string;
  exportDate: string;
  conversations: Conversation[];
}

export const exportConversations = (conversations: Conversation[]): void => {
  const exportData: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    conversations
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `treechats-export-${dateString}.json`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const parseImportFile = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as ExportData;
        
        // 基本的なデータ検証
        if (!data.conversations || !Array.isArray(data.conversations)) {
          throw new Error('Invalid file format: conversations array not found');
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

export const mergeConversations = (
  existingConversations: Conversation[],
  importedConversations: Conversation[]
): { merged: Conversation[]; stats: { added: number; updated: number; skipped: number } } => {
  const stats = { added: 0, updated: 0, skipped: 0 };
  const merged = [...existingConversations];
  const existingIds = new Set(existingConversations.map(c => c.id));
  
  importedConversations.forEach(importedConv => {
    if (existingIds.has(importedConv.id)) {
      // 既存の会話と同じIDの場合、更新日時で判断
      const existingIndex = merged.findIndex(c => c.id === importedConv.id);
      const existing = merged[existingIndex];
      
      if (importedConv.updatedAt > existing.updatedAt) {
        // インポートデータの方が新しい場合は更新
        merged[existingIndex] = importedConv;
        stats.updated++;
      } else {
        stats.skipped++;
      }
    } else {
      // 新しい会話として追加
      merged.push(importedConv);
      stats.added++;
    }
  });
  
  // 更新日時でソート
  merged.sort((a, b) => b.updatedAt - a.updatedAt);
  
  return { merged, stats };
};

export const validateConversation = (conversation: any): conversation is Conversation => {
  return (
    typeof conversation === 'object' &&
    typeof conversation.id === 'string' &&
    typeof conversation.title === 'string' &&
    typeof conversation.createdAt === 'number' &&
    typeof conversation.updatedAt === 'number' &&
    Array.isArray(conversation.nodes) &&
    conversation.nodes.every((node: any) =>
      typeof node === 'object' &&
      typeof node.id === 'string' &&
      typeof node.question === 'string' &&
      typeof node.answer === 'string' &&
      (node.parentId === null || typeof node.parentId === 'string') &&
      typeof node.timestamp === 'number'
    )
  );
};