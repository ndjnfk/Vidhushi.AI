"use client";

import { createContext, useContext } from "react";

// The admin's hero photo as the server saw it, so the first HTML already has
// the right <img> (the page's own content fetch only runs after hydration).
const InitialHero = createContext<string | null>(null);

export function InitialHeroProvider({ url, children }: { url: string | null; children: React.ReactNode }) {
  return <InitialHero.Provider value={url}>{children}</InitialHero.Provider>;
}

export const useInitialHero = () => useContext(InitialHero);
