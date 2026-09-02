// Design tokens – shared across all components
export const U     = "'Urbanist', sans-serif";
export const I     = "'Inter', sans-serif";
export const INK   = "#0D1B2A";
export const CAMEL = "#C8A97E";
export const CREAM = "#FAF8F5";
export const BLUE  = "#2563EB";

// API base URL (set in .env as NEXT_PUBLIC_API_URL)
export const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  if (typeof window !== "undefined" && envUrl.includes("localhost")) {
    return envUrl.replace("localhost", window.location.hostname);
  }
  return envUrl;
};

export const API_URL = getApiUrl();
