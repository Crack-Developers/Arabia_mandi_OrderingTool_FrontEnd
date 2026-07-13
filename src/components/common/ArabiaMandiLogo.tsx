import React from 'react';

interface ArabiaMandiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const ArabiaMandiLogo: React.FC<ArabiaMandiLogoProps> = ({
  size = 'md',
  showSubtitle = true,
}) => {
  const dimensions = {
    sm: { dome: 'w-10 h-10', text: 'text-sm', arabic: 'text-[9px]', sub: 'text-[8px]' },
    md: { dome: 'w-12 h-12', text: 'text-base', arabic: 'text-[11px]', sub: 'text-[9px]' },
    lg: { dome: 'w-16 h-16', text: 'text-xl', arabic: 'text-xs', sub: 'text-[10px]' },
    xl: { dome: 'w-24 h-24', text: 'text-3xl', arabic: 'text-base', sub: 'text-xs' },
  }[size];

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Authentic Golden Arabian Dome Crest SVG */}
      <div className={`relative flex items-center justify-center ${dimensions.dome}`}>
        <svg
          viewBox="0 0 120 110"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(234,179,8,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="45%" stopColor="#EAB308" />
              <stop offset="85%" stopColor="#CA8A04" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
            <linearGradient id="darkGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#A16207" />
            </linearGradient>
          </defs>

          {/* Top Decorative Hanging Ring / Finial */}
          <circle cx="60" cy="8" r="4.5" stroke="url(#goldGrad)" strokeWidth="2.2" fill="none" />
          <line x1="60" y1="12.5" x2="60" y2="18" stroke="url(#goldGrad)" strokeWidth="2.2" />

          {/* Majestic Arabian Dome Outline */}
          <path
            d="M20 72 C20 40, 36 18, 60 18 C84 18, 100 40, 100 72 Z"
            stroke="url(#goldGrad)"
            strokeWidth="3.2"
            fill="rgba(234, 179, 8, 0.08)"
          />

          {/* Geometric Islamic Lattice Arches Inside Dome */}
          <path
            d="M36 72 C36 48, 46 32, 60 32 C74 32, 84 48, 84 72"
            stroke="url(#goldGrad)"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          <path
            d="M48 72 C48 56, 54 44, 60 44 C66 44, 72 56, 72 72"
            stroke="url(#goldGrad)"
            strokeWidth="1.8"
          />
          <path
            d="M28 58 Q60 36 92 58"
            stroke="url(#goldGrad)"
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Center Monogram AM inside Dome */}
          <text
            x="60"
            y="65"
            textAnchor="middle"
            fill="url(#goldGrad)"
            fontFamily="serif"
            fontWeight="900"
            fontSize="18"
            letterSpacing="2"
          >
            AM
          </text>

          {/* Bottom Golden Pedestal Bar */}
          <rect
            x="14"
            y="74"
            width="92"
            height="11"
            rx="5.5"
            fill="url(#goldGrad)"
          />
          <path
            d="M22 79.5 L98 79.5"
            stroke="#422006"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* Brand Typography matching poster */}
      {showSubtitle && (
        <div className="text-center mt-1">
          <h2
            className={`font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 uppercase ${dimensions.text}`}
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.08em' }}
          >
            Arabia Mandi
          </h2>
          <p className={`font-bold text-amber-300/90 leading-tight mt-0.5 ${dimensions.arabic}`}>
            العربية مندي
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="h-px w-3 bg-amber-500/50" />
            <span
              className={`font-extrabold text-amber-400/90 tracking-widest uppercase ${dimensions.sub}`}
            >
              TASTE OF ARABIA
            </span>
            <span className="h-px w-3 bg-amber-500/50" />
          </div>
        </div>
      )}
    </div>
  );
};
