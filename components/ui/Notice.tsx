"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

export const NOT_CONNECTED = "Not connected yet";

const NoticeContext = createContext<(message: string) => void>(() => {});

/** Brief notices, e.g. "Not connected yet" for stubbed actions (never fail silently). */
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ message: string; key: number } | null>(null);

  const notify = useCallback((message: string) => {
    setNotice({ message, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <NoticeContext.Provider value={notify}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--footer-h)+72px)] z-50 flex justify-center"
      >
        {notice && (
          <div
            key={notice.key}
            className="flex items-center gap-2 rounded-control bg-text px-3.5 py-2 text-[13px] text-on-accent shadow-lg"
          >
            <Icon name="info" />
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
