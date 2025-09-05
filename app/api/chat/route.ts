// app/api/chat/route.ts
import { NextRequest } from 'next/server';
import { OpenAIProvider } from '../../../lib/providers/openai';
import { GroqProvider } from '../../../lib/providers/groq';
import { getEntries } from '../../../lib/contentstack';

type ProviderName = 'openai' | 'groq';
type HistoryItem = { role: 'user' | 'assistant' | 'system'; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      provider?: ProviderName;
      model?: string;
      query: string;
      contentstack?: { contentType?: string; locale?: string };
      history?: HistoryItem[];
    };

    if (!body?.query || typeof body.query !== 'string') {
      return new Response(JSON.stringify({ error: 'query is required' }), { status: 400 });
    }
    if (body.query.length > 8000) {
      return new Response(JSON.stringify({ error: 'query too long' }), { status: 400 });
    }

    const providerName = (body.provider || process.env.DEFAULT_PROVIDER || 'openai') as ProviderName;
    const model =
      body.model ||
      (providerName === 'groq'
        ? 'llama-3.3-70b-versatile'
        : 'gpt-4o-mini');

    const providers = {
      openai: OpenAIProvider(process.env.OPENAI_API_KEY || ''),
      groq: GroqProvider(process.env.GROQ_API_KEY || '')
    } as const;

    const provider = providers[providerName];
    if (!provider) {
      return new Response(JSON.stringify({ error: 'unknown provider' }), { status: 400 });
    }

    // --- Contentstack grounding (optional) ---
    let domainContext = '';
    if (body.contentstack?.contentType) {
      try {
        const entries = await getEntries(
          body.contentstack.contentType,
          body.contentstack.locale || 'en-us'
        );

        if (entries.length) {
          domainContext =
            `Relevant content from Contentstack (${entries.length} entries):\n` +
            entries
              .slice(0, 5)
              .map((it: { title?: string; description?: string }, i: number) => `(${i + 1}) ${it.title || ''}: ${it.description || ''}`)
              .join('\n');
        }
      } catch (err) {
        console.warn('Contentstack fetch failed', err);
      }
    }

    // --- Prompt construction ---
    const systemPrompt =
      `You are a domain-aware assistant. Prefer the provided Contentstack context when answering. ` +
      `If the context is insufficient, answer concisely and suggest a clarifying question.`;

    const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...(body.history || []),
      {
        role: 'user',
        content: domainContext
          ? `${domainContext}\n\nUser: ${body.query}`
          : body.query
      }
    ];

    // --- Streaming back tokens ---
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await provider.streamCompletion(
            { model, messages },
            (token: string) => {
              controller.enqueue(encoder.encode(token));
            }
          );
          controller.close();
        } catch (err) {
          const msg = `[error] ${(err as Error).message || 'unknown'}`;
          controller.enqueue(encoder.encode(msg));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-transform'
      }
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message || 'unknown' }),
      { status: 500 }
    );
  }
}
