import ShopView from "@/components/shop/ShopView";
import { JsonLd, SITE_URL, fetchPublic, snippet } from "@/lib/seo";
import type { ProductOut } from "@/lib/shop";

// Server-rendered so search engines see every product's name, price and
// description; the grid itself stays interactive (tabs, cart, live updates).
export default async function ShopPage() {
  const products = await fetchPublic<ProductOut[]>("/shop/products", 60);

  return (
    <>
      {products && products.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Healing bracelets and gemstones",
            itemListElement: products.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Product",
                name: p.name,
                sku: p.id,
                ...(p.description && { description: snippet(p.description, 300) }),
                ...(p.image_url && { image: p.image_url }),
                category: p.category,
                offers: [
                  { price: p.price, priceCurrency: "INR" },
                  ...(p.price_usd != null ? [{ price: p.price_usd, priceCurrency: "USD" }] : []),
                ].map((o) => ({
                  "@type": "Offer",
                  url: `${SITE_URL}/shop`,
                  ...o,
                  availability: p.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                })),
              },
            })),
          }}
        />
      )}
      <ShopView initial={products} />
    </>
  );
}
