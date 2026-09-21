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
  // Present on /collaborations/mine, which includes these for display —
  // absent on the per-exam list() endpoint.
  exam?: { id: string; title: string; subject?: string | null; status: string; ownerId: string };
  inviter?: { name: string; email: string };
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

export interface InviteResult {
  status: "INVITED";
  collaborator: Collaborator;
  // true when the invited email had no Cheating.me account yet — Supabase just
  // created one for them and emailed them to set it up.
  isNewAccount: boolean;
}

export const collaborationApi = {
  // If the invited email isn't registered yet, the backend creates their
  // account via Supabase's invite flow and adds them as a Collaborator right
  // away — the response tells you which happened so the UI can word the
  // confirmation accordingly.
  invite: async (examId: string, data: { email: string; role: CollaboratorRole }): Promise<InviteResult> => {
    return fetchApi<InviteResult>(`/exams/${examId}/collaborators`, {
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

  accept: async (id: string): Promise<Collaborator> => {
    return fetchApi<Collaborator>(`/collaborations/${id}/accept`, { method: "POST" });
  },

  decline: async (id: string): Promise<Collaborator> => {
    return fetchApi<Collaborator>(`/collaborations/${id}/decline`, { method: "POST" });
  },
};
