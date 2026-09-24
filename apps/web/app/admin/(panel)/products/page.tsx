"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Sparkle from "@/components/Sparkle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatPrice, type ProductOut } from "@/lib/shop";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { createProduct, listAdminProducts, updateProduct, uploadProductImage, type ProductIn } from "../../_lib/api";

const CATEGORIES = ["bracelet", "gemstone", "rudraksha", "yantra", "other"];
const MAX_BYTES = 3 * 1024 * 1024;
const INPUT = "w-full border border-line bg-transparent px-4 py-3 text-cream outline-none placeholder:text-cream/40 focus:border-gold";
const LABEL = "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70";
const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

// Add / edit one product. A chosen photo is uploaded after the product saves.
function ProductForm({ product, onClose, onSaved }: { product: ProductOut | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useLanguage();
  const [f, setF] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    compare: product?.compare_at_price != null ? String(product.compare_at_price) : "",
    category: product?.category ?? "bracelet",
    stock: product ? String(product.stock_quantity) : "10",
    active: product?.is_active ?? true,
  });
  const [photo, setPhoto] = useState<string | null>(null); // new photo (data URL), not yet uploaded
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  useLockBodyScroll(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setError(t("adminPay.badType"));
    if (file.size > MAX_BYTES) return setError(t("adminProducts.tooBig"));
    setError(null);
    setPhoto(await readAsDataUrl(file));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body: ProductIn = {
      name: f.name.trim(),
      description: f.description.trim(),
      price: Number(f.price),
      compare_at_price: f.compare.trim() ? Number(f.compare) : null,
      category: f.category,
      stock_quantity: Number(f.stock),
      is_active: f.active,
    };
    setBusy(true);
    setError(null);
    try {
      const saved = product ? await updateProduct(product.id, body) : await createProduct(body);
      if (photo) await uploadProductImage(saved.id, photo);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const preview = photo ?? product?.image_url ?? null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 font-body text-cream sm:p-6">
      <button type="button" aria-label={t("nav.close")} onClick={onClose} className="fixed inset-0 bg-black/70" />
      <form onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="pf-title"
        className="relative flex max-h-full w-full max-w-[760px] flex-col border border-line bg-ink shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-7 py-5">
          <h2 id="pf-title" className="font-display text-2xl uppercase tracking-[0.05em] text-gold">
            {t(product ? "adminProducts.edit" : "adminProducts.add")}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("nav.close")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-cream/35 text-gold hover:border-gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </header>

        <div className="no-scrollbar grid min-h-0 flex-1 gap-6 overflow-y-auto overscroll-contain px-7 py-6 md:grid-cols-[200px_1fr]">
          <div>
            <p className={LABEL}>{t("adminProducts.photo")}</p>
            <div className="mt-2 flex aspect-[3/4] items-center justify-center overflow-hidden border border-dashed border-cream/25 bg-ink-soft">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <Sparkle className="h-8 w-8 text-gold/40" />
              )}
            </div>
            <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} />
            <button type="button" onClick={() => file.current?.click()} className={`${BTN} mt-3 w-full border border-cream/40 hover:border-gold hover:text-gold`}>
              {t(preview ? "adminProducts.changePhoto" : "adminProducts.uploadPhoto")}
            </button>
            <p className="mt-2 text-xs text-cream/50">{t("adminProducts.photoHint")}</p>
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>{t("adminProducts.name")}</span>
              <input className={INPUT} value={f.name} onChange={set("name")} required maxLength={120} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>{t("adminProducts.price")} (₹)</span>
                <input className={INPUT} type="number" min={0} step="1" value={f.price} onChange={set("price")} required />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>{t("adminProducts.compare")} (₹)</span>
                <input className={INPUT} type="number" min={0} step="1" value={f.compare} onChange={set("compare")} placeholder={t("adminProducts.comparePh")} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>{t("adminProducts.category")}</span>
                <select className={`${INPUT} bg-ink`} value={f.category} onChange={set("category")}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{t(`shop.category.${c}`)}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>{t("adminProducts.stock")}</span>
                <input className={INPUT} type="number" min={0} step="1" value={f.stock} onChange={set("stock")} required />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>{t("adminProducts.description")}</span>
              <textarea className={`${INPUT} min-h-36 resize-y`} value={f.description} onChange={set("description")} maxLength={5000}
                placeholder={t("adminProducts.descriptionPh")} />
              <span className="text-xs text-cream/50">{t("adminProducts.descriptionHint")}</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={f.active} onChange={(e) => setF((x) => ({ ...x, active: e.target.checked }))}
                className="h-4 w-4 accent-[var(--color-gold)]" />
              <span className="text-sm text-cream/85">{t("adminProducts.visible")}</span>
            </label>
          </div>
        </div>

        <footer className="shrink-0 border-t border-line px-7 py-5">
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={busy} className={`${BTN} w-full bg-white py-4 text-ink hover:bg-gold`}>
            <Sparkle className="h-3 w-3 text-gold-deep" />
            {busy ? t("adminProducts.saving") : t("common.save")}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

export default function AdminProductsPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ProductOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProductOut | "new" | null>(null);

  const load = useCallback(() => {
    listAdminProducts().then(setRows).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);
  const close = useCallback(() => setEditing(null), []);

  async function toggle(p: ProductOut) {
    await updateProduct(p.id, { is_active: !p.is_active });
    load();
  }

  return (
    <div className="px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/70">{t("admin.panel")}</p>
            <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t("adminProducts.title")}</h1>
          </div>
          <button type="button" onClick={() => setEditing("new")} className={`${BTN} bg-white text-ink hover:bg-gold`}>
            <Sparkle className="h-3 w-3 text-gold-deep" />
            {t("adminProducts.add")}
          </button>
        </div>

        {!rows ? (
          <p className="mt-10 text-cream/70">{error ?? t("common.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="mt-10 text-cream/70">{t("admin.empty")}</p>
        ) : (
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {rows.map((p) => (
              <li key={p.id} className={`flex flex-wrap items-center gap-5 py-4 ${p.is_active ? "" : "opacity-55"}`}>
                <div className="h-20 w-16 shrink-0 overflow-hidden bg-ink-soft">
                  {p.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-[200px] flex-1">
                  <p className="font-display text-xl uppercase tracking-[0.04em] text-gold">{p.name}</p>
                  <p className="mt-1 text-sm text-cream/60">
                    {t(`shop.category.${p.category}`)} · {t("adminProducts.stock")}: {p.stock_quantity}
                    {!p.is_active && <> · <span className="text-cream">{t("adminProducts.hidden")}</span></>}
                  </p>
                </div>
                <p className="w-32 text-right">
                  {p.compare_at_price != null && <s className="mr-2 text-sm text-cream/50">{formatPrice(p.compare_at_price)}</s>}
                  <span className="text-cream">{formatPrice(p.price)}</span>
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing(p)} className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>
                    {t("adminProducts.editBtn")}
                  </button>
                  <button type="button" onClick={() => toggle(p)} className={`${BTN} border border-line text-cream/70 hover:border-gold hover:text-gold`}>
                    {t(p.is_active ? "adminProducts.hide" : "adminProducts.show")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <ProductForm product={editing === "new" ? null : editing} onClose={close} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}
