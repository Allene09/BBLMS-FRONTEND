import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Direct .lottie file URL (must end in .lottie or .json — web page URLs won't work)
const USER_ANIM = '/logo.lottie';

const VARIANTS = {
  loading: {
    src: USER_ANIM,
    glow1: 'rgba(30,122,184,0.35)',
    glow2: 'rgba(141,198,63,0.2)',
    message: 'Loading...',
  },
  login: {
    src: USER_ANIM,
    glow1: 'rgba(141,198,63,0.3)',
    glow2: 'rgba(30,122,184,0.3)',
    message: 'Welcome back!',
  },
  logout: {
    src: USER_ANIM,
    glow1: 'rgba(30,122,184,0.3)',
    glow2: 'rgba(141,198,63,0.25)',
    message: 'Signing you out...',
  },
};

export default function LoadingScreen({ message, variant = 'loading' }) {
  const v = VARIANTS[variant] || VARIANTS.loading;
  const displayMessage = message ?? v.message;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{
        background: 'linear-gradient(140deg, #051a10 0%, #07233a 45%, #0b2e14 100%)',
        animation: 'fadeInOverlay 0.3s ease',
      }}
    >
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 40%, ${v.glow1} 0%, transparent 55%),
            radial-gradient(ellipse at 70% 60%, ${v.glow2} 0%, transparent 55%)
          `,
        }}
      />

      <div className="relative flex flex-col items-center gap-2">
        {/* Lottie animation */}
        <DotLottieReact
          src={v.src}
          loop
          autoplay
          style={{ width: 200, height: 200 }}
          renderConfig={{ autoResize: true }}
        />

        {/* Logo + name */}
        <div className="flex items-center gap-3 mt-1">
          <img
            src="/logo.png"
            alt="BISU Bilar Library Logo"
            className="w-9 h-9 object-contain drop-shadow-xl"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="leading-tight">
            <p className="text-white font-extrabold text-base tracking-tight">BISU — BILAR</p>
            <p className="text-xs" style={{ color: '#64748b' }}>Library Management System</p>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm font-medium mt-3" style={{ color: '#94a3b8' }}>{displayMessage}</p>
      </div>
    </div>
  );
}
