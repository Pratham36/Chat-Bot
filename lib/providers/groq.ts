// lib/providers/groq.ts
import { ProviderAdapter } from './base';

export function GroqProvider(apiKey: string): ProviderAdapter {
  return {
    name: 'groq',
    async streamCompletion(opts, onToken) {
      if (!apiKey) throw new Error('GROQ_API_KEY not set on server');

      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: opts.model, messages: opts.messages, stream: true }),
        signal: opts.signal
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(`Groq error: ${res.status} ${text}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === 'data: [DONE]' || trimmed === '[DONE]') return;
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const parsed = JSON.parse(jsonStr);
            const token = parsed?.choices?.[0]?.delta?.content;
            if (token) onToken(token);
          } catch {
            // ignore partial JSON parse errors
          }
        }
      }
    }
  };
}
