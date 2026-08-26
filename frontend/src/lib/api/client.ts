export const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  if (typeof window !== "undefined" && envUrl.includes("localhost")) {
    return envUrl.replace("localhost", window.location.hostname);
  }
  return envUrl;
};

export const API_URL = getApiUrl();

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: "An unexpected error occurred" };
    }
    throw new Error(errorData.message || errorData.error || response.statusText);
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}
