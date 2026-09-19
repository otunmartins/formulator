"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

export const NOT_CONNECTED = "Not connected yet";

export type NoticeTone = "info" | "error";

type Notify = (message: string, tone?: NoticeTone) => void;

const NoticeContext = createContext<Notify>(() => {});

interface Notice {
  message: string;
  tone: NoticeTone;
  key: number;
}

/**
 * Brief notices: "Not connected yet" for stubbed actions (role="status"), and action errors
 * (role="alert") so nothing fails silently (CODING_STANDARDS §8, §10).
 */
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  const notify = useCallback<Notify>((message, tone = "info") => {
    setNotice({ message, tone, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), notice.tone === "error" ? 8000 : 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const regionClass =
    "pointer-events-none fixed inset-x-0 bottom-[calc(var(--footer-h)+72px)] z-50 flex justify-center";

  return (
    <NoticeContext.Provider value={notify}>
      {children}
      <div role="status" aria-live="polite" className={regionClass}>
        {notice?.tone === "info" && (
          <div
            key={notice.key}
            className="flex items-center gap-2 rounded-control bg-text px-3.5 py-2 text-[13px] text-on-accent shadow-lg"
          >
            <Icon name="info" />
            {notice.message}
          </div>
        )}
      </div>
      <div role="alert" className={regionClass}>
        {notice?.tone === "error" && (
          <div
            key={notice.key}
            className="flex items-center gap-2 rounded-control border border-alert-border bg-alert-fill px-3.5 py-2 text-[13px] text-alert-text shadow-lg"
          >
            <Icon name="triangle-alert" />
            {notice.message}
          </div>
        )}
      </div>
    </NoticeContext.Provider>
  );
}

export function useNotice() {
  return useContext(NoticeContext);
}
