import { motion } from 'framer-motion';

/**
 * Landing — the cold-start screen.
 *
 * Space Grotesk title, Inter tagline, three verb chips, one primary CTA.
 * Framer-motion fades the layers in staggered so the brand cadence is
 * consistent with bioluminescent-sea / cosmic-gardener landings.
 */

export interface LandingProps {
  onEnter: () => void;
}

const chipBase = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  border: '1px solid rgba(33, 212, 255, 0.35)',
  color: 'var(--color-beacon, #21d4ff)',
  borderRadius: 4,
  padding: '6px 14px',
};

export function Landing({ onEnter }: LandingProps) {
  return (
    <main
      style={{
        width: '100vw',
        height: '100svh',
        background: 'var(--color-bg, #07080a)',
        color: 'var(--color-fg, #dce1e8)',
        display: 'grid',
        placeItems: 'center',
        padding: 32,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 640,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          textAlign: 'center',
        }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="ee-display"
          style={{
            margin: 0,
            fontSize: 'clamp(44px, 9vw, 88px)',
            letterSpacing: '0.04em',
            color: 'var(--color-signal, #ff6b1a)',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          Entropy Edge
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            margin: 0,
            maxWidth: 520,
            color: 'var(--color-fg-muted, #7a8190)',
            fontSize: 'clamp(14px, 1.8vw, 17px)',
            lineHeight: 1.5,
          }}
        >
          Two builders, one lattice. Race the same tier-connectivity objective,
          brace what you build, and keep what was load-bearing when you claimed
          it.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 10,
            marginTop: 8,
          }}
        >
          <span style={chipBase}>Build upward</span>
          <span style={chipBase}>Brace every span</span>
          <span style={chipBase}>Claim the tier</span>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          type="button"
          onClick={onEnter}
          className="ee-display"
          style={{
            marginTop: 24,
            padding: '14px 34px',
            background: 'var(--color-signal, #ff6b1a)',
            color: '#0c0a0a',
            border: 'none',
            borderRadius: 4,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 8px 28px rgba(255, 107, 26, 0.18)',
          }}
        >
          Enter the Lattice
        </motion.button>
      </div>
    </main>
  );
}
