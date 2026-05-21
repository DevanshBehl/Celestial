import { motion } from 'framer-motion';

interface Props {
  size?: number;
  className?: string;
}

/**
 * Static crescent moon logo (small, header use).
 * Pure moonlight colors — warm whites and silvers.
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
        <linearGradient id="smoon" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#e4e4e7" />
          <stop offset="100%" stopColor="#a1a1aa" />
        </linearGradient>
        <linearGradient id="sspk" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d4d4d8" />
        </linearGradient>
      </defs>

      {/* Crescent moon */}
      <path
        d="M14 4C8.477 4 4 8.477 4 14s4.477 10 10 10a10 10 0 0 0 9.192-6.083A7.5 7.5 0 0 1 14 10.5 7.5 7.5 0 0 1 18.5 4.05 9.96 9.96 0 0 0 14 4Z"
        fill="url(#smoon)"
      />

      {/* 4-pointed star */}
      <path
        d="M21 5l.6 1.4L23 7l-1.4.6L21 9l-.6-1.4L19 7l1.4-.6L21 5Z"
        fill="url(#sspk)"
      />

      {/* Tiny dot */}
      <circle cx="23.5" cy="11.5" r="1" fill="#e4e4e7" opacity="0.8" />
    </svg>
  );
}

// ---- Starfield ---------------------------------------------------------------
// All colors are moonlight whites / warm silvers — zero purple.

function StarField({ count, area }: { count: number; area: number }) {
  // Silver/grey star colors
  const STAR_COLORS = ['#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8', '#a1a1aa'];

  const stars = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const radius = area * 0.3 + Math.random() * area * 0.2;
    const x = Math.cos(angle) * radius + area / 2;
    const y = Math.sin(angle) * radius + area / 2;
    const sz = 1 + Math.random() * 2;
    const dur = 1.5 + Math.random() * 2.5;
    const delay = Math.random() * 2;
    const color = STAR_COLORS[i % STAR_COLORS.length];

    return { x, y, sz, dur, delay, color, id: i };
  });

  return (
    <>
      {stars.map(s => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            width: s.sz,
            height: s.sz,
            left: s.x,
            top: s.y,
            background: s.color,
            boxShadow: `0 0 ${s.sz * 3}px rgba(255,252,240,0.5)`,
          }}
          animate={{
            opacity: [0.1, 0.9, 0.1],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: s.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: s.delay,
          }}
        />
      ))}
    </>
  );
}

// ---- 4-pointed star -----------------------------------------------------------

function FourPointStar({
  x, y, size, color, delay, duration,
}: {
  x: string; y: string; size: number; color: string; delay: number; duration: number;
}) {
  return (
    <motion.svg
      className="absolute"
      style={{ left: x, top: y }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        opacity: [0.1, 1, 0.1],
        scale: [0.5, 1.2, 0.5],
        rotate: [0, 15, 0],
      }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <path d="M12 0l2 8 8 4-8 4-2 8-2-8-8-4 8-4 2-8Z" fill={color} />
    </motion.svg>
  );
}

/**
 * Large animated crescent moon for Unlock / Onboarding screens.
 *
 * 100% moonlight/starlight colors — warm whites, silvers, pale ivories.
 * NO purple anywhere in the animation.
 *
 * Features:
 * - Warm-white crescent with subtle crater texture
 * - Multi-layer moonlight glow halos
 * - 6 animated light rays
 * - 16-particle starfield (all warm whites)
 * - 5 decorative twinkling 4-pointed stars
 * - 2 shooting stars
 * - Gentle float + rotation
 */
