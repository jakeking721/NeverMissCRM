// src/components/PageShell.tsx
import React from "react";

type Props = {
  children: React.ReactNode;
  faintFlag?: boolean;
  /** later: noShell?: boolean; title?: string; etc. */
};

export default function PageShell({ children, faintFlag = false }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      {/* Faint flag bg */}
      {faintFlag && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0"
          style={{
            background: "url('/flag-bg.jpg') center center / cover no-repeat",
            opacity: 0.12,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Page content */}
      <main className="relative z-10 flex-1 py-6">{children}</main>
    </div>
  );
}
