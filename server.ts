import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Support body payloads up to 30mb for multimodal uploads (PDFs, images)
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Helper to get Gemini Client safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Mode system prompts
const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are Martins AI, a premier intelligent assistant.
Tagline: "Your AI. Your Ideas. Your Possibilities."
You are clear, rigorous, nuanced, and helpful across all topics. Maintain honest uncertainty when facts are not definitively established.
Format responses in clean Markdown with appropriate headings, bullet points, tables, and fenced code blocks.
When creating substantial self-contained code files, web components, documents, or data tables, use clear titles and specify languages.`,

  study: `You are Martins AI in Study Mode — a patient, pedagogical tutor.
Your goal is to help the user deeply understand concepts step-by-step rather than simply dumping answers.
- Break explanations into digestible milestones.
- Provide illustrative analogies and real-world applications.
- Ask gentle check-in questions to reinforce comprehension.
- Point out common misconceptions.`,

  coding: `You are Martins AI in Coding Mode — a principal software engineer and systems architect.
- Write production-grade, bug-free, well-typed, and maintainable code.
- Analyze algorithmic efficiency, edge cases, and memory trade-offs when relevant.
- Provide concise, practical debugging steps for reported errors.
- Always specify code block syntax languages and include clear comments for tricky logic.`,

  writing: `You are Martins AI in Writing Mode — an expert editor, essayist, and creative wordsmith.
- Help structure, draft, edit, and polish essays, technical documentation, stories, communications, and speeches.
- Offer targeted suggestions for tone, flow, clarity, and rhetorical impact.
- Avoid clichés and repetitive vocabulary.`,

  research: `You are Martins AI in Research Mode — a rigorous investigative academic researcher.
- Synthesize findings methodically, distinguishing empirically proven points from conjectures.
- Cite specific arguments, contrast alternative perspectives, and highlight methodological nuances.
- Structure complex topics with executive summaries, detailed analyses, and open questions.`,

  brainstorming: `You are Martins AI in Brainstorming Mode — an inventive ideation partner and strategic advisor.
