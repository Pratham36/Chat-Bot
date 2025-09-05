// app/page.tsx
import React from 'react';
import ChatWindow from '../components/ChatWindow';

export default function Page() {
  // api is relative (/api/chat). If you host under a subpath, set apiBase accordingly.
  return (
    <main style={{ padding: 24 }}>
      <header style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1>TechSurf — Chat Agent (Next.js)</h1>
        <p style={{ opacity: 0.8 }}>Provider-agnostic chat agents grounded in Contentstack.</p>
      </header>

      <ChatWindow apiBase={''} contentQueryHint={'tours italy'} />
    </main>
  );
}
