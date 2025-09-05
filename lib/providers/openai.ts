// lib/providers/openai.ts
import { ProviderAdapter, Message } from './base';

export function OpenAIProvider(apiKey: string): ProviderAdapter {
  return {
    name: 'openai',
    async streamCompletion(opts, onToken) {
      if (!apiKey) throw new Error('OPENAI_API_KEY not set on server');

      const url = 'https://api.openai.com/v1/chat/completions';
      const payload = {
        model: opts.model,
        messages: opts.messages,
        stream: true
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: opts.signal
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(`OpenAI error: ${res.status} ${text}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // OpenAI streams lines like: data: {...}\n\ndata: [DONE]\n\n
        const lines = chunk.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === 'data: [DONE]' || trimmed === '[DONE]') {
            return;
          }
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed?.choices?.[0]?.delta;
            const token = delta?.content;
            if (token) onToken(token);
          } catch {
            // ignore parse errors of partial chunks
          }
        }
      }
    }
  };
}
