"use client";

import {
  ensureSpectatorToken,
  regenerateSpectatorToken,
} from "@/app/(app)/turniere/spectator-actions";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useId, useState } from "react";

const btnOutline =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium text-app-ink shadow-sm transition hover:border-app-primary/40 active:scale-[0.99] sm:min-h-0 sm:px-3 sm:py-2";

type Props = {
  tournamentId: string;
  /** z. B. „Zuschauen“ in der Liste, „Zuschauer-Link“ auf der Detailseite */
  label?: string;
  className?: string;
};

export function SpectatorShareButton({
  tournamentId,
  label = "Zuschauer-Link",
  className,
}: Props) {
  const dialogTitleId = useId();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const watchUrl =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/zuschauen/${token}`
      : token
        ? `/zuschauen/${token}`
        : "";

  const loadToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await ensureSpectatorToken(tournamentId);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      setToken(null);
      return;
    }
    setToken(res.token);
  }, [tournamentId]);

  useEffect(() => {
    if (!open) return;
    void loadToken();
  }, [open, loadToken]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleRegenerate() {
    if (
      !window.confirm(
        "Neuen Link erzeugen? Der bisherige QR-Code und die alte URL funktionieren dann nicht mehr.",
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    const res = await regenerateSpectatorToken(tournamentId);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setToken(res.token);
    setCopied(false);
  }

  async function handleCopy() {
    if (!watchUrl) return;
    try {
      await navigator.clipboard.writeText(watchUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Zwischenablage nicht verfügbar.");
    }
  }

  return (
    <>
      <button
        type="button"
        className={className ?? btnOutline}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-app-ink/40 p-4 sm:items-center sm:p-8"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="max-h-[min(90vh,40rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-app-border bg-app-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={dialogTitleId}
              className="text-lg font-semibold text-app-ink"
            >
              Zuschauer einladen
            </h2>
            <p className="mt-2 text-sm text-app-muted">
              Ohne Anmeldung nur lesen: Ergebnisse und Tabellen, keine Bearbeitung.
            </p>

            {loading ? (
              <p className="mt-6 text-sm text-app-muted">Wird geladen…</p>
            ) : null}

            {error ? (
              <p
                className="mt-4 rounded-xl border border-red-200/90 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {token && watchUrl ? (
              <div className="mt-6 space-y-5">
                <div className="flex justify-center rounded-xl border border-app-border/80 bg-app-surface/50 p-4">
                  <QRCodeSVG
                    value={watchUrl}
                    size={200}
                    level="M"
                    marginSize={2}
                    className="h-auto w-full max-w-[200px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-app-subtle">
                    Link
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <input
                      readOnly
                      value={watchUrl}
                      className="min-w-0 flex-1 rounded-xl border border-app-border bg-app-canvas/80 px-3 py-2 text-xs text-app-ink sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => void handleCopy()}
                      className="shrink-0 rounded-xl bg-app-primary px-4 py-2 text-sm font-medium text-app-card shadow-sm transition hover:bg-app-primary-hover"
                    >
                      {copied ? "Kopiert" : "Kopieren"}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRegenerate()}
                  disabled={loading}
                  className="text-sm font-medium text-app-primary underline-offset-2 hover:underline disabled:opacity-50"
                >
                  Neuen Link erzeugen (alter wird ungültig)
                </button>
              </div>
            ) : null}

            <div className="mt-8 flex justify-end gap-2 border-t border-app-border/70 pt-5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-app-border bg-app-surface/60 px-4 py-2 text-sm font-medium text-app-ink"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
