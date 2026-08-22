import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  variant?: 'full' | 'monogram';
}

export const Logo = ({ className = 'h-8 w-auto', variant = 'full', ...props }: LogoProps) => {
  if (variant === 'monogram') {
    return (
      <svg
        viewBox="0 0 60 50"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        {/* Luxury serif AM monogram */}
        <text
          x="50%"
          y="68%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontFamily="var(--font-serif), Georgia, serif"
          fontSize="46"
          fontWeight="700"
          letterSpacing="-0.06em"
          fill="currentColor"
        >
          AM
        </text>
      </svg>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-foreground group select-none">
      <span
        className="font-serif text-3xl md:text-4xl font-bold tracking-[-0.07em] leading-none"
        style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
      >
        AM
      </span>
      <span className="text-[9px] md:text-[10px] font-sans font-semibold tracking-[0.32em] uppercase text-foreground/80 mt-1 leading-none">
        AVENTURA MALL
      </span>
    </div>
  );
};

