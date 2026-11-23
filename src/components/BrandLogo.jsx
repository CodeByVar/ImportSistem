import React, { useId } from 'react';

/**
 * Símbolo Oficial "R" con flecha ascendente de Importadora Rivero
 * Basado en el Manual de Identidad Visual (#FF8C00 -> #FFC107 / #FFE082 y #0D0D0D)
 */
export function RiveroIconSVG({ className = 'w-8 h-8', monochrome = null }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `rivero-r-grad-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      aria-hidden="true"
    >
      {!monochrome && (
        <defs>
          <linearGradient id={gradId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FF8C00" />
            <stop offset="60%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#FFE082" />
          </linearGradient>
        </defs>
      )}
      <path
        fill={monochrome || `url(#${gradId})`}
        d="M 146 92
           L 298 92
           C 378 92 422 136 410 212
           C 400 264 362 300 314 314
           L 368 420
           L 276 420
           L 232 326
           L 202 326
           L 182 420
           L 92 414
           C 94 334 142 276 238 222
           L 258 246
           L 298 158
           L 204 176
           L 224 198
           C 170 226 134 252 110 276
           Z"
      />
    </svg>
  );
}

/**
 * Componente Oficial de Marca - Importadora Rivero
 * Soporta variantes del Manual de Marca:
 * - "capsule-dark": Cápsula Negro Intenso (#0D0D0D) con R degradada + IMPORTADORA RIVERO
 * - "horizontal-light": Fondo claro con imagen oficial /logo-importadora-rivero.png o vector
 * - "horizontal-dark": Para fondos oscuros (Texto blanco + RIVERO en degradado Naranja-Dorado)
 * - "app-icon": Ícono cuadrado redondeado estilo App (Oscuro o Claro)
 */
export default function BrandLogo({
  variant = 'capsule-dark',
  size = 'md',
  showSlogan = false,
  useImage = false,
  className = ''
}) {
  if (useImage) {
    const heightMap = {
      sm: 'h-8',
      md: 'h-10 sm:h-11',
      lg: 'h-12 sm:h-14',
      xl: 'h-16 sm:h-20'
    };
    return (
      <img
        src="/logo-importadora-rivero.png"
        alt="Importadora Rivero - Simplificamos tu esfuerzo"
        className={`${heightMap[size] || heightMap.md} w-auto object-contain select-none ${className}`}
      />
    );
  }

  if (variant === 'app-icon-dark' || variant === 'app-icon-light') {
    const isDark = variant === 'app-icon-dark';
    const boxSizes = {
      sm: 'w-8 h-8 rounded-xl',
      md: 'w-10 h-10 rounded-xl',
      lg: 'w-12 h-12 rounded-2xl',
      xl: 'w-16 h-16 rounded-2xl'
    };
    return (
      <div
        className={`${boxSizes[size] || boxSizes.md} ${
          isDark
            ? 'bg-[#0D0D0D] border border-[#FF8C00]/30 shadow-md shadow-black/40'
            : 'bg-white border border-slate-200 shadow-sm'
        } flex items-center justify-center shrink-0 select-none ${className}`}
      >
        <RiveroIconSVG className="w-[78%] h-[78%]" />
      </div>
    );
  }

  if (variant === 'horizontal-light' || variant === 'horizontal-dark') {
    const isDark = variant === 'horizontal-dark';
    return (
      <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDark
              ? 'bg-[#0D0D0D] border border-[#FF8C00]/35 shadow-md'
              : 'bg-[#0D0D0D] border border-[#0D0D0D] shadow-sm'
          }`}
        >
          <RiveroIconSVG className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="flex flex-col leading-none">
          <span
            style={{ fontFamily: "'Montserrat', sans-serif" }}
            className={`text-[10px] sm:text-[11px] font-extrabold tracking-[0.18em] uppercase ${
              isDark ? 'text-white' : 'text-[#0D0D0D]'
            }`}
          >
            IMPORTADORA
          </span>
          <span
            style={{ fontFamily: "'Montserrat', sans-serif" }}
            className="text-sm sm:text-base font-black tracking-[0.06em] uppercase bg-gradient-to-r from-[#FF8C00] via-[#FFC107] to-[#FFE082] bg-clip-text text-transparent mt-0.5"
          >
            RIVERO
          </span>
          {showSlogan && (
            <span
              style={{ fontFamily: "'Montserrat', sans-serif" }}
              className={`text-[8px] sm:text-[9px] font-semibold tracking-[0.12em] uppercase mt-0.5 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              SIMPLIFICAMOS TU ESFUERZO
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default: "capsule-dark" (Ideal para el Header principal en modo claro y oscuro)
  return (
    <div
      className={`bg-[#0D0D0D] dark:bg-[#161616] text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 shadow-md border border-[#262626] dark:border-[#FF8C00]/30 select-none ${className}`}
    >
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#1A1A1A] border border-[#FF8C00]/30 flex items-center justify-center shrink-0 shadow-inner">
        <RiveroIconSVG className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
      <div className="flex flex-col leading-none pr-1">
        <span
          style={{ fontFamily: "'Montserrat', sans-serif" }}
          className="text-[9px] sm:text-[10px] tracking-[0.2em] text-white font-extrabold uppercase"
        >
          IMPORTADORA
        </span>
        <span
          style={{ fontFamily: "'Montserrat', sans-serif" }}
          className="text-xs sm:text-[15px] font-black tracking-[0.08em] uppercase bg-gradient-to-r from-[#FF8C00] via-[#FFC107] to-[#FFE082] bg-clip-text text-transparent mt-0.5"
        >
          RIVERO
        </span>
        {showSlogan && (
          <span
            style={{ fontFamily: "'Montserrat', sans-serif" }}
            className="text-[7px] sm:text-[8px] tracking-[0.14em] text-neutral-400 font-semibold uppercase mt-0.5 hidden sm:block"
          >
            SIMPLIFICAMOS TU ESFUERZO
          </span>
        )}
      </div>
    </div>
  );
}
