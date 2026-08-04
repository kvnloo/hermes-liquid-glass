import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Easing,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont();

/** Privacy-safe trailer: synthetic preview only — no real chats, paths, or PII. */

const COLORS = {
  bg0: '#0b1218',
  bg1: '#132028',
  glass: 'rgba(24, 36, 44, 0.55)',
  glassBorder: 'rgba(200, 190, 114, 0.28)',
  accent: '#C8BE72',
  accentSoft: 'rgba(200, 190, 114, 0.18)',
  text: '#e8f0ec',
  muted: 'rgba(209, 222, 218, 0.62)',
  userBubble: 'rgba(79, 165, 179, 0.22)',
  aiBubble: 'rgba(255, 255, 255, 0.06)',
};

const Title: React.FC<{children: React.ReactNode; delay?: number}> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = spring({frame: frame - delay, fps, config: {damping: 200}});
  const y = interpolate(t, [0, 1], [28, 0]);
  const o = interpolate(t, [0, 1], [0, 1]);
  return (
    <div
      style={{
        fontFamily,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        transform: `translateY(${y}px)`,
        opacity: o,
      }}
    >
      {children}
    </div>
  );
};

const Chip: React.FC<{label: string; i: number}> = ({label, i}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = spring({
    frame: frame - 8 - i * 4,
    fps,
    config: {damping: 18, stiffness: 120},
  });
  return (
    <div
      style={{
        opacity: t,
        transform: `translateY(${interpolate(t, [0, 1], [12, 0])}px)`,
        padding: '10px 16px',
        borderRadius: 999,
        border: `1px solid ${COLORS.glassBorder}`,
        background: COLORS.accentSoft,
        color: COLORS.text,
        fontFamily,
        fontSize: 22,
        fontWeight: 600,
      }}
    >
      {label}
    </div>
  );
};

/** Blurred abstract wallpaper — not a real desktop capture. */
const Wallpaper: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 300], [0, 30], {
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at ${40 + drift * 0.2}% 30%, #2a4a3a 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at ${70 - drift * 0.15}% 70%, #1a3a48 0%, transparent 50%),
          radial-gradient(ellipse 50% 40% at 20% 80%, #3a3820 0%, transparent 45%),
          linear-gradient(160deg, #0a1014, #152028 50%, #0c1418)
        `,
        filter: 'blur(2px) saturate(1.15)',
      }}
    />
  );
};

/** Fake frosted Hermes-like preview window with placeholder chat only. */
const PreviewWindow: React.FC<{enter: number}> = ({enter}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = spring({
    frame: frame - enter,
    fps,
    config: {damping: 20, stiffness: 90},
  });
  const scale = interpolate(t, [0, 1], [0.92, 1]);
  const opacity = interpolate(t, [0, 1], [0, 1]);

  const messages = [
    {role: 'user' as const, text: 'Match my theme to the wallpaper.'},
    {
      role: 'ai' as const,
      text: 'Synced liquid glass from pywal · accent #C8BE72',
    },
    {role: 'user' as const, text: 'Keep the frost. No private paths.'},
    {
      role: 'ai' as const,
      text: 'Hyprland blur + Desktop plugin · preview only.',
    },
  ];

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        width: 920,
        height: 560,
        borderRadius: 18,
        border: `1px solid ${COLORS.glassBorder}`,
        background: COLORS.glass,
        backdropFilter: 'blur(28px) saturate(1.2)',
        boxShadow:
          '0 40px 100px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily,
      }}
    >
      {/* titlebar */}
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: 8,
        }}
      >
        <div style={{display: 'flex', gap: 6}}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div
              key={c}
              style={{
                width: 10,
                height: 10,
                borderRadius: 99,
                background: c,
                opacity: 0.85,
              }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            color: COLORS.muted,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Hermes · Liquid Glass preview
        </div>
        <div
          style={{
            fontSize: 11,
            color: COLORS.accent,
            border: `1px solid ${COLORS.glassBorder}`,
            borderRadius: 6,
            padding: '2px 8px',
          }}
        >
          DEMO
        </div>
      </div>

      <div style={{display: 'flex', flex: 1, minHeight: 0}}>
        {/* fake sidebar — intentionally empty of real projects */}
        <div
          style={{
            width: 180,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            padding: 14,
            background: 'rgba(0,0,0,0.18)',
            filter: 'blur(6px)',
            opacity: 0.55,
          }}
        >
          {['Session A', 'Session B', 'Session C', 'Session D'].map((s) => (
            <div
              key={s}
              style={{
                height: 28,
                marginBottom: 10,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </div>

        {/* chat */}
        <div
          style={{
            flex: 1,
            padding: '22px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {messages.map((m, i) => {
            const mt = spring({
              frame: frame - enter - 12 - i * 10,
              fps,
              config: {damping: 200},
            });
            const isUser = m.role === 'user';
            return (
              <div
                key={i}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '78%',
                  opacity: mt,
                  transform: `translateY(${interpolate(mt, [0, 1], [16, 0])}px)`,
                  padding: '12px 16px',
                  borderRadius: 14,
                  background: isUser ? COLORS.userBubble : COLORS.aiBubble,
                  border: `1px solid ${
                    isUser ? 'rgba(79,165,179,0.35)' : 'rgba(255,255,255,0.08)'
                  }`,
                  color: COLORS.text,
                  fontSize: 18,
                  lineHeight: 1.35,
                }}
              >
                {m.text}
              </div>
            );
          })}
          <div style={{flex: 1}} />
          <div
            style={{
              height: 48,
              borderRadius: 12,
              border: `1px solid ${COLORS.glassBorder}`,
              background: 'rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              color: COLORS.muted,
              fontSize: 15,
            }}
          >
            Preview composer — sample text only
          </div>
        </div>
      </div>
    </div>
  );
};

const SceneHero: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [0, 40], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <Wallpaper />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 40%, rgba(200,190,114,${
            0.12 * glow
          }), transparent 55%)`,
        }}
      />
      <div style={{textAlign: 'center', zIndex: 2}}>
        <Title>
          <div style={{fontSize: 72, color: COLORS.text, marginBottom: 12}}>
            Liquid Glass
          </div>
        </Title>
        <Title delay={6}>
          <div style={{fontSize: 36, color: COLORS.accent, fontWeight: 600}}>
            for Hermes Desktop
          </div>
        </Title>
        <Title delay={14}>
          <div
            style={{
              marginTop: 28,
              fontSize: 22,
              color: COLORS.muted,
              fontWeight: 500,
            }}
          >
            Linux-native · pywal · Hyprland · Wallpaper Engine
          </div>
        </Title>
      </div>
    </AbsoluteFill>
  );
};

