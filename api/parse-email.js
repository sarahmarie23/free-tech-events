// api/parse-email.js
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailBody, subject } = req.body;

    if (!emailBody) {
      return res.status(400).json({ error: 'Missing emailBody in request.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing from environment variables.');
      return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }

    // 1. Construct the prompt enforcing your business logic
    const prompt = `
You are an expert event data extractor for a local tech events directory. 
Analyze the email below and extract the following details into a valid JSON object (return ONLY raw JSON, no markdown backticks):
- title: The name of the event.
- host: The primary organizing host group (ignore secondary sponsors, speakers, or collaborators).
- date: The date of the event (YYYY-MM-DD format if possible).
- time: The time of the event.
- locationName: The name of the venue or location.
- address: The street address if available.
- isInPerson: boolean (true if it's at a physical location or hybrid).
- foodServed: boolean or description (e.g., pizza, beer, none).
- restrictions: Any special rules or requirements (e.g., "must be 21 and over", "limited to participants in a certain industry"). Do not report requirements like "must bring a laptop" or "must preregister" or "need experience in <language, technology, etc.>"
- signupUrl: The main link where people can sign up or register.

CRITICAL RULES:
1. If the event is online/virtual, set "isInPerson": false, otherwise true.
2. Prioritize identifying the single primary host group.

Email Subject: ${subject || 'N/A'}
Email Body:
${emailBody}
    `;

    // 2. Call the Gemini model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let rawText = response.text || '';
    
    // Clean up potential markdown wrappers if the model includes them
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const extractedData = JSON.parse(rawText);

    return res.status(200).json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    console.error('Detailed error parsing email:', error);
    return res.status(500).json({ 
      error: 'Failed to parse email content.', 
      details: error.message 
    });
  }
}