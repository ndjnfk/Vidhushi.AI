"use client";

import { useEffect } from "react";

// Locks page scroll while an overlay (drawer, modal) is open. Pads by the
// scrollbar's width so the layout doesn't jump when it disappears.
export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const scrollbar = window.innerWidth - root.clientWidth;
    const prev = { overflow: root.style.overflow, paddingRight: root.style.paddingRight };
    root.style.overflow = "hidden";
    root.style.paddingRight = `${scrollbar}px`;
    return () => {
      root.style.overflow = prev.overflow;
      root.style.paddingRight = prev.paddingRight;
    };
  }, [active]);
}
