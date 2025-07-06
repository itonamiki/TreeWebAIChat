# TreeChats

**Claude APIと連携したチャット履歴木構造管理ツール**

AIとの会話を分岐させながら効率的に管理できるWebアプリケーション

## プロジェクトの概要

ChatGPTやClaudeなどのAIチャットサービスでは、会話の途中で質問を変更したり、異なる方向に会話を分岐させることがあります。しかし、これらの分岐した会話履歴全体を俯瞰的に見ることは難しく、コンテキスト長を意識しながら会話を管理する必要があります。

TreeChatsは、この問題を解決するために開発されたツールです：

- **会話の木構造化**: チャット履歴を木構造として視覚化し、分岐点を明確に表示
- **分岐の管理**: 任意の時点から新しい質問を投げて会話を分岐可能
- **コンテキストの可視化**: 選択したノードまでの会話履歴を簡単に確認
- **実際のAI連携**: Claude APIと統合し、実際のAI回答を生成

## 主要機能

### ✅ 実装済み機能

#### 1. 3カラムレイアウト
- **左サイドバー**: ChatGPT風の会話リスト管理
- **中央パネル**: React Flowによる対話的な木構造表示
- **右パネル**: ChatGPT風のチャットインターフェース

#### 2. 会話管理システム
- 複数の独立した会話セッションの作成・切り替え
- 会話タイトルの自動生成（最初の質問から抽出）
- 最終更新順での会話ソート
- 会話の永続化（ローカルストレージ）

#### 3. 木構造ビジュアライザー
- **ノード設計**: Q&Aペアを1つのノードとして表示
- **視覚的分岐**: 親子関係を線で明確に表示
- **ノード選択**: クリックで会話履歴パスを切り替え
- **選択状態**: 現在選択中のノードをハイライト表示
- **動的レイアウト**: サブツリー幅に応じた自動配置でノード重複を防止

#### 4. Claude API統合
- **APIキー管理**: セキュアなローカルストレージ保存
- **設定UI**: モーダルダイアログでAPIキー設定
- **マルチモデル対応**: Claude 3.5 Sonnet/Haiku、Claude 3 Opus/Sonnet/Haiku
- **高度なパラメータ制御**: Temperature、Max Tokens、Top P の調整
- **設定の永続化**: モデル選択とAPIパラメータの自動保存
- **コンテキスト保持**: 選択パスの会話履歴を含めてAPI呼び出し

#### 5. チャットインターフェース
- **ChatGPT風UI**: アイコン付きメッセージ表示
- **段階的表示**: 質問送信→即座表示→ローディング→回答の自然な流れ
- **モデル情報表示**: 各回答にモデル名とパラメータ情報を表示
- **折りたたみ式設定**: コンパクトなモデル・パラメータ設定UI
- **自動スクロール**: 新しいメッセージ追加時の自動スクロール
- **エラーハンドリング**: API呼び出し失敗時の適切なメッセージ
- **分岐作成**: 任意のノードから新しい質問で分岐

#### 6. データ永続化
- **ローカルストレージ**: 会話履歴とAPIキーの自動保存
- **拡張メタデータ**: モデル情報とAPIパラメータの記録
- **状態復元**: アプリケーション再起動時の完全復元
- **リアルタイム保存**: 新しいメッセージ送信時の即座保存

### 🔧 技術実装詳細

#### アーキテクチャ
```
src/
├── components/           # UIコンポーネント
│   ├── ConversationList.tsx    # 会話リスト（左サイドバー）
│   ├── TreeView.tsx            # 木構造ビジュアライザー
│   ├── ChatHistory.tsx         # チャット履歴表示
│   └── ApiKeySettings.tsx      # APIキー設定モーダル
├── services/            # 外部サービス連携
│   └── claudeApi.ts           # Claude API呼び出し
├── hooks/               # カスタムフック
│   └── useLocalStorage.ts     # ローカルストレージ管理
├── types/               # TypeScript型定義
│   └── chat.ts               # チャット関連の型
└── utils/               # ユーティリティ関数
    ├── chatTree.ts           # 木構造操作
    └── conversation.ts       # 会話管理
```

