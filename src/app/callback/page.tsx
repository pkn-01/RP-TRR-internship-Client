"use client";

import { Suspense } from "react";
import CallbackContent from "./callback-content";

function CallbackLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="animate-spin mb-4">
          <svg
            className="w-12 h-12 text-blue-600 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4a8 8 0 018 8m0 0a8 8 0 11-16 0 8 8 0 0116 0z"
            />
          </svg>
        </div>
        <p className="text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
}

export default function Callback() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackContent />
    </Suspense>
  );
}
