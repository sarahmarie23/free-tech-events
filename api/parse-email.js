// api/parse-email.js
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Configuration Error: GEMINI_API_KEY environment variable is missing.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { emailBody, subject } = req.body;

    if (!emailBody) {
      return res.status(400).json({ error: 'Missing emailBody in request body.' });
    }

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
- restrictions: Any special rules or requirements (e.g., "must be 21 and over").
- signupUrl: The main link where people can sign up or register.

Email Subject: ${subject || 'N/A'}
Email Body:
${emailBody}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let rawText = response.text || '';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const extractedData = JSON.parse(rawText);

    return res.status(200).json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    console.error('CRITICAL PARSE ERROR:', error);
    return res.status(500).json({ 
      error: 'Failed to parse email content.', 
      details: error.toString(),
      stack: error.stack 
    });
  }
}