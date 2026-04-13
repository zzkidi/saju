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
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingBudget: 0 },
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

  function* parseLines(raw: string) {
    const lines = raw.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const json = JSON.parse(data);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch {
          // skip malformed
        }
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lastNewline = buffer.lastIndexOf('\n');
    if (lastNewline === -1) continue; // 완전한 줄이 없으면 대기

    const complete = buffer.slice(0, lastNewline);
    buffer = buffer.slice(lastNewline + 1);

    for (const text of parseLines(complete)) {
      yield text;
    }
  }

  // 마지막 버퍼에 남은 데이터 처리 (잘림 방지)
  if (buffer.trim()) {
    for (const text of parseLines(buffer)) {
      yield text;
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
