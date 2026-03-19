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
    2. Summary: Provide a personalized, patient-friendly summary of the document. Do not use generic headings; generate dynamic, personalized headings based on the specific document (e.g., "Your Blood Test Results", "Why You Visited", "Your Treatment Plan"). The summary MUST be structured as a JSON object with a title, an intro paragraph, an array of sections (each with a heading and content), and an optional lifestyleTips section.

    Return the result strictly as a JSON object with the following structure:
    {
      "overview": {
        "patientInformation": { "name": "...", "age": "...", "gender": "...", "patientId": "..." },
        "hospitalDetails": { "hospitalName": "...", "referringDoctor": "...", "consultingDoctor": "...", "reportDate": "..." },
        "testResults": [ { "testName": "...", "patientValue": "...", "referenceRange": "...", "isAbnormal": true/false } ],
        "abnormalFindings": [ "..." ],
        "medications": [ { "medicineName": "...", "dosage": "...", "frequency": "...", "duration": "..." } ]
      },
      "summary": {
        "title": "e.g., Your Throat Infection Consultation Summary",
        "intro": "e.g., Hello Mr. Satish! Here's a simple breakdown of your consultation...",
        "sections": [
          {
            "heading": "e.g., Why You Visited",
            "content": "..."
          }
        ],
        "lifestyleTips": "e.g., Keep yourself well-hydrated throughout the day..."
      }
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
