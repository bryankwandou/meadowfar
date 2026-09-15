"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { detectLang, saveLang, type Lang } from "@/lib/i18n";

// Shared language state for the marketing pages. English renders on the
// server; the stored/browser preference takes over right after hydration.
const EVT = "meadowfar-lang-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

const serverLang = (): Lang => "en";

export function useLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(subscribe, detectLang, serverLang);

  const setLang = useCallback((l: Lang) => {
    saveLang(l);
    window.dispatchEvent(new Event(EVT));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return [lang, setLang];
}

export type Dict = Record<string, { id: string; en: string }>;
