export function AlphaLogo({ className = "w-8 h-8", primaryColor, secondaryColor }: { className?: string, primaryColor?: string, secondaryColor?: string }) {
  // Generate a unique ID for the gradient to prevent conflicts if multiple logos are on screen
  const gradientId = `alphaGradient-${Math.random().toString(36).substring(2, 9)}`;
  
  // If the user passes a text color utility (e.g., text-white, text-[#062016]), 
  // we should use currentColor to respect it, unless they explicitly provided primary/secondary colors.
  const hasTextColor = className.includes('text-');
  const useCurrentColor = hasTextColor && !primaryColor && !secondaryColor;

  const pColor = primaryColor || '#bef264';
  const sColor = secondaryColor || '#a3e635';
  
  const strokeColor = useCurrentColor ? 'currentColor' : `url(#${gradientId})`;

  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {!useCurrentColor && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={pColor} />
            <stop offset="100%" stopColor={sColor} />
          </linearGradient>
        </defs>
      )}
      {/* Outer circle accent */}
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <path d="M22 12C22 9.24 20.88 6.74 19.07 4.93" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      
      {/* The A shape */}
      <path d="M5 19L12 5L19 19" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      
      {/* The swooping arrow */}
      <path d="M6 15C9.5 15 11.5 10.5 18 5" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 5H13M18 5V10" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
