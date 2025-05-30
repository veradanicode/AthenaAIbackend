import fs from 'fs';
import { Mistral } from '@mistralai/mistralai';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
dotenv.config();

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log("API Key:", process.env.MISTRAL_API_KEY.trim());

export const uploadDocumentAndGenerateQuiz = async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf-8');

const prompt = `
Generate 5 CBT-style multiple choice questions from the content below in this JSON format:

[
  {
    "question": "string",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "The correct answer text here"
  }
]

Only return valid JSON (no explanation, no extra text). Use this content:
${fileContent}
`;


    // Send to Mistral Chat API
    const mResp = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const raw = mResp.choices[0].message.content;
    let questions;

    try {
      // strip anything outside the JSON array
      const start = raw.indexOf('[');
      const end = raw.lastIndexOf(']') + 1;
      const clean = raw.slice(start, end);
      questions = JSON.parse(clean);
    } catch (err) {
      console.error("Mistral JSON Parse Error:", raw);
      return res.status(400).json({ message: "Failed to parse quiz", raw });
    }

    // clean up uploaded file
    fs.unlinkSync(filePath);

    // send back array of questions
    return res.json({ questions });
  }
  catch (error) {
    console.error("🔥 Quiz generation failed:", error);
    return res.status(500).json({ message: "Quiz generation failed", error: error.message });
  }
};