#### データモデル
```typescript
// APIパラメータ設定
interface ApiSettings {
  temperature?: number;    // 応答の創造性 (0-1)
  maxTokens?: number;      // 最大トークン数
  topP?: number;          // 核サンプリング (0-1)
}

// 会話ノード（Q&Aペア）
interface ChatNode {
  id: string;
  question: string;        // ユーザーの質問
  answer: string;          // AIの回答
  parentId: string | null; // 親ノードID（ルートはnull）
  timestamp: number;       // 作成時刻
  model?: string;          // 使用したClaudeモデル
  apiSettings?: ApiSettings; // API呼び出し時の設定
}

// 会話セッション
interface Conversation {
  id: string;
  title: string;           // 自動生成されるタイトル
  createdAt: number;       // 作成時刻
  updatedAt: number;       // 最終更新時刻
  nodes: ChatNode[];       // ノードの配列
}

// チャットメッセージ（UI表示用）
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

#### 主要アルゴリズム

**1. ボトムアップ木構造レイアウト**
```typescript
// 各ノードの必要幅を葉ノードから計算
const calculateNodeWidths = (nodes: ChatNode[]): Map<string, number> => {
  const widths = new Map<string, number>();
  const baseWidth = 320;
  
  // 深い階層から浅い階層へ処理
  const sortedByDepth = nodes.sort((a, b) => 
    getNodeLevel(b.id, nodes) - getNodeLevel(a.id, nodes)
  );
  
  sortedByDepth.forEach(node => {
    const children = nodes.filter(n => n.parentId === node.id);
    if (children.length === 0) {
      widths.set(node.id, baseWidth); // 葉ノード
    } else {
      // 内部ノード: 子ノードの幅の合計
      const childrenWidth = children.reduce((sum, child) => 
        sum + (widths.get(child.id) || baseWidth), 0
      );
      widths.set(node.id, childrenWidth);
    }
  });
  
  return widths;
};
```

**2. パス取得アルゴリズム**
```typescript
// 選択ノードからルートまでの会話パスを取得
const getPathToRoot = (nodeId: string, nodes: ChatNode[]): ChatNode[] => {
  const path: ChatNode[] = [];
  let currentId: string | null = nodeId;
  
  while (currentId) {
    const node = nodes.find(n => n.id === currentId);
    if (!node) break;
    path.unshift(node);  // 先頭に挿入してルートから順に
    currentId = node.parentId;
  }
  
  return path;
};
```

**3. メッセージ変換アルゴリズム**
```typescript
// ノードパスをチャットメッセージ形式に変換
const pathToMessages = (path: ChatNode[]): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  
  path.forEach(node => {
    messages.push({ role: 'user', content: node.question });
    messages.push({ role: 'assistant', content: node.answer });
  });
  
  return messages;
};
```

#### Claude API統合の実装

**1. APIサービス設計**
```typescript
export class ClaudeApiService {
  private client: Anthropic | null = null;

