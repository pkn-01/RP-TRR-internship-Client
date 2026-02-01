"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is a LINE OAuth callback from root path
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const liffClientId = searchParams.get("liffClientId");
    const liffRedirectUri = searchParams.get("liffRedirectUri");

    if (code || state || liffClientId || liffRedirectUri) {
      // This is a LINE OAuth callback - redirect to /callback with parameters
      const callbackUrl = new URL("/callback", window.location.origin);
      if (code) callbackUrl.searchParams.append("code", code);
      if (state) callbackUrl.searchParams.append("state", state);
      if (liffClientId)
        callbackUrl.searchParams.append("liffClientId", liffClientId);
      if (liffRedirectUri)
        callbackUrl.searchParams.append("liffRedirectUri", liffRedirectUri);

      router.push(callbackUrl.toString().replace(window.location.origin, ""));
    } else {
      // Not a callback, redirect to login
      router.push("/login/admin");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
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
