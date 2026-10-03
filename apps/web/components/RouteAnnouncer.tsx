"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Announces the destination of a client-side navigation to assistive tech.
 * Renders an `aria-live` region only; focus is never moved.
 */
export function RouteAnnouncer() {
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const initialLoad = useRef(true);

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const heading = document.querySelector<HTMLElement>("main h1, #main-content h1, h1");
      setMessage(heading?.textContent?.trim() || document.title);
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
