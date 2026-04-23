import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { OverlayButton } from "./OverlayButton";

export interface StartScreenVerb {
  icon: string;
  text: string;
}

interface StartScreenProps {
  title: string;
  subtitle?: string;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  children?: ReactNode;
  /**
   * Three verbs shown as teaser chips. Defaults suit the sea game; each
   * extracted game should pass its own to set expectations before the
   * first frame of gameplay.
   */
  verbs?: StartScreenVerb[];
  /**
   * Top-color glow + title color. Defaults to `var(--color-glow)`. The
   * same CSS var is used in the title text shadow and the verb chip
   * border — override when the grove palette needs firefly amber.
   */
  glowColor?: string;
  /**
   * Optional override for the glow drop used in the title text shadow
   * RGBA triplet, e.g. "107, 230, 193". When omitted we use a generic
   * gradient that reads on the sea palette.
   */
  glowRgb?: string;
  /** Background gradient layers. Override to set a grove vs. void mood. */
  background?: string;
  /** Class for a lightweight "display-face" override (e.g. "bs-display", "ef-display"). */
  displayClassName?: string;
}

const DEFAULT_VERBS: StartScreenVerb[] = [
  { icon: "◉", text: "Collect bioluminescence" },
  { icon: "⟡", text: "Read the bottom banner" },
  { icon: "⇡", text: "Surface before oxygen ends" },
];

const DEFAULT_BACKGROUND = [
  "radial-gradient(ellipse 80% 60% at center 40%, rgba(14, 79, 85, 0.45), transparent 65%)",
  "radial-gradient(ellipse 40% 40% at center 60%, rgba(107, 230, 193, 0.08), transparent 70%)",
  "linear-gradient(180deg, rgba(5, 10, 20, 0.85) 0%, rgba(5, 10, 20, 0.95) 100%)",
].join(", ");

export function StartScreen({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  children,
  verbs = DEFAULT_VERBS,
  glowColor = "var(--color-glow)",
  glowRgb = "107, 230, 193",
  background = DEFAULT_BACKGROUND,
  displayClassName = "bs-display",
}: StartScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        background,
        color: "var(--color-fg)",
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      <FloatingGlow count={6} color={glowColor} glowRgb={glowRgb} />

      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className={displayClassName}
        style={{
          position: "relative",
          fontSize: "clamp(2.5rem, 9vw, 5rem)",
          margin: 0,
          fontWeight: 500,
          color: glowColor,
          textShadow: `0 0 24px rgba(${glowRgb}, 0.45), 0 0 48px rgba(${glowRgb}, 0.18)`,
          letterSpacing: "0.01em",
        }}
      >
        {title}
      </motion.h1>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.88 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{
            position: "relative",
            marginTop: "1rem",
            fontSize: "clamp(0.95rem, 2.4vw, 1.1rem)",
            color: "var(--color-fg-muted)",
            maxWidth: "42ch",
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.6 }}
        style={{
          position: "relative",
          marginTop: "1.75rem",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0.5rem",
        }}
      >
        {verbs.map((verb) => {
          const chipStyle: CSSProperties = {
            padding: "0.4rem 0.8rem",
            border: `1px solid rgba(${glowRgb}, 0.25)`,
            borderRadius: 999,
            fontFamily: "var(--font-body)",
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: glowColor,
            background: `rgba(${glowRgb}, 0.06)`,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          };
          return (
            <div key={verb.text} style={chipStyle}>
              <span style={{ opacity: 0.7 }}>{verb.icon}</span>
              <span>{verb.text}</span>
            </div>
          );
        })}
      </motion.div>

      {children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          style={{
            position: "relative",
            marginTop: "1.75rem",
            pointerEvents: "auto",
          }}
        >
          {children}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.25, duration: 0.6 }}
        style={{
          position: "relative",
          marginTop: "2.25rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          justifyContent: "center",
          pointerEvents: "auto",
        }}
      >
        <OverlayButton onClick={primaryAction.onClick}>
          {primaryAction.label}
        </OverlayButton>
        {secondaryAction && (
          <OverlayButton variant="ghost" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </OverlayButton>
        )}
      </motion.div>
    </motion.div>
  );
}

function FloatingGlow({
  count,
  color,
  glowRgb,
}: {
  count: number;
  color: string;
  glowRgb: string;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const delay = i * 0.7;
        const size = 4 + (i % 3) * 3;
        const startX = ((i * 47) % 100) - 10;
        const driftY = 8 + (i % 4) * 6;
        return (
          <motion.div
            key={i}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.65, 0],
              y: [driftY, -driftY, driftY],
              x: [0, (i % 2 ? 12 : -12), 0],
            }}
            transition={{
              delay,
              duration: 6 + (i % 3),
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              top: `${20 + ((i * 11) % 55)}%`,
              left: `${startX}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 14px rgba(${glowRgb}, 0.55), 0 0 30px rgba(${glowRgb}, 0.25)`,
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
}