  setApiKey(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true  // クライアントサイド実行許可
    });
  }

  async sendMessage(
    messages: ClaudeMessage[], 
    model: string = 'claude-3-5-sonnet-20241022', 
    settings: ApiSettings = {}
  ): Promise<string> {
    const {
      temperature = 0.7,
      maxTokens = 1024,
      topP = 0.9
    } = settings;

    const response = await this.client.messages.create({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: topP,
      messages: messages
    });
    // レスポンス処理...
  }
}
```

**2. 段階的ノード作成とUI一貫性**
```typescript
const handleSendMessage = async (question: string, model: string, settings: ApiSettings) => {
  // 1. 質問のみのノードを即座に作成・表示
  const tempNode = createNewNode(question, "", parentId, model, settings);
  updateConversationState(tempNode); // 即座に画面更新
  
  // 2. ローディング開始
  setIsLoading(true);
  
  // 3. API呼び出し（質問は既に見える状態）
  const answer = await claudeApiService.sendMessage(messages, model, settings);
  
  // 4. 同じノードに回答を追加
  const finalNode = { ...tempNode, answer };
  updateConversationState(finalNode);
  
  setIsLoading(false);
};
```

**3. コンテキスト管理**
- 選択したノードまでの会話履歴をClaude APIに送信
- API呼び出し時に完全なコンテキストを保持
- 分岐作成時も適切な親子関係を維持
- モデル・パラメータ情報の永続化

### 🎯 UXの工夫

#### 1. 直感的な操作フロー
1. 左サイドバーで会話を選択
2. 中央の木構造でノードを選択
3. 右パネルで会話履歴を確認
4. 新しい質問で分岐を作成

#### 2. 視覚的フィードバック
- **選択状態**: 現在のノードを青色でハイライト
- **API状態**: 右上にAPI接続状況を表示
- **ローディング**: 送信中のバウンスアニメーション
- **モデル情報**: 各回答にモデル名とパラメータを表示
- **会話状態**: 各会話の最終更新日時を表示
- **自動スクロール**: 新しいメッセージへの滑らかなスクロール

#### 3. エラー処理とユーザビリティ
- APIキー未設定時の分かりやすいメッセージ
- ネットワークエラー時の適切なエラー表示
- 送信中のUI無効化で重複送信防止
- 折りたたみ式設定UIでコンパクトな表示
- 段階的メッセージ表示で一貫性のあるUX

### 📊 パフォーマンス最適化

#### 1. React最適化
- `useMemo`による計算結果のメモ化
- 適切な依存配列でのre-render最小化
- コンポーネントの責務分離

#### 2. データ管理
- ローカルストレージによる高速データアクセス
- リアルタイム保存でデータ損失防止
- 効率的な状態更新パターン

#### 3. 木構造レイアウト最適化
- ボトムアップ幅計算で効率的なレイアウト
- サブツリー幅の動的計算でノード重複を防止
- O(n)での最適配置アルゴリズム

## セキュリティ考慮事項

### APIキー管理
- APIキーはブラウザのローカルストレージに保存
- プロジェクトファイルには含まれず、Git管理外
- クライアントサイドでの直接API呼び出し（注意：本番環境では要検討）

### データプライバシー
- 全ての会話データはローカルのブラウザに保存
- 外部サーバーへの会話内容送信はClaude API以外なし
- ユーザーがAPIキーと会話データを完全に制御

## 今後の拡張予定

### 🚀 次期機能
1. **木構造レイアウト最適化**
   - 自動ノード配置アルゴリズム
   - ズーム・パン機能の改善

2. **エクスポート・インポート機能**
   - JSON形式での会話データ export/import
   - 他のユーザーとの会話共有

3. **検索・フィルタリング機能**
   - ノード内容の全文検索
   - 日付範囲、キーワードでのフィルタリング

### 💡 将来的な拡張
- **マルチAI対応**: OpenAI GPT、Google Bard等の統合
- **コラボレーション機能**: 複数ユーザーでの会話共有
- **高度な分析**: 会話パターン分析、トークン使用量可視化
- **モバイル最適化**: タッチ操作対応、レスポンシブデザイン

## 技術スタック詳細

### フロントエンド
- **React 19**: UIライブラリ
- **TypeScript**: 型安全性とDX向上
- **Tailwind CSS**: ユーティリティファーストCSS
- **React Flow**: インタラクティブな木構造可視化

### API統合
- **@anthropic-ai/sdk**: Claude API公式SDK
- **Claude-3-Sonnet**: 高品質な会話生成

### 開発・ビルド
- **Create React App**: 開発環境とビルド設定
- **npm**: パッケージ管理

## 開発方法

### 基本セットアップ
```bash
# リポジトリのクローン
git clone [repository-url]
cd treechats

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start
```

### Claude API設定
1. [Anthropic Console](https://console.anthropic.com/)でAPIキーを取得
2. アプリケーション左下の「API設定」からキーを設定
3. 設定完了後、実際のClaude AIと会話可能

### ビルドとデプロイ
```bash
# プロダクションビルド
npm run build

# 静的ファイルサーバーでの確認
npx serve -s build
```

## プロジェクト哲学

TreeChatsは「会話の可視化による思考の整理」をコンセプトに開発されています：

- **非線形思考の支援**: 一本道の会話ではなく、様々な方向性を並行して探索
- **コンテキストの明確化**: 現在の議論がどの文脈から生まれたかを常に把握
- **効率的な対話**: 過去の分岐点に戻って新しい質問を展開
- **思考プロセスの保存**: 試行錯誤の過程も含めた完全な思考履歴の保持

## 貢献方法

プロジェクトへの貢献を歓迎します：

1. **Issue報告**: バグや改善提案をGitHub Issuesに投稿
2. **機能提案**: 新機能のアイデアをDiscussionで共有
3. **プルリクエスト**: コード改善やバグ修正のPR歓迎
4. **ドキュメント改善**: README、コメントの改善提案

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

**開発者**: TreeChatsチーム  
**最終更新**: 2024年12月  
**バージョン**: 1.0.0