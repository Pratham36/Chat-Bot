// components/ChatWindow.tsx
'use client';
import React, { useState } from 'react';
import { useChatAgent } from './useChatAgent';

export default function ChatWindow({
  apiBase,
  contentQueryHint
}: {
  apiBase?: string;
  contentQueryHint?: string;
}) {
  const { messages, sendMessage, loading, reset } = useChatAgent({ apiBase });
  const [input, setInput] = useState('');

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Chat Agent</h3>
        <button onClick={reset} style={{ fontSize: 12 }}>
          Reset
        </button>
      </div>

      <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, height: 360, overflow: 'auto' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '8px 0' }}>
            <strong style={{ color: m.role === 'user' ? '#2b6cb0' : '#1a202c' }}>
              {m.role === 'user' ? 'You' : 'Agent'}:
            </strong>{' '}
            <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
          </div>
        ))}
        {loading && <div style={{ opacity: 0.6 }}>…</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = input.trim();
          if (!q) return;
          setInput('');
          void sendMessage(q, contentQueryHint);
        }}
        style={{ display: 'flex', gap: 8, marginTop: 12 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything… (e.g. Show tours in Italy)"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '10px 14px' }}>
          Send
        </button>
      </form>
    </div>
  );
}
