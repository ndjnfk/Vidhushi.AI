"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ApiError } from "@/lib/api";
import { clearAllData } from "../_lib/api";

const INPUT = "w-full border border-line bg-transparent px-3 py-2.5 text-cream outline-none placeholder:text-cream/35 focus:border-gold";
const WORD = "DELETE";

// "Clear data" in the admin sidebar: deletes all customers (not admins),
// consultations, products and orders. Guarded by typing DELETE and
// re-entering the admin password.
export default function ClearDataButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 border border-red-400/40 px-3 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-red-300/90 transition-colors hover:border-red-400 hover:bg-red-500/10 hover:text-red-200">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
        </svg>
        Clear data
      </button>
      {open && createPortal(<Dialog onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function Dialog({ onClose }: { onClose: () => void }) {
  const [word, setWord] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await clearAllData(password, word);
      setDone(r.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="clear-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 font-body text-cream backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !busy && done === null && onClose()}>
      <div className="w-full max-w-md border border-red-400/40 bg-ink-soft p-6 md:p-8">
        {done !== null ? (
          <>
            <h2 id="clear-title" className="font-display text-2xl uppercase tracking-[0.04em] text-gold">Data cleared</h2>
            <p className="mt-3 text-sm text-cream/75">{done} records were deleted. Admin accounts and site settings were kept.</p>
            <button type="button" onClick={() => window.location.reload()}
              className="mt-6 w-full bg-white px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-ink hover:bg-gold">
              OK
            </button>
          </>
        ) : (
          <form onSubmit={submit} autoComplete="off">
            {/* Soaks up the browser's saved-login autofill so it can't land in the DELETE box. */}
            <input type="text" name="username" autoComplete="username" tabIndex={-1} aria-hidden="true" className="hidden" readOnly />
            <h2 id="clear-title" className="font-display text-2xl uppercase tracking-[0.04em] text-red-300">Clear data?</h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/75">This permanently deletes:</p>
            <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-cream/85">
              <li>All users (admin accounts are kept)</li>
              <li>All consultations, with their chats and call history</li>
              <li>All products</li>
              <li>All orders</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-cream/60">
              Site settings, home page, UPI QR code and contact messages stay as they are.
            </p>
            <p className="mt-3 text-sm font-bold text-red-300">This cannot be undone.</p>

            <label className="mt-6 block">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/65">Type {WORD} to confirm</span>
              <input className={`${INPUT} mt-1.5 font-mono tracking-[0.2em]`} value={word} onChange={(e) => setWord(e.target.value)}
                name="confirm-word" autoComplete="off" data-lpignore="true" spellCheck={false} placeholder={WORD} autoFocus />
            </label>
            <label className="mt-4 block">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/65">Your admin password</span>
              <input type="password" className={`${INPUT} mt-1.5`} value={password} onChange={(e) => setPassword(e.target.value)}
                name="confirm-password" autoComplete="new-password" required />
            </label>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={onClose} disabled={busy}
                className="flex-1 border border-cream/30 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] hover:border-gold hover:text-gold disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={busy || word.trim() !== WORD || !password}
                className="flex-1 bg-red-600 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40">
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
