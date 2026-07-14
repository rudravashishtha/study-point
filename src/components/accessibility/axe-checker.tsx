"use client";

import { useEffect } from "react";

export function AccessibilityChecker() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      (async () => {
        const axe = await import("@axe-core/react");
        const React = await import("react");
        const ReactDOM = await import("react-dom");
        axe.default(React.default, ReactDOM.default, 1000);
      })();
    }
  }, []);
  return null;
}
