import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing, staticFile, delayRender, continueRender} from 'remotion';
import {FONT_FACES} from './fonts';

const HEAD = 'Unbounded';
const BODY = 'Inter, "Noto Color Emoji"';

const fontHandle = delayRender('fonts');
Promise.all(
  FONT_FACES.map((ff) => {
    const face = new FontFace(ff.family, `url(${staticFile(ff.file)}) format('woff2')`, {weight: ff.weight, unicodeRange: ff.range});
    document.fonts.add(face);
    return face.load();
  }),
).then(() => continueRender(fontHandle));

const C = {
  bg: '#2a211e',
  glow: '#6e5038',
  text: '#f6ede3',
  accent: '#e8c28f',
  muted: '#bfa88e',
  bubbleMe: '#e8c28f',
  bubbleBot: '#3a2e29',
};

export type Variant = {
  id: string;
  hook: [string, string]; // white line, accent line
  tag: string;
  question: string;
  answer: string;
};

export const VARIANTS: Variant[] = [
  {
    id: 'A-mama',
    tag: 'без шуток',
    hook: ['Мама спросила нейросеть,', 'что приготовить на ужин'],
    question: 'У меня курица, рис и кабачок. Что приготовить за 30 минут?',
    answer: 'Курица с рисом и кабачком на одной сковороде 🍳\n\n1. Обжарь курицу 7 минут\n2. Добавь кабачок и рис\n3. Залей водой, туши 20 минут\n\nГотово — ужин на троих ✨',
  },
  {
    id: 'B-ne-dlya-menya',
    tag: 'признавайся',
    hook: ['Ты тоже думала, что нейросети —', 'это не для тебя?'],
    question: 'Напиши поздравление свекрови с днём рождения. Тепло, но без пафоса',
    answer: 'Галина Петровна, с днём рождения! 💐\n\nСпасибо за ваше тепло, пироги и умение всегда поддержать. Пусть этот год будет лёгким, а дома всегда пахнет счастьем 🤍',
  },
  {
    id: 'C-kak-podruge',
    tag: 'проверено',
    hook: ['Вопрос как подруге —', 'ответ за 5 секунд'],
    question: 'Как вежливо отказать начальнику, если просит выйти в выходной?',
    answer: 'Можно так:\n\n«Спасибо, что обратились ко мне! В эти выходные у меня семейные планы, выйти не получится. Могу взять задачу в понедельник с утра» 🙌',
  },
];

// timeline (30 fps)
const HOOK = [0, 60];
const CHAT = [55, 150];
const USP = [150, 210];
const CTA = [205, 285];
export const DURATION = 285;

const Background: React.FC = () => {
  const f = useCurrentFrame();
  const drift = Math.sin(f / 40) * 30;
  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse 900px 1000px at ${540 + drift}px 520px, ${C.glow} 0%, #4a3629 35%, ${C.bg} 75%)`,
    }} />
  );
};

