"use client";

import { ReactNode } from "react";
import { SWRConfig } from "swr";

/**
 * SWR Persistence Provider
 * Allows SWR to save data to localStorage so it survives page refreshes.
 */
function localStorageProvider() {
  if (typeof window === "undefined") return new Map();
  
  // When initializing, we restore from localStorage
  const map = new Map<string, any>(
    JSON.parse(localStorage.getItem("swr-cache") || "[]")
  );

  // Before unloading, we save to localStorage
  window.addEventListener("beforeunload", () => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    try {
      localStorage.setItem("swr-cache", appCache);
    } catch (e) {
      console.warn("SWR Cache too large for localStorage, clearing...");
      localStorage.removeItem("swr-cache");
    }
  });

  return map;
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{ 
        provider: localStorageProvider,
        revalidateOnFocus: false, // Prevents aggressive refetching when switching tabs
        dedupingInterval: 5000,   // Prevents duplicate requests within 5 seconds
      }}
    >
      {children}
    </SWRConfig>
  );
}
