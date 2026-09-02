import { fetchApi } from "./client";

export const aiApi = {
  generateFromPdf: async (data: FormData) => {
    return fetchApi<{
      message: string;
      count: number;
      questions: any[];
    }>("/ai/generate-from-pdf", {
      method: "POST",
      body: data,
    });
  },
};