const fadeUp = (f: number, start: number, fps: number) => {
  const s = spring({frame: f - start, fps, config: {damping: 18, stiffness: 140}});
  return {opacity: interpolate(s, [0, 1], [0, 1]), transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`};
};

const sceneOut = (f: number, dur: number, len = 8) =>
  interpolate(f, [dur - len, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const Hook: React.FC<{v: Variant; dur: number}> = ({v, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // no fade-in on line 1 for instant start (frame 0 already readable) → loops cleanly
  const pop = spring({frame: f, fps, config: {damping: 12, stiffness: 200}, from: 0.92, to: 1});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 80px', opacity: sceneOut(f, dur)}}>
      <div style={{fontFamily: BODY, fontWeight: 600, letterSpacing: 6, fontSize: 30, color: C.muted, textTransform: 'uppercase', marginBottom: 40, ...fadeUp(f, 4, fps)}}>
        {v.tag}
      </div>
      <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 76, lineHeight: 1.15, textAlign: 'center', color: C.text, transform: `scale(${pop})`}}>
        {v.hook[0]}
        <div style={{color: C.accent, ...fadeUp(f, 10, fps)}}>{v.hook[1]}</div>
      </div>
    </AbsoluteFill>
  );
};

const Dots: React.FC<{f: number}> = ({f}) => (
  <div style={{display: 'flex', gap: 10, padding: '6px 4px'}}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{width: 16, height: 16, borderRadius: 8, background: C.muted,
        opacity: 0.35 + 0.65 * Math.max(0, Math.sin((f - i * 4) / 4))}} />
    ))}
  </div>
);

const Chat: React.FC<{v: Variant; dur: number}> = ({v, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const qStart = 8, qTypeEnd = 36;
  const qChars = Math.round(interpolate(f, [qStart, qTypeEnd], [0, v.question.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const dotsStart = 40, ansStart = 52;
  const ansChars = Math.round(interpolate(f, [ansStart, ansStart + 26], [0, v.answer.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)}));
  const enter = spring({frame: f, fps, config: {damping: 20, stiffness: 120}});
  const bubble = (start: number) => {
    const s = spring({frame: f - start, fps, config: {damping: 16, stiffness: 180}});
    return {opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.85, 1])})`};
  };
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: sceneOut(f, dur)}}>
      <div style={{
        width: 940, height: 1240, borderRadius: 48, background: 'rgba(26,20,18,0.72)',
        border: '2px solid rgba(232,194,143,0.18)', boxShadow: '0 40px 120px rgba(0,0,0,0.45)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [120, 0])}px)`,
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24, padding: '32px 40px', borderBottom: '2px solid rgba(232,194,143,0.12)'}}>
          <div style={{width: 84, height: 84, borderRadius: 42, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 36, color: C.bg}}>AI</div>
          <div>
            <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 42, color: C.text}}>Нейро-помощница</div>
            <div style={{fontFamily: BODY, fontSize: 28, color: C.muted}}>{f >= dotsStart && f < ansStart + 30 ? 'печатает…' : 'бот в Telegram'}</div>
          </div>
        </div>
        <div style={{flex: 1, padding: 40, display: 'flex', flexDirection: 'column', gap: 28}}>
          {f >= qStart && (
            <div style={{alignSelf: 'flex-end', maxWidth: 720, background: C.bubbleMe, color: C.bg, borderRadius: '36px 36px 8px 36px',
              padding: '26px 34px', fontFamily: BODY, fontWeight: 500, fontSize: 46, lineHeight: 1.3, transformOrigin: 'bottom right', ...bubble(qStart)}}>
              {v.question.slice(0, qChars)}
            </div>
          )}
          {f >= dotsStart && (
            <div style={{alignSelf: 'flex-start', maxWidth: 780, background: C.bubbleBot, color: C.text, borderRadius: '36px 36px 36px 8px',
              padding: '30px 38px', fontFamily: BODY, fontSize: 44, lineHeight: 1.35, whiteSpace: 'pre-wrap', transformOrigin: 'bottom left', ...bubble(dotsStart)}}>
              {f < ansStart ? <Dots f={f} /> : v.answer.slice(0, ansChars)}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Usp: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lines = [['Без VPN.', C.text], ['Без английского.', C.text], ['Прямо в Telegram.', C.accent]] as const;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: sceneOut(f, dur)}}>
      {lines.map(([t, col], i) => (
        <div key={t} style={{fontFamily: HEAD, fontWeight: 700, fontSize: 80, lineHeight: 1.3, color: col, ...fadeUp(f, 4 + i * 12, fps)}}>{t}</div>
      ))}
    </AbsoluteFill>
  );
};

const Cta: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pulse = 1 + 0.04 * Math.max(0, Math.sin((f - 30) / 5));
  const arrow = Math.sin(f / 5) * 14;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 80px', opacity: sceneOut(f, dur, 12)}}>
      <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 70, color: C.text, textAlign: 'center', lineHeight: 1.2, ...fadeUp(f, 2, fps)}}>
        Хочешь так же?
      </div>
      <div style={{fontFamily: BODY, fontSize: 40, color: C.muted, textAlign: 'center', marginTop: 28, lineHeight: 1.4, ...fadeUp(f, 10, fps)}}>
        Напиши в комментариях
      </div>
      <div style={{marginTop: 40, ...fadeUp(f, 18, fps)}}>
        <div style={{background: C.accent, color: C.bg, fontFamily: HEAD, fontWeight: 700, fontSize: 96, borderRadius: 999,
          padding: '28px 80px', transform: `scale(${pulse})`, boxShadow: '0 20px 80px rgba(232,194,143,0.35)'}}>
          ХОЧУ
        </div>
      </div>
      <div style={{fontFamily: BODY, fontSize: 36, color: C.muted, textAlign: 'center', marginTop: 40, ...fadeUp(f, 26, fps)}}>
        пришлю инструкцию + 77 промптов в директ
      </div>
      <div style={{fontSize: 80, marginTop: 30, transform: `translateY(${arrow}px)`, ...{opacity: interpolate(f, [30, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}}>👇</div>
    </AbsoluteFill>
  );
};

export const Reel: React.FC<{variant: Variant}> = ({variant}) => (
  <AbsoluteFill style={{background: C.bg}}>
    <Background />
    <Sequence from={HOOK[0]} durationInFrames={HOOK[1] - HOOK[0]}><Hook v={variant} dur={HOOK[1] - HOOK[0]} /></Sequence>
    <Sequence from={CHAT[0]} durationInFrames={CHAT[1] - CHAT[0]}><Chat v={variant} dur={CHAT[1] - CHAT[0]} /></Sequence>
    <Sequence from={USP[0]} durationInFrames={USP[1] - USP[0]}><Usp dur={USP[1] - USP[0]} /></Sequence>
    <Sequence from={CTA[0]} durationInFrames={CTA[1] - CTA[0]}><Cta dur={CTA[1] - CTA[0]} /></Sequence>
  </AbsoluteFill>
);
