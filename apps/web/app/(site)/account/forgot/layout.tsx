import { NO_INDEX, pageMetadata } from "@/lib/seo";

export const metadata = { ...pageMetadata("Reset Your Password", "Forgot your Vidushi Ji password? Reset it with your email and security question.", "/account/forgot"), ...NO_INDEX };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
