const API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';

export async function* streamGemini(
  apiKey: string,
  prompt: string
): AsyncGenerator<string> {
  const res = await fetch(`${API_URL}?key=${apiKey}&alt=sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop()!;

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const json = JSON.parse(data);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch {
          // skip malformed chunks
        }
      }
    }
  }
}

// 빌드 시 주입된 키 우선, 없으면 localStorage fallback
const BUILT_IN_KEY = process.env.NEXT_PUBLIC_GEMINI_KEY ?? '';

export function getStoredApiKey(): string | null {
  if (BUILT_IN_KEY) return BUILT_IN_KEY;
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gemini_api_key');
}

export function setStoredApiKey(key: string) {
  localStorage.setItem('gemini_api_key', key);
}

export function removeStoredApiKey() {
  localStorage.removeItem('gemini_api_key');
}