export function AnimatedMoon({ size = 100 }: { size?: number }) {
  const area = size * 1.8;

  return (
    <div className="relative flex items-center justify-center" style={{ width: area, height: area }}>
      {/* ---- Starfield ---- */}
      <StarField count={16} area={area} />

      {/* ---- Outer warm halo ---- */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 1.6,
          height: size * 1.6,
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(212,212,216,0.02) 50%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.65, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ---- Inner bright glow ---- */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 1.1,
          height: size * 1.1,
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(228,228,231,0.05) 40%, transparent 65%)',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      {/* ---- Moonlight rays ---- */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.div
          key={`ray-${i}`}
          className="absolute"
          style={{
            width: 1,
            height: size * 0.55,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)',
            transformOrigin: 'bottom center',
            left: '50%',
            top: '50%',
            marginLeft: -0.5,
            marginTop: -size * 0.55,
            transform: `rotate(${angle + i * 3}deg)`,
          }}
          animate={{ opacity: [0.03, 0.22, 0.03], scaleY: [0.8, 1, 0.8] }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.4,
          }}
        />
      ))}

      {/* ---- Main crescent SVG ---- */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 2 }}
        animate={{
          y: [0, -10, 0],
          rotate: [0, 3, 0],
          filter: [
            'drop-shadow(0 0 10px rgba(255,255,255,0.20)) drop-shadow(0 4px 15px rgba(212,212,216,0.15))',
            'drop-shadow(0 0 25px rgba(255,255,255,0.40)) drop-shadow(0 4px 30px rgba(212,212,216,0.25))',
            'drop-shadow(0 0 10px rgba(255,255,255,0.20)) drop-shadow(0 4px 15px rgba(212,212,216,0.15))',
          ],
        }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          {/* Moon body: pure warm whites → pale ivory */}
          <linearGradient id="moon-body" x1="15%" y1="5%" x2="85%" y2="95%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#f4f4f5" />
            <stop offset="50%" stopColor="#e4e4e7" />
            <stop offset="75%" stopColor="#d4d4d8" />
            <stop offset="100%" stopColor="#a1a1aa" />
          </linearGradient>

          {/* Inner highlight shimmer */}
          <radialGradient id="moon-hi" cx="45%" cy="35%" r="40%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.20)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Crater shading */}
          <radialGradient id="crater" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(161,161,170,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Crescent body */}
        <path
          d="M60 8C32.39 8 10 30.39 10 58s22.39 50 50 50a50 50 0 0 0 45.96-30.42A37.5 37.5 0 0 1 60 43.5a37.5 37.5 0 0 1 22.5-32.27A49.75 49.75 0 0 0 60 8Z"
          fill="url(#moon-body)"
        />

        {/* Inner glow overlay */}
        <path
          d="M60 8C32.39 8 10 30.39 10 58s22.39 50 50 50a50 50 0 0 0 45.96-30.42A37.5 37.5 0 0 1 60 43.5a37.5 37.5 0 0 1 22.5-32.27A49.75 49.75 0 0 0 60 8Z"
          fill="url(#moon-hi)"
        />

        {/* Surface craters */}
        <circle cx="36" cy="48" r="6" fill="url(#crater)" opacity="0.6" />
        <circle cx="48" cy="74" r="4" fill="url(#crater)" opacity="0.5" />
        <circle cx="28" cy="66" r="3" fill="url(#crater)" opacity="0.4" />
        <circle cx="42" cy="56" r="2" fill="url(#crater)" opacity="0.35" />
        <circle cx="32" cy="38" r="2.5" fill="url(#crater)" opacity="0.3" />
      </motion.svg>

      {/* ---- Decorative 4-pointed stars (all moonlight colors) ---- */}
      <FourPointStar x="78%" y="8%"  size={16} color="#fffef8" delay={0}   duration={2.5} />
      <FourPointStar x="85%" y="35%" size={10} color="#f0e8d0" delay={0.8} duration={3.2} />
      <FourPointStar x="8%"  y="15%" size={12} color="#fff8e8" delay={1.2} duration={2.8} />
      <FourPointStar x="15%" y="75%" size={8}  color="#e8e0c8" delay={1.8} duration={3.5} />
      <FourPointStar x="72%" y="70%" size={11} color="#fffdf4" delay={0.5} duration={2.2} />

      {/* ---- Orbiting warm particle ---- */}
      <motion.div
        className="absolute"
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: '#fff8e8',
          boxShadow: '0 0 8px rgba(255,248,232,0.7), 0 0 16px rgba(240,232,200,0.4)',
          top: '12%',
          right: '30%',
          zIndex: 3,
        }}
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.5, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ---- Shooting star 1 ---- */}
      <motion.div
        className="absolute"
        style={{
          width: 22,
          height: 1.5,
          background: 'linear-gradient(90deg, rgba(255,252,240,0.8), transparent)',
          borderRadius: 1,
          top: '20%',
          right: '10%',
          zIndex: 1,
        }}
        animate={{
          x: [0, -50],
          y: [0, 25],
          opacity: [0, 0.9, 0],
          scaleX: [0.3, 1, 0.3],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 2, repeatDelay: 3 }}
      />

      {/* ---- Shooting star 2 ---- */}
      <motion.div
        className="absolute"
        style={{
          width: 16,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(240,232,200,0.7))',
          borderRadius: 1,
          top: '65%',
          left: '5%',
          zIndex: 1,
        }}
        animate={{
          x: [0, 40],
          y: [0, -20],
          opacity: [0, 0.7, 0],
          scaleX: [0.3, 1, 0.3],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 5, repeatDelay: 4 }}
      />
    </div>
  );
}
