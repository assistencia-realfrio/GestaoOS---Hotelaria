import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateOSReportSummary = async (
  description: string,
  notes: string,
  parts: string[],
  duration: string
): Promise<string> => {
  try {
    const prompt = `
      Atua como um assistente administrativo técnico sénior.
      Gera um resumo profissional e conciso (em Português de Portugal) para um Relatório de Ordem de Serviço com base nos seguintes dados:
      
      Problema Reportado: ${description}
      Notas de Resolução do Técnico: ${notes}
      Peças Utilizadas: ${parts.join(', ') || 'Nenhuma'}
      Duração do Trabalho: ${duration}

      O resumo deve ser formal, pronto para ser enviado ao cliente ou incluído na fatura. Foca no que foi resolvido.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o resumo.";
  } catch (error) {
    console.error("Erro ao gerar resumo com Gemini:", error);
    return "Erro ao comunicar com o serviço de IA.";
  }
};