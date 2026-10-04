import { NO_INDEX, pageMetadata } from "@/lib/seo";

export const metadata = { ...pageMetadata("Create an Account", "Create a free Vidushi Ji account to book consultations, enquire about rituals and order healing bracelets.", "/account/register"), ...NO_INDEX };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
