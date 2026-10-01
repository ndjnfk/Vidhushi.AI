import { NO_INDEX } from "@/lib/seo";

// Per-user page: kept out of search results.
export const metadata = NO_INDEX;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
