import { motion } from 'framer-motion';

interface Props {
  size?: number;
  className?: string;
}

/**
 * Static crescent moon logo (small, for header / inline use).
 */
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
          <stop offset="0%" stopColor="#f0f0f5" />
          <stop offset="100%" stopColor="#d0d0e0" />
        </linearGradient>
        <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ab9ff2" />
        </linearGradient>
      </defs>

      {/* Crescent moon */}
      <path
        d="M14 4C8.477 4 4 8.477 4 14s4.477 10 10 10a10 10 0 0 0 9.192-6.083A7.5 7.5 0 0 1 14 10.5 7.5 7.5 0 0 1 18.5 4.05 9.96 9.96 0 0 0 14 4Z"
        fill="url(#moon-grad)"
      />

      {/* 4-pointed star sparkle */}
      <path
        d="M21 5l.6 1.4L23 7l-1.4.6L21 9l-.6-1.4L19 7l1.4-.6L21 5Z"
        fill="url(#sparkle-grad)"
      />

      {/* Tiny dot sparkle */}
      <circle cx="23.5" cy="11.5" r="1" fill="#ab9ff2" opacity="0.7" />
    </svg>
  );
}

/**
 * Large animated crescent moon for the Unlock / Onboarding screens.
 * Features floating motion, pulsing glow, and twinkling stars.
 */
export function AnimatedMoon({ size = 120 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size * 1.6, height: size * 1.6 }}>
      {/* Outer glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 1.4,
          height: size * 1.4,
          background: 'radial-gradient(circle, rgba(171,159,242,0.15) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.9,
          height: size * 0.9,
          background: 'radial-gradient(circle, rgba(171,159,242,0.20) 0%, transparent 60%)',
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.3,
        }}
      />

      {/* The main crescent moon SVG */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          y: [0, -8, 0],
          filter: [
            'drop-shadow(0 0 20px rgba(171,159,242,0.3))',
            'drop-shadow(0 0 40px rgba(171,159,242,0.6))',
            'drop-shadow(0 0 20px rgba(171,159,242,0.3))',
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <defs>
          <linearGradient id="moon-anim-grad" x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f0f0f5" />
            <stop offset="100%" stopColor="#d8d4f0" />
          </linearGradient>
          <radialGradient id="moon-shadow" cx="60%" cy="40%" r="50%">
            <stop offset="0%" stopColor="rgba(171,159,242,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Crescent moon body */}
        <path
          d="M60 10C33.49 10 12 31.49 12 58s21.49 48 48 48a48 48 0 0 0 44.12-29.2A36 36 0 0 1 60 44a36 36 0 0 1 21.6-31A47.8 47.8 0 0 0 60 10Z"
          fill="url(#moon-anim-grad)"
        />

        {/* Subtle surface detail */}
        <circle cx="38" cy="50" r="5" fill="url(#moon-shadow)" opacity="0.4" />
        <circle cx="50" cy="72" r="3.5" fill="url(#moon-shadow)" opacity="0.3" />
        <circle cx="30" cy="65" r="2.5" fill="url(#moon-shadow)" opacity="0.25" />
      </motion.svg>

      {/* Orbiting sparkle 1 */}
      <motion.div
        className="absolute"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#ab9ff2',
          boxShadow: '0 0 8px rgba(171,159,242,0.8)',
          top: '15%',
          right: '20%',
        }}
        animate={{
          opacity: [0.3, 1, 0.3],
          scale: [0.8, 1.3, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Twinkling star 1 — top right */}
      <motion.svg
        className="absolute"
        style={{ top: '8%', right: '15%' }}
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        animate={{
          opacity: [0.2, 1, 0.2],
          scale: [0.7, 1.1, 0.7],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <path
          d="M7 0l1 4.5L12.5 7 8 8l-1 5-1-5L1.5 7 6 5.5 7 0Z"
          fill="#ab9ff2"
        />
      </motion.svg>

      {/* Twinkling star 2 — bottom left */}
      <motion.svg
        className="absolute"
        style={{ bottom: '18%', left: '12%' }}
        width="10"
        height="10"
        viewBox="0 0 14 14"
        fill="none"
        animate={{
          opacity: [0.15, 0.8, 0.15],
          scale: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.8,
        }}
      >
        <path
          d="M7 0l1 4.5L12.5 7 8 8l-1 5-1-5L1.5 7 6 5.5 7 0Z"
          fill="#c4bbf7"
        />
      </motion.svg>

      {/* Twinkling star 3 — right center */}
      <motion.svg
        className="absolute"
        style={{ top: '40%', right: '5%' }}
        width="8"
        height="8"
        viewBox="0 0 14 14"
        fill="none"
        animate={{
          opacity: [0.1, 0.7, 0.1],
          scale: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        }}
      >
        <path
          d="M7 0l1 4.5L12.5 7 8 8l-1 5-1-5L1.5 7 6 5.5 7 0Z"
          fill="#e0dbfa"
        />
      </motion.svg>

      {/* Small floating dots */}
      <motion.div
        className="absolute"
        style={{
          width: 3,
          height: 3,
          borderRadius: '50%',
          background: '#c4bbf7',
          top: '25%',
          left: '18%',
        }}
        animate={{
          opacity: [0.2, 0.8, 0.2],
          y: [0, -3, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute"
        style={{
          width: 2,
          height: 2,
          borderRadius: '50%',
          background: '#ab9ff2',
          bottom: '30%',
          right: '25%',
        }}
        animate={{
          opacity: [0.1, 0.6, 0.1],
          y: [0, -4, 0],
        }}
        transition={{
          duration: 2.6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.2,
        }}
      />
    </div>
  );
}
