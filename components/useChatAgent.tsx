// components/useChatAgent.tsx
'use client';
import { useCallback, useRef, useState } from 'react';

export type Message = { role: 'user' | 'assistant'; content: string };

export function useChatAgent(opts?: { apiBase?: string }) {
  const apiBase = opts?.apiBase || '';
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string, contentQuery?: string) => {
      setMessages((m) => [...m, { role: 'user', content: text }]);
      setLoading(true);

      // build request payload (history includes previous messages)
      const body = {
        query: text,
        contentstack: contentQuery ? { query: contentQuery } : undefined,
        history: messages.map((m) => ({ role: m.role, content: m.content }))
      };

      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      const res = await fetch(`${apiBase || ''}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controllerRef.current.signal
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        setLoading(false);
        setMessages((m) => [...m, { role: 'assistant', content: `Error: ${text}` }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistant = '';

      // streaming loop
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistant += chunk;
        setMessages((m) => {
          // replace or append assistant chunk
          const last = m[m.length - 1];
          if (last?.role === 'assistant') {
            const copy = [...m];
            copy[copy.length - 1] = { role: 'assistant', content: assistant };
            return copy;
          } else {
            return [...m, { role: 'assistant', content: assistant }];
          }
        });
      }

      setLoading(false);
    },
    [apiBase, messages]
  );

  const reset = useCallback(() => setMessages([]), []);

  return { messages, sendMessage, loading, reset };
}
