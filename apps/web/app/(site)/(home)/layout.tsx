import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, SITE_NAME, fetchPublic } from "@/lib/seo";
import { InitialHeroProvider } from "./InitialHero";

// Same main topic as the hero H1 ("tarot.heroTitle"), so Google gets one clear message.
const TITLE = `Online Tarot Reading by Vidushi Sharma | ${SITE_NAME}`;

// The home page lives in this route group only so it can have its own
// metadata: the canonical "/" also folds duplicates like "/?book=1" into it.
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DEFAULT_DESCRIPTION, url: "/" },
};

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  // The hero photo is the largest thing on the page (LCP): put the admin's
  // photo straight into the HTML instead of waiting for the client fetch.
  const home = await fetchPublic<{ hero_image_url: string | null }>("/site/home", 300);
  return <InitialHeroProvider url={home?.hero_image_url ?? null}>{children}</InitialHeroProvider>;
}
