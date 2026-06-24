import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily to avoid crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. AI translations will fall back to simulation.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || 'MOCK_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for sign language translation (text to sign sequence or sign definition to text)
app.post('/api/translate', async (req, res) => {
  const { text, mode } = req.body; // mode: 'text_to_sign' | 'sign_to_text' | 'smart_assistant'

  if (!text) {
    return res.status(400).json({ error: 'Text content is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Elegant fallback simulation representing Vietnamese sign language grammar rules
    // (Subject + Object + Verb/Gesture shorthand, facial expressions, directions)
    console.log("Simulating translation (no API key configured)");
    let translated = '';
    let explanation = '';
    let visualSequence: string[] = [];

    if (mode === 'text_to_sign') {
      visualSequence = text.toUpperCase().split(' ').map((word: string) => `[${word}]`);
      translated = `Chuỗi ký hiệu: ${visualSequence.join(' ➔ ')}`;
      explanation = `Cách thức thực hiện: Mô tả từng ký hiệu tương ứng với các từ khóa chính lực đẩy trong từ "${text}". Để diễn tả hiệu quả, duy trì ánh mắt tự nhiên và nét mặt tươi vui.`;
    } else {
      translated = `Dịch chuẩn: "${text.charAt(0).toUpperCase() + text.slice(1)}"`;
      explanation = `Nhận diện ngữ cảnh giao tiếp thông thường, chuyển cấu trúc động học ký hiệu về câu văn xuôi tiếng Việt hoàn chỉnh, lưu loát.`;
    }

    return res.json({ translated, explanation, visualSequence, isFallback: true });
  }

  try {
    const ai = getAiClient();
    let prompt = '';

    if (mode === 'text_to_sign') {
      prompt = `Hãy đóng vai là chuyên gia Ngôn ngữ Ký hiệu Việt Nam (VSL). Hãy dịch câu tiếng Việt sau thành chuỗi các ký hiệu (động từ, danh từ cốt lõi) theo ngữ pháp ngôn ngữ ký hiệu thông thường (chủ từ - tân ngữ - động từ / lược bỏ hư từ). 
Câu cần dịch: "${text}"

Đầu ra định dạng dạng JSON:
{
  "sequence": ["KÝ_HIỆU_1", "KÝ_HIỆU_2", ...],
  "translated": "Mô tả chuỗi ký hiệu",
  "explanation": "Hướng dẫn chi tiết về điệu bộ, cử chỉ tay, biểu cảm khuôn mặt để thực hiện câu này."
}`;
    } else if (mode === 'sign_to_text') {
      prompt = `Hãy đóng vai là chuyên gia phiên dịch ngôn ngữ ký hiệu sang tiếng Việt phổ thông. Nhận diện các từ ký hiệu viết tắt hoặc chuỗi mô tả sau: "${text}" và dịch chúng thành một câu tiếng Việt mượt mà, đầy đủ, lịch sự và tự nhiên.

Đầu ra dạng JSON:
{
  "translated": "Câu dịch tiếng Việt hoàn chỉnh",
  "explanation": "Giải thích cấu trúc hoặc bối cảnh văn hóa của ký hiệu này."
}`;
    } else {
      prompt = `Bạn là trợ lý AI thông minh tích hợp trên ứng dụng SignBridge - kết nối người khiếm thính và người nói thường. Hãy trả lời câu hỏi sau bằng tiếng Việt một cách cảm thông, ngắn gọn (dưới 100 chữ): "${text}"`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: prompt.includes('JSON') ? 'application/json' : 'text/plain',
      }
    });

    const responseText = response.text || '';
    if (prompt.includes('JSON')) {
      try {
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      } catch (e) {
        return res.json({ translated: responseText, explanation: 'Đã phân tích cú pháp ký hiệu hỗ trợ.', visualSequence: [] });
      }
    } else {
      return res.json({ translated: responseText });
    }
  } catch (error: any) {
    console.error('Error during translation:', error);
    res.status(500).json({ error: 'Internal AI translation error', details: error.message });
  }
});

// Start server setup with Vite
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SignBridge Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
