// lib/providers/base.ts
export type Message = { role: 'system' | 'user' | 'assistant'; content: string };

export interface ProviderAdapter {
  name: string;
  streamCompletion(
    opts: { model: string; messages: Message[]; signal?: AbortSignal },
    onToken: (token: string) => void
  ): Promise<void>;
}
