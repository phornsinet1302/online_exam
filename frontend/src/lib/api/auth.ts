import { fetchApi } from "./client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export const authApi = {
  login: async (credentials: Record<string, string>): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
  
  register: async (data: Record<string, string>): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMe: async (): Promise<User> => {
    return fetchApi<User>("/auth/me", {
      method: "GET",
    });
  },

  google: async (access_token: string): Promise<{ message: string, user: User }> => {
    return fetchApi<{ message: string, user: User }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ access_token }),
    });
  }
};
