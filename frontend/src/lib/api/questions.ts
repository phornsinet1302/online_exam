import { fetchApi } from "./client";

export const questionsApi = {
  createSection: async (examId: string, data: any): Promise<any> => {
    return fetchApi<any>(`/exams/${examId}/sections`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  createQuestion: async (sectionId: string, data: any): Promise<any> => {
    return fetchApi<any>(`/questions`, {
      method: "POST",
      body: JSON.stringify({ ...data, sectionId }),
    });
  },

  updateQuestion: async (questionId: string, data: any): Promise<any> => {
    return fetchApi<any>(`/questions/${questionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteQuestion: async (questionId: string): Promise<void> => {
    return fetchApi<void>(`/questions/${questionId}`, { method: "DELETE" });
  },

  generateAI: async (data: any): Promise<any> => {
    return fetchApi<any>("/questions/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
};
