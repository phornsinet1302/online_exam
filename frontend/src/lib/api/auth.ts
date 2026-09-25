import { fetchApi } from "./client";

export interface NotificationPrefs {
  examAlerts: boolean;
  flagAlerts: boolean;
  gradeReady: boolean;
  weeklyReport: boolean;
  systemUpdates: boolean;
  studentJoins: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  examAlerts: true,
  flagAlerts: true,
  gradeReady: true,
  weeklyReport: false,
  systemUpdates: true,
  studentJoins: false,
};

export interface PrivacyPrefs {
  shareUsageData: boolean;
  showInDirectory: boolean;
  allowResearch: boolean;
}

export const DEFAULT_PRIVACY_PREFS: PrivacyPrefs = {
  shareUsageData: true,
  showInDirectory: false,
  allowResearch: false,
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  phone?: string | null;
  institution?: string | null;
  department?: string | null;
  bio?: string | null;
  notificationPrefs?: Partial<NotificationPrefs> | null;
  privacyPrefs?: Partial<PrivacyPrefs> | null;
}

export interface ProfileUpdate {
  name?: string;
  phone?: string;
  institution?: string;
  department?: string;
  bio?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
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

  // Always resolves for a well-formed request, whether or not the address has
  // an account — the response must not reveal who is registered.
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // `accessToken` is the session from the reset link's URL. On success the
  // response carries a fresh session, so the user can be signed straight in.
  resetPassword: async (accessToken: string, newPassword: string): Promise<{ message: string; access_token?: string; refresh_token?: string; user?: User }> => {
    return fetchApi<{ message: string; access_token?: string; refresh_token?: string; user?: User }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ access_token: accessToken, newPassword }),
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
  },

  uploadAvatar: async (file: File): Promise<{ message: string, user: User }> => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi<{ message: string, user: User }>("/auth/me/avatar", {
      method: "POST",
      body: formData,
    });
  },

  updateProfile: async (data: ProfileUpdate): Promise<{ message: string, user: User }> => {
    return fetchApi<{ message: string, user: User }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>("/auth/me/password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateNotificationPrefs: async (prefs: Partial<NotificationPrefs>): Promise<{ message: string, notificationPrefs: NotificationPrefs }> => {
    return fetchApi<{ message: string, notificationPrefs: NotificationPrefs }>("/auth/me/notifications", {
      method: "PATCH",
      body: JSON.stringify(prefs),
    });
  },

  updatePrivacyPrefs: async (prefs: Partial<PrivacyPrefs>): Promise<{ message: string, privacyPrefs: PrivacyPrefs }> => {
    return fetchApi<{ message: string, privacyPrefs: PrivacyPrefs }>("/auth/me/privacy", {
      method: "PATCH",
      body: JSON.stringify(prefs),
    });
  },
};
