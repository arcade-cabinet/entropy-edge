import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GameOverScreenProps {
  title: string;
  subtitle?: string;
  /** Button(s) to render below the title. Renamed alias of `children`. */
  actions?: ReactNode;
  children?: ReactNode;
  /** Title color. Defaults to `var(--color-glow)`. */
  accent?: string;
  /** Glow RGBA triplet for title shadow. Defaults to the sea palette. */
  glowRgb?: string;
  /** Background gradient override. Defaults to the sea palette. */
  background?: string;
  /** Class for the display-face override (bs-display / ef-display / ee-display). */
  displayClassName?: string;
}

const DEFAULT_BACKGROUND =
  "radial-gradient(ellipse at center, rgba(14, 79, 85, 0.5), rgba(5, 10, 20, 0.95) 70%)";

export function GameOverScreen({
  title,
  subtitle,
  actions,
  children,
  accent = "var(--color-glow)",
  glowRgb = "107, 230, 193",
  background = DEFAULT_BACKGROUND,
  displayClassName = "bs-display",
}: GameOverScreenProps) {
  const body = actions ?? children;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background,
        color: "var(--color-fg)",
        textAlign: "center",
        pointerEvents: "auto",
        zIndex: 60,
      }}
    >
      <motion.h2
        className={displayClassName}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{
          fontSize: "clamp(2rem, 7vw, 3.75rem)",
          margin: 0,
          fontWeight: 500,
          color: accent,
          textShadow: `0 0 20px rgba(${glowRgb}, 0.35)`,
        }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            marginTop: "0.75rem",
            fontSize: "clamp(0.95rem, 2.2vw, 1.1rem)",
            color: "var(--color-fg-muted)",
            maxWidth: "40ch",
          }}
        >
          {subtitle}
        </motion.p>
      )}
      {body && (
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {body}
        </div>
      )}
    </motion.div>
  );
}
