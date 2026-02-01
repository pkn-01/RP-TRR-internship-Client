// Use environment variable, or fallback to production URL, then localhost for dev
const getBaseUrl = () => {
  // Check window first to force proxy usage on client (Browser)
  if (typeof window !== 'undefined') {
    // In the browser, use relative path to let Next.js rewrites handle the proxying
    // This avoids CORS and Mixed Content issues on mobile/ngrok
    return "";
  }

  // Then check env var (for Server-Side Rendering)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Fallback to production
  return 'https://rp-trr-server-internship.vercel.app';
};

const API_URL = getBaseUrl();

export const API_BASE_URL = API_URL;

interface FetchOptions extends RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export async function apiFetch(url: string, options?: string | FetchOptions | "GET" | "POST" | "PUT" | "DELETE", body?: any) {
  // Support both 'access_token' (LINE Login) and 'token' (normal login)
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");

  let method = "GET";
  let requestBody: any = undefined;
  let headers: Record<string, string> = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  if (typeof options === "string") {
    method = options;
    requestBody = body ? JSON.stringify(body) : undefined;
    headers["Content-Type"] = "application/json";
  } else if (typeof options === "object" && options !== null) {
    method = options.method || "GET";
    headers = {
      ...headers,
      ...options.headers,
    };
    if (options.body) {
      if (options.body instanceof FormData) {
        requestBody = options.body;
        delete headers["Content-Type"];
      } else if (typeof options.body === "string") {
        requestBody = options.body;
        headers["Content-Type"] = "application/json";
      } else {
        requestBody = JSON.stringify(options.body);
        headers["Content-Type"] = "application/json";
      }
    } else if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  } else {
    headers["Content-Type"] = "application/json";
  }

  try {
    // Determine the full URL
    let fullUrl = API_URL + url;

    // Fix for 405 Error: If using relative path (API_URL is empty) and URL doesn't start with /api, 
    // prepend /api so it matches the Next.js rewrite rule.
    if (API_URL === "" && !url.startsWith("/api")) {
       fullUrl = `/api${url.startsWith("/") ? "" : "/"}${url}`;
    }

    const res = await fetch(fullUrl, {
      method,
      headers,
      body: requestBody,
    });

    if (!res.ok) {
      if (res.status === 401) {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          localStorage.removeItem('role');
          window.location.href = '/login';
          throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        }
      }

      try {
        const clonedRes = res.clone();
        const error = await clonedRes.json();
        throw new Error(error.message || `เกิดข้อผิดพลาด: ${res.status}`);
      } catch {
        throw new Error(`เกิดข้อผิดพลาด: ${res.status} ${res.statusText}`);
      }
    }

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    // Handle network errors (Failed to fetch)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const targetUrl = API_URL + url;
      throw new Error(`ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (${targetUrl}) กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต`);
    }
    throw error;
  }
}

