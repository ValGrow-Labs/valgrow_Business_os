export function getApiBaseUrl(): string {
  // 1. Explicit Vite environment variable override (if configured)
  const envUrl =
    typeof import.meta !== "undefined" && import.meta?.env
      ? (import.meta.env["VITE_API_URL"] as string | undefined)
      : undefined;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // 2. In browser environments (both production on Vercel and local development)
  // All API requests route through the same-origin `/api` prefix:
  // - On Vercel: `/api/:path*` is rewritten to `https://valgrow-api.onrender.com/:path*` via `vercel.json`
  // - On local Vite dev: `/api/:path*` is proxied to `http://localhost:3001/:path*` via `vite.config.ts`
  // This completely eliminates cross-origin issues, mixed-content errors, and third-party cookie blocking.
  if (typeof window !== "undefined") {
    return "/api";
  }

  // 3. Server-side rendering (SSR) / Node environments
  const internalUrl =
    process.env["INTERNAL_API_URL"] ||
    process.env["API_PROXY_TARGET"] ||
    "http://localhost:3001";
  return internalUrl.replace(/\/+$/, "");
}

export function resolveApiUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // If base already ends with /api and cleanEndpoint starts with /api/, avoid duplicate /api/api
  if (base.endsWith("/api") && cleanEndpoint.startsWith("/api/")) {
    return cleanEndpoint;
  }

  return `${base}${cleanEndpoint}`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public override message: string,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let activeOrgId: string | null = null;
let refreshTokenPromise: Promise<boolean> | null = null;

export function setActiveOrgId(orgId: string | null) {
  activeOrgId = orgId;
  if (orgId) {
    localStorage.setItem("valgrow_active_org_id", orgId);
  } else {
    localStorage.removeItem("valgrow_active_org_id");
  }
}

export function getActiveOrgId(): string | null {
  if (activeOrgId) return activeOrgId;
  if (typeof window !== "undefined") {
    return localStorage.getItem("valgrow_active_org_id");
  }
  return null;
}

async function refreshAuthTokens(): Promise<boolean> {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      const response = await fetch(resolveApiUrl("/auth/refresh"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      return response.ok;
    } catch {
      return false;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const url = resolveApiUrl(endpoint);
  const orgId = getActiveOrgId();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (orgId && !headers["X-Organization-Id"]) {
    headers["X-Organization-Id"] = orgId;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Sends httpOnly cookies
    });
  } catch (err: any) {
    const isNetworkError =
      err instanceof TypeError ||
      err?.name === "TypeError" ||
      err?.message?.includes("fetch") ||
      err?.message?.includes("Failed to fetch") ||
      err?.message?.includes("NetworkError");

    if (isNetworkError) {
      throw new ApiError(
        0,
        "Unable to connect to the ValGrow server. Please check your internet connection or verify the backend service is operational.",
        err,
      );
    }
    throw err;
  }

  const isAuthEndpoint =
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/refresh") ||
    endpoint.includes("/auth/logout");

  if (response.status === 401 && !isRetry && !isAuthEndpoint) {
    const refreshed = await refreshAuthTokens();
    if (refreshed) {
      return apiClient<T>(endpoint, options, true);
    } else {
      setActiveOrgId(null);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let fallbackMessage = `Request failed with status ${response.status}`;
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      fallbackMessage =
        "The ValGrow API server is currently unreachable (Bad Gateway). Please verify the backend service is running.";
    }
    throw new ApiError(
      response.status,
      data?.message || fallbackMessage,
      data,
    );
  }

  return data as T;
}

export async function downloadFile(
  endpoint: string,
  fallbackFilename: string,
): Promise<void> {
  const url = resolveApiUrl(endpoint);
  const orgId = getActiveOrgId();

  const headers: Record<string, string> = {};
  if (orgId) {
    headers["X-Organization-Id"] = orgId;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });
  } catch (err: any) {
    throw new ApiError(
      0,
      "Unable to connect to the ValGrow server to download this file.",
      err,
    );
  }

  if (!response.ok) {
    let errorMsg = `Download failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) errorMsg = data.message;
    } catch {}
    throw new ApiError(response.status, errorMsg);
  }

  let filename = fallbackFilename;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    const matches = /filename="?([^";]+)"?/.exec(disposition);
    if (matches && matches[1]) {
      filename = matches[1];
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}