- Explore unconventional angles, synthesize lateral connections, and push past surface-level ideas.
- Categorize concepts by feasibility, uniqueness, and impact.
- Provide structured frameworks and actionable roadmaps to bring ideas to life.`,
};

// 1. Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  res.json({
    status: 'ok',
    appName: 'Martins AI',
    configured: hasKey,
    model,
    timestamp: new Date().toISOString(),
  });
});

// 2. Chat Streaming endpoint via SSE
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please set it in server secrets.',
    });
    return;
  }

  const {
    messages = [],
    message = '',
    attachments = [],
    mode = 'general',
    customInstructions = '',
    enableSearch = false,
  } = req.body;

  if (!message && (!attachments || attachments.length === 0)) {
    res.status(400).json({ error: 'Message text or attachment is required.' });
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let isClientDisconnected = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      isClientDisconnected = true;
    }
  });

  try {
    const baseInstruction = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.general;
    let combinedInstruction = baseInstruction;
    if (customInstructions && typeof customInstructions === 'string') {
      combinedInstruction += `\n\nUser Personal Preferences & Memory Context:\n${customInstructions.trim()}`;
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

    // Format historical messages for Gemini SDK
    // Gemini expects contents array of { role: 'user' | 'model', parts: [...] }
    const contents: any[] = [];

    // Keep context bounded (last 16 messages max for performance and context discipline)
    const recentMessages = messages.slice(-16);
    for (const msg of recentMessages) {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      const parts: any[] = [];

      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.data && att.mimeType) {
            // If text/code file, pass as plain text part or inline
            if (att.mimeType.startsWith('text/') || att.mimeType === 'application/json') {
              try {
                const textContent = Buffer.from(att.data, 'base64').toString('utf-8');
                parts.push({ text: `\n[File: ${att.name || 'document'}]\n${textContent}\n` });
              } catch {
                parts.push({
                  inlineData: { mimeType: att.mimeType, data: att.data },
                });
              }
            } else {
              parts.push({
                inlineData: {
                  mimeType: att.mimeType,
                  data: att.data,
                },
              });
            }
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    // Current turn parts
    const currentParts: any[] = [];
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.data && att.mimeType) {
          if (att.mimeType.startsWith('text/') || att.mimeType === 'application/json') {
            try {
              const textContent = Buffer.from(att.data, 'base64').toString('utf-8');
              currentParts.push({ text: `\n[Attached File: ${att.name || 'document'}]\n${textContent}\n` });
            } catch {
              currentParts.push({
                inlineData: { mimeType: att.mimeType, data: att.data },
              });
            }
          } else {
            currentParts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.data,
              },
            });
          }
        }
      }
    }

    if (message) {
      currentParts.push({ text: message });
    }

    contents.push({ role: 'user', parts: currentParts });

    // Build configuration
    const config: any = {
      systemInstruction: combinedInstruction,
      temperature: mode === 'brainstorming' ? 0.9 : mode === 'coding' ? 0.2 : 0.7,
    };

    if (enableSearch || mode === 'research') {
      config.tools = [{ googleSearch: {} }];
    }

    // Resilient model selection with automatic fallback on 503 capacity spikes
    const candidateModels = Array.from(
      new Set([
        modelName,
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest',
      ])
    );

    let responseStream: any = null;
    let lastError: any = null;

    for (const modelCandidate of candidateModels) {
      if (isClientDisconnected || res.writableEnded) break;
      try {
        responseStream = await ai.models.generateContentStream({
          model: modelCandidate,
          contents,
          config,
        });
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelCandidate} failed, trying fallback:`, err.message || err);
      }
    }

    if (!responseStream) {
      throw lastError || new Error('AI service currently unavailable.');
    }

    let fullText = '';
    const collectedSources: { title: string; uri: string }[] = [];

    for await (const chunk of responseStream) {
      if (isClientDisconnected || res.writableEnded) break;

      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
      }

      // Check for search grounding sources
      const grounding = chunk.candidates?.[0]?.groundingMetadata;
      if (grounding?.groundingChunks) {
        for (const gChunk of grounding.groundingChunks) {
          const web = gChunk.web;
          if (web?.uri && web?.title) {
            if (!collectedSources.some((s) => s.uri === web.uri)) {
              collectedSources.push({
                title: web.title,
                uri: web.uri,
              });
            }
          }
        }
      }
    }

    if (!res.writableEnded) {
      if (collectedSources.length > 0) {
        res.write(`data: ${JSON.stringify({ type: 'grounding', sources: collectedSources })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ type: 'done', fullText })}\n\n`);
      res.end();
    }
  } catch (err: any) {
    console.error('Error generating stream:', err);

    let friendlyMessage = 'An error occurred during generation.';
    const raw = String(err?.message || err || '');
    if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE')) {
      friendlyMessage = 'The AI service is currently experiencing high demand. Please try sending your message again.';
    } else if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
      friendlyMessage = 'Rate limit reached. Please wait a few seconds and try again.';
    } else if (raw.includes('API_KEY') || raw.includes('403')) {
      friendlyMessage = 'API authorization error. Please check server credentials.';
    } else if (err.message && typeof err.message === 'string') {
      friendlyMessage = err.message;
    }

    if (!res.headersSent) {
      res.status(500).json({ error: friendlyMessage });
    } else if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: friendlyMessage,
        })}\n\n`
      );
      res.end();
    }
  }
});

// 3. Image generation endpoint
app.post('/api/image/generate', async (req: Request, res: Response) => {
  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  const { prompt, aspectRatio = '1:1' } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'A descriptive text prompt is required.' });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    let imageUrl = '';
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      res.status(422).json({
        error: 'The image generation model did not return image data for this prompt.',
      });
      return;
    }

    res.json({
      imageUrl,
      prompt,
      aspectRatio,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Image generation error:', err);
    res.status(500).json({
      error: err.message || 'Image generation failed. Check API key permissions for image models.',
    });
  }
});

// 4. Server-Side Speech Synthesis (TTS) endpoint
app.post('/api/speech/tts', async (req: Request, res: Response) => {
  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    return;
  }

  const { text, voice = 'Kore' } = req.body;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text is required for speech synthesis.' });
    return;
  }

  // Truncate to first 500 characters for snappy response
  const sanitizedText = text.slice(0, 500);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: sanitizedText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice as any },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      res.status(500).json({ error: 'TTS audio could not be synthesized.' });
      return;
    }

    res.json({
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
      voice,
    });
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ error: err.message || 'Speech synthesis failed.' });
  }
});

// 5. Automatic title generation
app.post('/api/title', async (req: Request, res: Response) => {
  const ai = getGeminiClient();
  const { message = '' } = req.body;
  if (!message) {
    res.json({ title: 'New Conversation' });
    return;
  }

  if (!ai) {
    const fallbackTitle = message.slice(0, 36).replace(/\n/g, ' ').trim() || 'Conversation';
    res.json({ title: fallbackTitle });
    return;
  }

  try {
    const titleModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    const response = await ai.models.generateContent({
      model: titleModel,
      contents: `Create an ultra-concise, natural conversation title (maximum 4 words, no quotes, no markdown) for this user query: "${message.slice(0, 200)}"`,
    });
    const title = response.text?.trim()?.replace(/["'*]/g, '') || message.slice(0, 30);
    res.json({ title: title.slice(0, 40) });
  } catch {
    res.json({ title: message.slice(0, 30).trim() || 'Conversation' });
  }
});

// Setup Vite development server or production static serving
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Martins AI] Server listening on port ${PORT} (isProd: ${isProd})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