const SceneStack: React.FC = () => {
  const chips = [
    'pywal palette',
    'Hyprland frost',
    'Wallpaper Engine',
    'Hermes plugin',
    'auto on wallpaper change',
  ];
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Wallpaper />
      <AbsoluteFill style={{background: 'rgba(8,12,16,0.35)'}} />
      <div style={{zIndex: 2, width: 1000}}>
        <Title>
          <div
            style={{
              fontFamily,
              fontSize: 48,
              color: COLORS.text,
              marginBottom: 28,
              textAlign: 'center',
            }}
          >
            One wallpaper change.
            <br />
            <span style={{color: COLORS.accent}}>Whole stack follows.</span>
          </div>
        </Title>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          {chips.map((c, i) => (
            <Chip key={c} label={c} i={i} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ScenePreview: React.FC = () => {
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Wallpaper />
      <AbsoluteFill style={{background: 'rgba(6,10,14,0.25)'}} />
      <div style={{zIndex: 2, display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'center'}}>
        <Title>
          <div
            style={{
              fontFamily,
              fontSize: 28,
              color: COLORS.muted,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Privacy-safe preview
          </div>
        </Title>
        <PreviewWindow enter={8} />
        <Title delay={20}>
          <div style={{fontFamily, fontSize: 18, color: COLORS.muted}}>
            Real sessions stay private · demo UI only
          </div>
        </Title>
      </div>
    </AbsoluteFill>
  );
};

const SceneCTA: React.FC = () => {
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Wallpaper />
      <div style={{zIndex: 2, textAlign: 'center', fontFamily}}>
        <Title>
          <div style={{fontSize: 56, color: COLORS.text, fontWeight: 700}}>
            hermes-liquid-glass
          </div>
        </Title>
        <Title delay={8}>
          <div style={{marginTop: 18, fontSize: 26, color: COLORS.accent}}>
            open source · ~/.hermes/desktop-plugins
          </div>
        </Title>
        <Title delay={16}>
          <div style={{marginTop: 40, fontSize: 20, color: COLORS.muted}}>
            wal → theme.json → Desktop frost
          </div>
        </Title>
      </div>
    </AbsoluteFill>
  );
};

export const LiquidGlassTrailer: React.FC = () => {
  const {fps} = useVideoConfig();
  // ~18s total
  const s1 = 0;
  const s2 = Math.round(fps * 4.2);
  const s3 = Math.round(fps * 8.8);
  const s4 = Math.round(fps * 14.2);

  return (
    <AbsoluteFill style={{background: COLORS.bg0}}>
      <Sequence from={s1} durationInFrames={s2 - s1 + 8}>
        <SceneHero />
      </Sequence>
      <Sequence from={s2} durationInFrames={s3 - s2 + 8}>
        <SceneStack />
      </Sequence>
      <Sequence from={s3} durationInFrames={s4 - s3 + 8}>
        <ScenePreview />
      </Sequence>
      <Sequence from={s4} durationInFrames={Math.round(fps * 4)}>
        <SceneCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
