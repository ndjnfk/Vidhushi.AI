import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Vidushi Ji",
  robots: { index: false, follow: false },
};

// Admin back office. Deliberately outside the (site) route group, so none of
// the customer site's header, cart or navigation appear here.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-1 flex-col bg-ink font-body text-cream">{children}</div>;
}
