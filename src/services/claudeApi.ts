import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ApiSettings {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export class ClaudeApiService {
  private client: Anthropic | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true // クライアントサイドでの実行を許可
      });
    }
  }

  setApiKey(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async sendMessage(
    messages: ClaudeMessage[], 
    model: string = 'claude-sonnet-4-20250514', 
    settings: ApiSettings = {}
  ): Promise<string> {
    if (!this.client) {
      throw new Error('APIキーが設定されていません');
    }

    try {
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
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      if (response.content && response.content.length > 0) {
        const firstContent = response.content[0];
        if (firstContent.type === 'text') {
          return firstContent.text;
        }
      }

      throw new Error('予期しない応答形式です');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Claude API エラー: ${error.message}`);
      }
      throw new Error('Claude API で予期しないエラーが発生しました');
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }
}

export const claudeApiService = new ClaudeApiService();