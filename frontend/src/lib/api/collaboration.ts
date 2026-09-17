import { fetchApi } from "./client";

export type CollaboratorRole = "COLLABORATOR" | "INVIGILATOR";
export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface Collaborator {
  id: string;
  examId: string;
  userId: string;
  role: CollaboratorRole;
  status: InviteStatus;
  invitedBy: string;
  createdAt: string;
  user?: { name: string; email: string; avatarUrl?: string | null; supabaseId: string };
}

export interface InviteLink {
  token: string;
  role: CollaboratorRole;
  expiresAt: string;
  url: string;
}

export interface AcceptLinkResult {
  examId: string;
  examTitle: string;
  role: CollaboratorRole;
}

export const collaborationApi = {
  invite: async (examId: string, data: { email: string; role: CollaboratorRole }): Promise<Collaborator> => {
    return fetchApi<Collaborator>(`/exams/${examId}/collaborators`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  list: async (examId: string): Promise<Collaborator[]> => {
    return fetchApi<Collaborator[]>(`/exams/${examId}/collaborators`, { method: "GET" });
  },

  updateRole: async (examId: string, id: string, role: CollaboratorRole): Promise<Collaborator> => {
    return fetchApi<Collaborator>(`/exams/${examId}/collaborators/${id}`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },

  remove: async (examId: string, id: string): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/exams/${examId}/collaborators/${id}`, { method: "DELETE" });
  },

  getInviteLink: async (examId: string, role: CollaboratorRole): Promise<InviteLink> => {
    return fetchApi<InviteLink>(`/exams/${examId}/invite-link?role=${role}`, { method: "GET" });
  },

  acceptInviteLink: async (token: string): Promise<AcceptLinkResult> => {
    return fetchApi<AcceptLinkResult>("/collaborations/accept-link", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  mine: async (): Promise<Collaborator[]> => {
    return fetchApi<Collaborator[]>("/collaborations/mine", { method: "GET" });
  },
};
