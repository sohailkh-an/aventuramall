import React from 'react';

interface LogoProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'className'> {
  className?: string;
  containerClassName?: string;
  textClassName?: string;
  hideText?: boolean;
}

export const Logo = ({ className = 'h-8 w-auto', containerClassName = '', textClassName = '', hideText = false, ...props }: LogoProps) => {
  return (
    <div className={`flex flex-col items-center justify-center text-foreground group select-none ${containerClassName}`} {...props}>
      <svg
        width="112"
        height="69"
        viewBox="0 0 112 69"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`object-contain ${className}`}
      >
        <g clipPath="url(#clip-logo)">
          <path d="M58.7428 0.602783H43.6829L74.419 68.9999L81.949 52.2439L58.7428 0.602783Z" fill="currentColor" />
          <path d="M112 0.602783H98.3103V68.4234H112V0.602783Z" fill="currentColor" />
          <path d="M51.2128 68.4236L20.4767 0.0249023L12.9483 16.7809L24.5123 42.5178H1.38274L0.620979 44.2132H25.274L36.1545 68.4236H51.2128Z" fill="currentColor" />
        </g>
        <defs>
          <clipPath id="clip-logo">
            <rect width="112" height="69" fill="white" />
          </clipPath>
        </defs>
      </svg>
      {!hideText && (
        <span className={`text-[9px] md:text-[10px] font-sans font-semibold tracking-[0.32em] uppercase text-foreground/80 mt-1 leading-none ${textClassName}`}>
          AVENTURA MALL
        </span>
      )}
    </div>
  );
};

