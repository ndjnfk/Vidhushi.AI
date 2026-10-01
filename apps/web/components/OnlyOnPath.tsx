"use client";

import { usePathname } from "next/navigation";

// Renders its (server-rendered) children only on one exact path, so a layout
// can add content to its index page without repeating it on child routes.
export default function OnlyOnPath({ path, children }: { path: string; children: React.ReactNode }) {
  return usePathname() === path ? <>{children}</> : null;
}
