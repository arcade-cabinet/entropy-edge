import { useEffect, useState } from "react";

export interface ResponsiveState {
  isMobile: boolean;
  isPortrait: boolean;
  width: number;
  height: number;
}

/**
 * Lightweight viewport observer. Replaces the cabinet's `useResponsive`
 * from `@app/shared` with a dependency-free local version.
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => readState());
  useEffect(() => {
    const update = () => setState(readState());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
  return state;
}

function readState(): ResponsiveState {
  if (typeof window === "undefined") {
    return { isMobile: false, isPortrait: false, width: 1280, height: 720 };
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    width: w,
    height: h,
    isMobile: w < 768,
    isPortrait: h > w,
  };
}
