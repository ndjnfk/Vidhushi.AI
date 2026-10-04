import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";

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

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
