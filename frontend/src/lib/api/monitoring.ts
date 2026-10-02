import { fetchApi } from "./client";

export const monitoringApi = {
  getAllViolations: async (filters: any = {}): Promise<any> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "all") {
        params.append(key, String(value));
      }
    });
    const qs = params.toString();
    return fetchApi(`/violations${qs ? `?${qs}` : ""}`, { method: "GET" });
  },
  
  resolveViolation: async (id: string): Promise<any> => {
    return fetchApi(`/violations/${id}/resolve`, { method: "PATCH" });
  }
};
