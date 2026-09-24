import CartDrawer from "@/components/shop/CartDrawer";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

// Customer-facing site: header, cart and page padding. The admin panel
// (app/admin) has its own layout and never shows these.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <CartDrawer />
      <main className="flex-1 px-6 py-8">{children}</main>
      <SiteFooter />
    </>
  );
}
