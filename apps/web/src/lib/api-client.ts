const API_BASE_URL = import.meta.env["VITE_API_URL"] || "http://localhost:3001";

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

export async function apiClient<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const orgId = getActiveOrgId();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (orgId && !headers["X-Organization-Id"]) {
    headers["X-Organization-Id"] = orgId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Sends httpOnly cookies
  });

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
    throw new ApiError(
      response.status,
      data?.message || `Request failed with status ${response.status}`,
      data,
    );
  }

  return data as T;
}
