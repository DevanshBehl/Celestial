interface Props {
  size?: number;
  className?: string;
}

export default function Logo({ size = 28, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Celestial"
    >
      <defs>
        <linearGradient id="moon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dceefa" />
          <stop offset="100%" stopColor="#6aaccc" />
        </linearGradient>
        <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eaf4ff" />
          <stop offset="100%" stopColor="#8ab8d4" />
        </linearGradient>
      </defs>

      {/* Crescent moon — filled circle minus offset circle (clip-path approach) */}
      <path
        d="M14 4C8.477 4 4 8.477 4 14s4.477 10 10 10a10 10 0 0 0 9.192-6.083A7.5 7.5 0 0 1 14 10.5 7.5 7.5 0 0 1 18.5 4.05 9.96 9.96 0 0 0 14 4Z"
        fill="url(#moon-grad)"
      />

      {/* 4-pointed star sparkle — top right */}
      <path
        d="M21 5l.6 1.4L23 7l-1.4.6L21 9l-.6-1.4L19 7l1.4-.6L21 5Z"
        fill="url(#sparkle-grad)"
      />

      {/* Tiny dot sparkle */}
      <circle cx="23.5" cy="11.5" r="1" fill="#c4d8ec" opacity="0.7" />
    </svg>
  );
}
