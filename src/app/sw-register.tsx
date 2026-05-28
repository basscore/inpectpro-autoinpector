"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      (window as any).workbox === undefined // Pastikan tidak konflik jika ada library workbox lain
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log(
              "[Service Worker] Registered successfully with scope: ",
              registration.scope
            );
          })
          .catch((error) => {
            console.error("[Service Worker] Registration failed: ", error);
          });
      });
    }
  }, []);

  return null;
}
