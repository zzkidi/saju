'use client';

import { useEffect, useRef, useState } from 'react';
import { calculateSaju } from '@/lib/saju';
import { calculateAstrology, SIGN_KOREAN, SIGN_EMOJI } from '@/lib/astrology';
import type { AstrologyResult } from '@/lib/astrology';
import {
  generateSajuReading,
  generateAstroReading,
  generateSajuPersona,
  generateAstroPersona,
  generateMbtiPersona,
} from '@/lib/reading';
import { buildSystemPrompt } from '@/lib/prompt';
import {
  streamGeminiChat,
  getStoredApiKey,
  setStoredApiKey,
  type GeminiMessage,
} from '@/lib/gemini';
import { REGION_MAP, REGIONS, DEFAULT_REGION } from '@/lib/regions';
import { formatPillarKo } from '@/lib/format';
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJI,
  CATEGORY_ORDER,
  CATEGORY_PROMPTS,
  STEM_KOREAN,
  STEM_WUXING,
  MBTI_GROUPS,
  type SajuResult,
  type Category,
  type MbtiType,
  type MbtiBase,
  type MbtiVariant,
} from '@/lib/types';

type MessageKind = 'user' | 'ai' | 'saju' | 'astro' | 'mbti' | 'system';
type Message = { kind: MessageKind; text: string };

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export default function Page() {
  const [stage, setStage] = useState<'input' | 'result'>('input');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('F');
  const [region, setRegion] = useState<string>(DEFAULT_REGION);
  const [mbtiBase, setMbtiBase] = useState<MbtiBase | ''>('');
  const [mbtiVariant, setMbtiVariant] = useState<MbtiVariant>('A');

  const [saju, setSaju] = useState<SajuResult | null>(null);
  const [astro, setAstro] = useState<AstrologyResult | null>(null);
  const [savedMbti, setSavedMbti] = useState<MbtiType | null>(null);
  const [savedGender, setSavedGender] = useState<'M' | 'F'>('F');

  const [messages, setMessages] = useState<Message[]>([]);
  const [geminiHistory, setGeminiHistory] = useState<GeminiMessage[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [used, setUsed] = useState<Set<Category>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // API key
  const [apiKey, setApiKey] = useState<string>('');
  const [keyInput, setKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    const k = getStoredApiKey();
    if (k) setApiKey(k);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function handleSaveKey() {
    const trimmed = keyInput.trim();
    if (trimmed) {
      setStoredApiKey(trimmed);
      setApiKey(trimmed);
      setKeyInput('');
      setShowKeyInput(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!birthDate || !birthTime || busy) return;
    const [y, m, d] = birthDate.split('-').map(Number);
    const [h, mi] = birthTime.split(':').map(Number);
    const reg = REGION_MAP[region] ?? REGION_MAP[DEFAULT_REGION];

    const sajuResult = calculateSaju(y, m, d, h, mi, reg.offsetMinutes);
    const astroResult = calculateAstrology(y, m, d, h, mi, reg.latitude, reg.longitude);
    const mbtiVal: MbtiType | null = mbtiBase
      ? (`${mbtiBase}-${mbtiVariant}` as MbtiType)
      : null;

    setSaju(sajuResult);
    setAstro(astroResult);
    setSavedMbti(mbtiVal);
    setSavedGender(gender);
    setStage('result');
    setUsed(new Set());
    setMessages([]);
    setGeminiHistory([]);
    setBusy(true);

    const sysPrompt = buildSystemPrompt(sajuResult, astroResult, mbtiVal, gender);
    setSystemPrompt(sysPrompt);

    // 요약 카드
    const summary = `🔮 ${sajuResult.day.ganzhi}(${formatPillarKo(sajuResult.day)}) 일주\n✨ ${SIGN_KOREAN[astroResult.sun]} ${SIGN_EMOJI[astroResult.sun]} / 🌙 ${SIGN_KOREAN[astroResult.moon]} ${SIGN_EMOJI[astroResult.moon]} / ⬆️ ${SIGN_KOREAN[astroResult.ascendant]} ${SIGN_EMOJI[astroResult.ascendant]}${mbtiVal ? ` / 🧠 ${mbtiVal}` : ''}`;
    setMessages([{ kind: 'system', text: summary }]);

    // 자동으로 총운 분석 요청
    await sleep(300);
    await sendMessage('나에 대해 전체적으로 분석해줘', sysPrompt);
    setBusy(false);
  }

  // === 공통 메시지 전송 (카테고리 버튼 + 자유 입력 통합) ===
  async function sendMessage(userText: string, overrideSystemPrompt?: string) {
    if (!userText.trim()) return;
    setBusy(true);

    // 유저 버블
    setMessages((prev) => [...prev, { kind: 'user', text: userText }]);

    const newUserMsg: GeminiMessage = { role: 'user', parts: [{ text: userText }] };
    const updatedHistory = [...geminiHistory, newUserMsg];

    if (apiKey) {
      setIsTyping(true);
      const sp = overrideSystemPrompt || systemPrompt;
      try {
        let responseText = '';
        let firstChunk = true;
        for await (const chunk of streamGeminiChat(apiKey, sp, updatedHistory)) {
          responseText += chunk;
          if (firstChunk) {
            setIsTyping(false);
            setMessages((prev) => [...prev, { kind: 'ai', text: chunk }]);
            firstChunk = false;
          } else {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, text: last.text + chunk };
              return updated;
            });
          }
        }
        if (firstChunk) {
          setIsTyping(false);
          setMessages((prev) => [...prev, { kind: 'ai', text: '(응답 없음)' }]);
        }
        // 히스토리 업데이트
        const aiMsg: GeminiMessage = { role: 'model', parts: [{ text: responseText }] };
        setGeminiHistory([...updatedHistory, aiMsg]);
      } catch {
        setIsTyping(false);
        setMessages((prev) => [...prev, { kind: 'ai', text: '(AI 연결 실패 — 다시 시도해봐)' }]);
        setGeminiHistory(updatedHistory);
      }
    } else {
      // 정적 fallback (API 키 없을 때)
      setIsTyping(true);
      await sleep(800);
      setIsTyping(false);
      if (saju && astro) {
        const sajuP = generateSajuPersona(saju);
        setMessages((prev) => [...prev, { kind: 'saju', text: sajuP }]);
      }
    }
    setBusy(false);
  }

  function handleCategoryClick(cat: Category) {
    if (busy) return;
    setUsed((prev) => new Set(prev).add(cat));
    sendMessage(`${CATEGORY_LABELS[cat]} 분석해줘`);
  }

  function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || busy) return;
    const text = chatInput.trim();
    setChatInput('');
    sendMessage(text);
  }

  function handleReset() {
    setStage('input');
    setSaju(null);
    setAstro(null);
    setSavedMbti(null);
    setMessages([]);
    setGeminiHistory([]);
    setSystemPrompt('');
    setUsed(new Set());
    setIsTyping(false);
    setBusy(false);
    setChatInput('');
  }

  if (stage === 'input') {
    return (
      <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-purple-100 via-pink-50 to-amber-50 px-4 py-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-3 text-5xl">🔮✨</div>
            <h1 className="text-3xl font-extrabold text-purple-900">사주 &amp; 별자리</h1>
            <p className="mt-2 text-sm text-purple-600">
              사주 + 점성술 + MBTI 종합 해석
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full space-y-5 rounded-3xl bg-white/80 p-5 shadow-xl ring-1 ring-purple-100 backdrop-blur"
          >
            <div>
              <label className="mb-2 block text-xs font-semibold text-purple-700">
                생년월일 (양력)
              </label>
              <input
                type="date"
                required
                min="1900-01-01"
                max="2099-12-31"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="block w-full min-w-0 max-w-full appearance-none rounded-2xl border border-purple-100 bg-white px-4 py-3 text-base text-gray-800 focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-purple-700">
                태어난 시간
              </label>
              <input
                type="time"
                required
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="block w-full min-w-0 max-w-full appearance-none rounded-2xl border border-purple-100 bg-white px-4 py-3 text-base text-gray-800 focus:border-purple-400 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-purple-400">
                시간 모르면 12:00 근처로 넣어봐
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-purple-700">성별</label>
              <div className="flex gap-3">
                {(['F', 'M'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 rounded-2xl py-3 text-sm font-bold transition active:scale-95 ${
                      gender === g
                        ? g === 'F'
                          ? 'bg-pink-400 text-white shadow-md'
                          : 'bg-blue-400 text-white shadow-md'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {g === 'F' ? '여성' : '남성'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-purple-700">출생 지역</label>
              <div className="grid grid-cols-3 gap-2">
                {REGIONS.map((r) => (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => setRegion(r.name)}
                    className={`rounded-2xl py-2.5 text-xs font-bold transition active:scale-95 ${
                      region === r.name
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md'
                        : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-purple-700">
                MBTI <span className="text-purple-400">(선택)</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {MBTI_GROUPS.map((group, gi) => {
                  const rowBg = ['bg-purple-50', 'bg-emerald-50', 'bg-sky-50', 'bg-amber-50'];
                  const rowActive = [
                    'from-purple-500 to-pink-500',
                    'from-emerald-500 to-teal-500',
                    'from-sky-500 to-blue-500',
                    'from-amber-500 to-orange-500',
                  ];
                  const rowText = [
                    'text-purple-700',
                    'text-emerald-700',
                    'text-sky-700',
                    'text-amber-700',
                  ];
                  return group.bases.map((base) => {
                    const active = mbtiBase === base;
                    return (
                      <button
                        key={base}
                        type="button"
                        onClick={() =>
                          setMbtiBase((prev) => (prev === base ? '' : base))
                        }
                        className={`rounded-xl py-2 text-[11px] font-extrabold transition active:scale-95 ${
                          active
                            ? `bg-gradient-to-br ${rowActive[gi]} text-white shadow-md`
                            : `${rowBg[gi]} ${rowText[gi]}`
                        }`}
                      >
                        {base}
                      </button>
                    );
                  });
                })}
              </div>
              {mbtiBase && (
                <div className="mt-2 flex gap-2">
                  {(['A', 'T'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setMbtiVariant(v)}
                      className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition active:scale-95 ${
                        mbtiVariant === v
                          ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md'
                          : 'bg-pink-50 text-pink-500'
                      }`}
                    >
                      -{v} {v === 'A' ? '확신형' : '신중형'}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-1 text-[11px] text-purple-400">
                {mbtiBase ? `선택: ${mbtiBase}-${mbtiVariant}` : 'MBTI 모르면 비우고 넘어가도 돼요'}
              </p>
            </div>

            {/* AI 키 설정 — 빌드 키 있으면 숨김 */}
            {!apiKey && (
              <div className="rounded-2xl bg-purple-50/60 p-3">
                <button
                  type="button"
                  onClick={() => setShowKeyInput(true)}
                  className="w-full text-left text-xs font-semibold text-purple-500"
                >
                  🔑 AI 종합 해석 키 직접 입력 (선택)
                </button>
                {showKeyInput && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="password"
                      placeholder="Gemini API Key"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveKey}
                      className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white"
                    >
                      저장
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 py-4 text-base font-bold text-white shadow-lg active:scale-95 disabled:opacity-60"
            >
              운세 뽑기 ✨
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-purple-400">
            재미로 보는 운세입니다. 중요한 결정은 본인 판단 💜
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-purple-100 via-pink-50 to-amber-50">
      {/* Top card */}
      <div className="sticky top-0 z-10 border-b border-purple-100 bg-white/90 px-4 pt-3 pb-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold text-purple-500">
              {saju?.day.ganzhi}({formatPillarKo(saju!.day)}) 일주
              {savedMbti && <span className="ml-1 text-pink-500">· {savedMbti}</span>}
            </h2>
            <button
              onClick={handleReset}
              disabled={busy}
              className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-bold text-purple-700 active:scale-95 disabled:opacity-50"
            >
              다시
            </button>
          </div>

          {saju && (
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '시', p: saju.hour },
                { label: '일', p: saju.day },
                { label: '월', p: saju.month },
                { label: '연', p: saju.year },
              ].map(({ label, p }) => (
                <div
                  key={label}
                  className="rounded-xl bg-gradient-to-b from-purple-50 to-pink-50 p-1.5 text-center ring-1 ring-purple-100"
                >
                  <div className="text-[9px] font-semibold text-purple-400">{label}주</div>
                  <div className="text-base font-extrabold leading-tight text-purple-900">
                    {p.ganzhi}
                  </div>
                  <div className="text-[9px] text-purple-500">{formatPillarKo(p)}</div>
                </div>
              ))}
            </div>
          )}

          {astro && (
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {[
                { label: '해', sign: astro.sun },
                { label: '달', sign: astro.moon },
                { label: '상승', sign: astro.ascendant },
              ].map(({ label, sign }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-50 to-amber-50 p-1.5 ring-1 ring-pink-100"
                >
                  <span className="text-lg">{SIGN_EMOJI[sign]}</span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="text-[9px] font-semibold text-pink-400">{label}</div>
                    <div className="truncate text-[11px] font-bold text-pink-800">
                      {SIGN_KOREAN[sign]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-40">
        <div className="mx-auto max-w-md space-y-3">
          {messages.map((m, i) => {
            if (m.kind === 'user') {
              return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 px-4 py-3 text-sm font-medium leading-relaxed text-white shadow-md">
                    {m.text}
                  </div>
                </div>
              );
            }
            if (m.kind === 'system') {
              return (
                <div key={i} className="flex justify-center">
                  <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl bg-purple-50 px-4 py-2 text-center text-[11px] font-semibold leading-relaxed text-purple-600">
                    {m.text}
                  </div>
                </div>
              );
            }
            // ai, saju, astro, mbti — all left-aligned bot bubbles
            const isAi = m.kind === 'ai';
            return (
              <div key={i} className="flex justify-start">
                <div
                  className={`max-w-[90%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ring-1 ${
                    isAi
                      ? 'bg-gradient-to-br from-white to-purple-50 text-gray-800 ring-purple-200'
                      : 'bg-white text-gray-800 ring-purple-100'
                  }`}
                >
                  {m.text || (isAi ? '...' : '')}
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-3xl bg-white px-4 py-3 shadow-sm ring-1 ring-purple-100">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Bottom bar: category chips + text input */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-purple-100 bg-white/95 px-4 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto max-w-md">
          {/* 카테고리 가로 스크롤 */}
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 py-2 scrollbar-hide">
            {CATEGORY_ORDER.map((cat) => {
              const isUsed = used.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  disabled={busy}
                  className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95 disabled:opacity-50 ${
                    isUsed
                      ? 'bg-purple-50 text-purple-400'
                      : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800'
                  }`}
                >
                  <span>{CATEGORY_EMOJI[cat]}</span>
                  <span>{CATEGORY_LABELS[cat]}</span>
                </button>
              );
            })}
          </div>
          {/* 자유 텍스트 입력 */}
          <form onSubmit={handleChatSubmit} className="flex gap-2 pb-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="추가로 궁금한 거 물어봐..."
              disabled={busy}
              className="min-w-0 flex-1 rounded-full border border-purple-100 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-purple-300 focus:border-purple-400 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={busy || !chatInput.trim()}
              className="shrink-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2.5 text-sm font-bold text-white shadow-md active:scale-95 disabled:opacity-40"
            >
              전송
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
