import { NO_INDEX, pageMetadata } from "@/lib/seo";

export const metadata = { ...pageMetadata("Log In", "Log in to your Vidushi Ji account to manage consultations, rituals and shop orders.", "/account/login"), ...NO_INDEX };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
