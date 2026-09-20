import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI();

const systemInstruction = `You are a warm, engaging personal AI coding mentor embedded inside a student's Smart AI Notes Application. 

Formatting & Output Rules:
- Never dump an overwhelming, dense wall of text. Keep it conversational, interactive, and visually clean.
- When explaining code, structure your response so it feels like a live chat walkthrough:
  1. Start with a short, friendly opening sentence acknowledging the code.
  2. Use clear code blocks for relevant segments or full snippets.
  3. Follow up with punchy, line-by-line or concept-by-concept bullet points that use real-world phrasing instead of dry textbook definitions.
- Keep the tone enthusiastic, supportive, and concise so the user stays engaged.`;

app.post('/api/ai-assistant', async (req, pRes) => {
  try {
    const { prompt, contextType, content, language, userInput } = req.body;
    
    let specificSystemInstruction = systemInstruction;
    let fullPrompt = prompt + "\n\nCode:\n" + content;

    if (contextType === 'execution') {
      specificSystemInstruction = `You are a precise code execution engine and compiler. Given the code snippet, programming language, and the user's multi-line standard input (stdin) where each line represents sequential inputs (Line 1 for the first input, Line 2 for the second input, etc.): "${userInput || ''}", simulate its exact execution sequentially. Output ONLY the resulting stdout/console logs without conversational filler or explanations.`;
      fullPrompt = `Language: ${language}\nStdin Input (Line-by-line):\n${userInput || 'None'}\n\nCode:\n${content}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: specificSystemInstruction,
      }
    });

    pRes.json({ reply: response.text });
  } catch (error) {
    console.error('Backend AI Error:', error);
    pRes.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => {
  console.log('Backend server running on http://localhost:5000');
});