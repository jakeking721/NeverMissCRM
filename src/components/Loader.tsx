import React from "react";

/**
 * Branded loading spinner used across protected routes and redirects.
 * Designed to be responsive and accessible on mobile and desktop.
 */
export default function Loader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
