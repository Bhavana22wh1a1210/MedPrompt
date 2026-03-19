import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function processMedicalDocument(text: string, language: string, base64Image?: string, mimeType?: string) {
  const ai = getAI();
  const prompt = `
    You are an expert medical AI assistant. Analyze the following medical document and provide a structured overview and a patient-friendly summary in ${language}.
    
    ${text ? `Document Content:\n${text}` : ''}
    
    Instructions:
    1. Overview: Extract patient information, hospital/doctor details, test results (with reference ranges), abnormal findings, and medications. Only include fields that are present in the document.
    2. Summary: Provide a calm, easy-to-understand explanation of the document. Use non-technical language. Explain each test in daily-life meaning. Highlight abnormal values. Mention possible symptoms only if relevant. Give general lifestyle guidance. DO NOT prescribe medicines. Recommend consulting a doctor if needed. Tone should be reassuring, human, and personalized.

    Return the result strictly as a JSON object with the following structure:
    {
      "overview": {
        "patientInformation": { "name": "...", "age": "...", "gender": "...", "patientId": "..." },
        "hospitalDetails": { "hospitalName": "...", "referringDoctor": "...", "consultingDoctor": "...", "reportDate": "..." },
        "testResults": [ { "testName": "...", "patientValue": "...", "referenceRange": "...", "isAbnormal": true/false } ],
        "abnormalFindings": [ "..." ],
        "medications": [ { "medicineName": "...", "dosage": "...", "frequency": "...", "duration": "..." } ]
      },
      "summary": "..."
    }
  `;

  const parts: any[] = [{ text: prompt }];
  if (base64Image && mimeType) {
    parts.unshift({
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      }
    });

    let jsonStr = response.text?.trim() || '{}';
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    }
    const parsed = JSON.parse(jsonStr);
    return {
      overview: parsed.overview || {},
      summary: parsed.summary || 'No summary generated.'
    };
  } catch (error) {
    console.error('Error processing medical document:', error);
    throw error;
  }
}
