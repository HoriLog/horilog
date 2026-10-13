// src/components/LoadingScreen.tsx

import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #071525 0%, #0B1C30 60%, #0F2544 100%)' }}
    >
      <style>{`
        /* ── Partículas de fundo ── */
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          33%       { transform: translateY(-20px) translateX(8px); opacity: 0.6; }
          66%       { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
        }

        /* ── Isótipo ── */
        @keyframes stemUp {
          from { opacity: 0; clip-path: inset(100% 0 0 0); }
          to   { opacity: 1; clip-path: inset(0% 0 0 0); }
        }
        @keyframes arcDraw {
          from { stroke-dashoffset: 350; opacity: 0; }
          to   { stroke-dashoffset: 0;   opacity: 1; }
        }

        /* ── Texto ── */
        @keyframes textReveal {
          from { opacity: 0; transform: translateY(10px) letterSpacing: 20px; filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0px); filter: blur(0px); }
        }
        @keyframes subReveal {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Barra ── */
        @keyframes barFill {
          0%   { width: 0%;   opacity: 0; }
          10%  { opacity: 1; }
          85%  { width: 92%; }
          100% { width: 100%; }
        }

        /* ── Pulse glow ── */
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0px 0px rgba(243,152,24,0); }
          50%       { box-shadow: 0 0 16px 4px rgba(243,152,24,0.35); }
        }

        /* ── Dot blink ── */
        @keyframes dotBlink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1); }
        }

        /* ── Fade out da tela toda ── */
        @keyframes screenFadeOut {
          0%   { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }

        .hrz-stem-l { animation: stemUp  0.5s cubic-bezier(.22,1,.36,1) 0.1s  both; }
        .hrz-stem-r { animation: stemUp  0.5s cubic-bezier(.22,1,.36,1) 0.25s both; }

        .hrz-arc-amber {
          stroke-dasharray: 350;
          animation: arcDraw 0.8s cubic-bezier(.22,1,.36,1) 0.45s both;
        }
        .hrz-arc-blue {
          stroke-dasharray: 350;
          animation: arcDraw 0.8s cubic-bezier(.22,1,.36,1) 0.65s both;
        }
        .hrz-arc-navy {
          stroke-dasharray: 350;
          animation: arcDraw 0.8s cubic-bezier(.22,1,.36,1) 0.82s both;
        }

        .hrz-title { animation: textReveal 0.7s cubic-bezier(.22,1,.36,1) 1.1s both; }
        .hrz-sub   { animation: subReveal  0.5s ease                      1.4s both; }

        .hrz-bar-track { animation: subReveal 0.4s ease 1.6s both; }
        .hrz-bar-fill  {
          animation: barFill 2.0s cubic-bezier(.4,0,.15,1) 1.7s both;
          animation-fill-mode: forwards;
        }
        .hrz-bar-glow { animation: glowPulse 1.5s ease-in-out 2.2s infinite; }

        .hrz-dot-1 { animation: dotBlink 1.4s ease-in-out 2.0s infinite; }
        .hrz-dot-2 { animation: dotBlink 1.4s ease-in-out 2.2s infinite; }
        .hrz-dot-3 { animation: dotBlink 1.4s ease-in-out 2.4s infinite; }

        .hrz-particle { animation: float var(--dur, 6s) ease-in-out var(--delay, 0s) infinite; }
      `}</style>

      {/* Partículas de fundo */}
      {[
        { size: 3, x: '15%',  y: '20%', dur: '7s',  delay: '0s'   },
        { size: 2, x: '80%',  y: '15%', dur: '5s',  delay: '1s'   },
        { size: 4, x: '70%',  y: '75%', dur: '8s',  delay: '0.5s' },
        { size: 2, x: '25%',  y: '80%', dur: '6s',  delay: '2s'   },
        { size: 3, x: '90%',  y: '50%', dur: '9s',  delay: '1.5s' },
        { size: 2, x: '10%',  y: '60%', dur: '7s',  delay: '3s'   },
      ].map((p, i) => (
        <div
          key={i}
          className="hrz-particle absolute rounded-full bg-white/20"
          style={{
            width: p.size, height: p.size,
            left: p.x, top: p.y,
            ['--dur' as string]: p.dur,
            ['--delay' as string]: p.delay,
          }}
        />
      ))}

      {/* Linha horizontal decorativa — topo */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent 0%, #F39818 50%, transparent 100%)' }}
      />

      {/* Conteúdo central */}
      <div className="flex flex-col items-center select-none">

        {/* Isótipo SVG animado */}
        <svg
          viewBox="0 0 320 108"
          width="260"
          height="88"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hastes */}
          <g className="hrz-stem-l">
            <path d="M125 20 L146 20 L126 100 L105 100 Z" fill="#4A82C5" />
          </g>
          <g className="hrz-stem-r">
            <path d="M165 20 L186 20 L166 100 L145 100 Z" fill="#26378A" />
          </g>

          {/* Arcos */}
          <path
            className="hrz-arc-amber"
            d="M45 74 Q 140 38 275 88"
            stroke="#F39818"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <path
            className="hrz-arc-blue"
            d="M40 92 Q 135 58 270 108"
            stroke="#4A82C5"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            className="hrz-arc-navy"
            d="M42 108 Q 135 74 265 124"
            stroke="#3A5BA8"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Nome da empresa */}
        <div className="mt-5 flex flex-col items-center gap-0.5">
          <div
            className="hrz-title text-white font-extrabold tracking-[6px] uppercase"
            style={{
              fontSize: '22px',
              fontFamily: "'Geist', system-ui, sans-serif",
              textShadow: '0 2px 20px rgba(74,130,197,0.4)',
            }}
          >
            Horizonte
          </div>
          <div
            className="hrz-sub font-semibold tracking-[3px] uppercase"
            style={{
              fontSize: '12px',
              color: '#F39818',
              fontFamily: "'Geist', system-ui, sans-serif",
              letterSpacing: '4px',
            }}
          >
            Logística
          </div>
        </div>

        {/* Divisor */}
        <div className="hrz-sub mt-6 w-8 h-px bg-white/20" />

        {/* Barra de progresso */}
        <div className="hrz-bar-track mt-5 relative">
          <div
            className="w-52 h-[3px] rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <div
              className="hrz-bar-fill hrz-bar-glow h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #4A82C5 0%, #F39818 100%)',
                width: 0,
              }}
            />
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-2 mt-4">
          <div className="hrz-dot-1 w-1.5 h-1.5 rounded-full bg-white/50" />
          <div className="hrz-dot-2 w-1.5 h-1.5 rounded-full bg-white/50" />
          <div className="hrz-dot-3 w-1.5 h-1.5 rounded-full bg-white/50" />
        </div>

        {/* Label */}
        <div
          className="hrz-sub mt-4 text-white/30 uppercase tracking-widest"
          style={{ fontSize: '9px', fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Sistema Operacional
        </div>
      </div>

      {/* Linha decorativa — base */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(74,130,197,0.4) 50%, transparent 100%)' }}
      />
    </div>
  );
};
