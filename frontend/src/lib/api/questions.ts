import { fetchApi, API_URL } from "./client";

export const questionsApi = {
  // Imports every question in a .csv/.xlsx file into the given section of a
  // saved exam. All-or-nothing: a bad row rejects the whole file with a
  // message naming the rows.
  importQuestions: async (examId: string, file: File, sectionId?: string): Promise<{ message: string; count: number; sectionId: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    if (sectionId) formData.append("sectionId", sectionId);
    return fetchApi(`/exams/${examId}/questions/import`, { method: "POST", body: formData });
  },

  // Binary download — fetchApi always parses JSON, so this goes direct.
  downloadImportTemplate: async (): Promise<void> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`${API_URL}/questions/import-template`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Couldn't download the template. Please try again.");
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = "question-import-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

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
