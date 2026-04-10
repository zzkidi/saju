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

type MessageKind = 'user' | 'saju' | 'astro' | 'mbti' | 'system';
type Message = { kind: MessageKind; text: string };

const INTRO_SAJU = [
  '🔮 사주부터 한번 볼까...',
  '🔮 잠깐, 사주 먼저 풀어볼게',
  '🔮 사주로 보면 말이야...',
];
const BRIDGE_ASTRO = [
  '✨ 그리고 별자리로는 이렇게 보여',
  '✨ 별자리 쪽도 한번 볼까?',
  '✨ 점성술 관점에서도 재밌는 게 나오는데',
];

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

  const [messages, setMessages] = useState<Message[]>([]);
  const [used, setUsed] = useState<Set<Category>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
    setStage('result');
    setUsed(new Set());
    setMessages([]);
    setBusy(true);

    // === 첫 공개 시퀀스 ===
    await sleep(300);
    const summary = `운세 뽑았어! 반가워 😌\n\n🔮 사주 일간: ${STEM_KOREAN[sajuResult.day.stem]}${STEM_WUXING[sajuResult.day.stem]}(${sajuResult.day.stem})\n✨ 태양: ${SIGN_KOREAN[astroResult.sun]} ${SIGN_EMOJI[astroResult.sun]}\n🌙 달: ${SIGN_KOREAN[astroResult.moon]} ${SIGN_EMOJI[astroResult.moon]}\n⬆️ 상승: ${SIGN_KOREAN[astroResult.ascendant]} ${SIGN_EMOJI[astroResult.ascendant]}${mbtiVal ? `\n🧠 MBTI: ${mbtiVal}` : ''}`;
    setMessages([{ kind: 'saju', text: summary }]);

    await sleep(800);
    setIsTyping(true);
    await sleep(1000);
    setIsTyping(false);
    const sajuPersona = generateSajuPersona(sajuResult);
    setMessages((prev) => [
      ...prev,
      {
        kind: 'saju',
        text: `🔮 사주로 본 너라는 사람\n\n${sajuPersona}`,
      },
    ]);

    await sleep(900);
    setIsTyping(true);
    await sleep(1000);
    setIsTyping(false);
    const astroPersona = generateAstroPersona(astroResult);
    setMessages((prev) => [
      ...prev,
      {
        kind: 'astro',
        text: `✨ 별자리로 본 너의 분위기\n\n${astroPersona}`,
      },
    ]);

    if (mbtiVal) {
      await sleep(900);
      setIsTyping(true);
      await sleep(1000);
      setIsTyping(false);
      const mbtiPersona = generateMbtiPersona(mbtiVal);
      setMessages((prev) => [
        ...prev,
        {
          kind: 'mbti',
          text: `🧠 MBTI ${mbtiVal}로 본 너\n\n${mbtiPersona}`,
        },
      ]);
    }

    await sleep(700);
    setMessages((prev) => [
      ...prev,
      {
        kind: 'system',
        text: '이제 궁금한 카테고리 골라봐 👇',
      },
    ]);
    setBusy(false);
  }

  async function handleCategoryClick(cat: Category) {
    if (!saju || !astro || busy) return;
    setBusy(true);

    // 1. user bubble
    setMessages((prev) => [
      ...prev,
      { kind: 'user', text: `${CATEGORY_EMOJI[cat]} ${pick(CATEGORY_PROMPTS[cat])}` },
    ]);
    await sleep(500);

    // 2. saju intro
    setIsTyping(true);
    await sleep(800);
    setIsTyping(false);
    setMessages((prev) => [...prev, { kind: 'saju', text: pick(INTRO_SAJU) }]);
    await sleep(600);

    // 3. saju reading
    setIsTyping(true);
    await sleep(1000);
    setIsTyping(false);
    const sajuText = generateSajuReading(saju, cat);
    setMessages((prev) => [...prev, { kind: 'saju', text: sajuText }]);
    await sleep(700);

    // 4. bridge to astro
    setIsTyping(true);
    await sleep(700);
    setIsTyping(false);
    setMessages((prev) => [...prev, { kind: 'astro', text: pick(BRIDGE_ASTRO) }]);
    await sleep(600);

    // 5. astro reading
    setIsTyping(true);
    await sleep(1000);
    setIsTyping(false);
    const astroText = generateAstroReading(astro, cat);
    setMessages((prev) => [...prev, { kind: 'astro', text: astroText }]);

    setUsed((prev) => new Set(prev).add(cat));
    setBusy(false);
  }

  function handleReset() {
    setStage('input');
    setSaju(null);
    setAstro(null);
    setSavedMbti(null);
    setMessages([]);
    setUsed(new Set());
    setIsTyping(false);
    setBusy(false);
    // 입력 값은 유지 (MBTI/지역 계속 쓰게)
  }

  if (stage === 'input') {
    return (
      <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-purple-100 via-pink-50 to-amber-50 px-4 py-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-3 text-5xl">🔮✨</div>
            <h1 className="text-3xl font-extrabold text-purple-900">사주 &amp; 별자리</h1>
            <p className="mt-2 text-sm text-purple-600">
              생년월일시 하나로 사주 + 점성술 + MBTI 종합 해석
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
                시간 모르면 12:00 근처로 넣어봐 (시주·상승궁 정확도는 떨어짐)
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-purple-700">성별</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setGender('F')}
                  className={`flex-1 rounded-2xl py-3 text-sm font-bold transition active:scale-95 ${
                    gender === 'F'
                      ? 'bg-pink-400 text-white shadow-md'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  여성
                </button>
                <button
                  type="button"
                  onClick={() => setGender('M')}
                  className={`flex-1 rounded-2xl py-3 text-sm font-bold transition active:scale-95 ${
                    gender === 'M'
                      ? 'bg-blue-400 text-white shadow-md'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  남성
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-purple-700">
                출생 지역 <span className="text-purple-400">(보정 + 상승궁)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {REGIONS.map((r) => {
                  const active = region === r.name;
                  return (
                    <button
                      key={r.name}
                      type="button"
                      onClick={() => setRegion(r.name)}
                      className={`rounded-2xl py-2.5 text-xs font-bold transition active:scale-95 ${
                        active
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md'
                          : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      {r.name}
                    </button>
                  );
                })}
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

              <div className="mt-2">
                <div className="mb-1 text-[10px] font-semibold text-purple-400">
                  변형 (A: 확신형 / T: 신중형)
                </div>
                <div className="flex gap-2">
                  {(['A', 'T'] as const).map((v) => {
                    const active = mbtiVariant === v;
                    const disabled = !mbtiBase;
                    return (
                      <button
                        key={v}
                        type="button"
                        disabled={disabled}
                        onClick={() => setMbtiVariant(v)}
                        className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition active:scale-95 ${
                          disabled
                            ? 'bg-gray-50 text-gray-300'
                            : active
                            ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md'
                            : 'bg-pink-50 text-pink-500'
                        }`}
                      >
                        -{v} {v === 'A' ? '확신형' : '신중형'}
                      </button>
                    );
                  })}
                </div>
                {mbtiBase && (
                  <p className="mt-1 text-[11px] text-purple-500">
                    선택됨: <b>{mbtiBase}-{mbtiVariant}</b>
                  </p>
                )}
                {!mbtiBase && (
                  <p className="mt-1 text-[11px] text-purple-400">
                    MBTI 모르면 그냥 비우고 넘어가도 돼요
                  </p>
                )}
              </div>
            </div>

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
      {/* Top summary card */}
      <div className="sticky top-0 z-10 border-b border-purple-100 bg-white/90 px-5 pt-3 pb-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold text-purple-500">
              나의 사주 + 별자리
              {savedMbti && <span className="ml-1 text-pink-500">+ {savedMbti}</span>}
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
                  <div className="text-base font-extrabold text-purple-900 leading-tight">
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
                { label: '해(자아)', sign: astro.sun },
                { label: '달(감정)', sign: astro.moon },
                { label: '상승(인상)', sign: astro.ascendant },
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

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-40">
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
                  <div className="max-w-[90%] rounded-full bg-purple-50 px-4 py-1.5 text-[11px] font-semibold text-purple-500">
                    {m.text}
                  </div>
                </div>
              );
            }
            const bubbleClass =
              m.kind === 'saju'
                ? 'bg-white text-gray-800 ring-purple-100'
                : m.kind === 'astro'
                ? 'bg-gradient-to-br from-pink-50 to-amber-50 text-gray-800 ring-pink-100'
                : 'bg-gradient-to-br from-blue-50 to-cyan-50 text-gray-800 ring-blue-100';
            return (
              <div key={i} className="flex justify-start">
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ring-1 ${bubbleClass}`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-3xl bg-white px-4 py-3 shadow-sm ring-1 ring-purple-100">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300 [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300 [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Category buttons */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-purple-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <div className="grid grid-cols-5 gap-1.5">
            {CATEGORY_ORDER.map((cat) => {
              const isUsed = used.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  disabled={busy}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] font-bold transition active:scale-95 disabled:opacity-50 ${
                    isUsed
                      ? 'bg-purple-50 text-purple-400'
                      : 'bg-gradient-to-b from-purple-100 to-pink-100 text-purple-800'
                  }`}
                >
                  <span className="text-base">{CATEGORY_EMOJI[cat]}</span>
                  <span>{CATEGORY_LABELS[cat]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
