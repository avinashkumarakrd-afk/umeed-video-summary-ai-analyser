import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { resolveNeetNotesForTitle } from './src/data/neetChapterDatabase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Resilient Gemini Caller with Per-Model Timeout
async function callGemini(params: {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
  timeoutMs?: number;
}): Promise<string> {
  if (!ai) {
    throw new Error('No AI client initialized');
  }

  const timeoutMs = params.timeoutMs ?? 20000;
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const callPromise = ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          temperature: params.temperature ?? 0.3,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on ${model}`)), timeoutMs)
      );

      const response = await Promise.race([callPromise, timeoutPromise]);
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} issue or timeout (${err?.message?.slice(0, 80)}). Trying fallback...`);
      lastError = err;
    }
  }

  throw lastError;
}

// Utility to extract YouTube Video ID
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

// Determine NEET subject from title or content
function detectSubject(title: string): 'Physics' | 'Chemistry' | 'Biology' | 'General NEET' {
  const lower = title.toLowerCase();
  if (
    lower.includes('physics') ||
    lower.includes('kinematics') ||
    lower.includes('rotational') ||
    lower.includes('optics') ||
    lower.includes('thermodynamics') ||
    lower.includes('electrostatics') ||
    lower.includes('mechanics') ||
    lower.includes('wave') ||
    lower.includes('magnetism') ||
    lower.includes('gravitation') ||
    lower.includes('current')
  ) {
    return 'Physics';
  }
  if (
    lower.includes('chemistry') ||
    lower.includes('bonding') ||
    lower.includes('organic') ||
    lower.includes('inorganic') ||
    lower.includes('mole') ||
    lower.includes('equilibrium') ||
    lower.includes('electrochemistry') ||
    lower.includes('coordination') ||
    lower.includes('p-block') ||
    lower.includes('d-block') ||
    lower.includes('hydrocarbon')
  ) {
    return 'Chemistry';
  }
  if (
    lower.includes('biology') ||
    lower.includes('botany') ||
    lower.includes('zoology') ||
    lower.includes('cell') ||
    lower.includes('genetics') ||
    lower.includes('physiology') ||
    lower.includes('photosynthesis') ||
    lower.includes('respiration') ||
    lower.includes('ecology') ||
    lower.includes('biomolecule') ||
    lower.includes('reproduction') ||
    lower.includes('human')
  ) {
    return 'Biology';
  }
  return 'General NEET';
}

// Fetch video info via YouTube oEmbed
app.post('/api/video/info', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL or Video ID format' });
    }

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    let title = 'NEET Exam Lecture';
    let authorName = 'NEET Educator';
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        title = data.title || title;
        authorName = data.author_name || authorName;
        thumbnailUrl = data.thumbnail_url || thumbnailUrl;
      }
    } catch {
      // Fallback
    }

    const subject = detectSubject(title);

    return res.json({
      videoId,
      canonicalUrl,
      title,
      authorName,
      thumbnailUrl,
      subject,
      sessionResetTimestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('Error in /api/video/info:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch video information' });
  }
});

// Enforce 2-page NEET Notes format for ANY chapter across Bio, Chem, Physics
app.post('/api/gemini/generate-notes', async (req: Request, res: Response) => {
  try {
    const { videoId, videoTitle, videoUrl, subject } = req.body;
    if (!videoTitle) {
      return res.status(400).json({ error: 'Video details are required' });
    }

    const inferredSubject = subject || detectSubject(videoTitle);

    const prompt = `
YOU ARE THE NEET AI LECTURE COMPANION TUTOR.
STUDENT REQUEST: "Concise the full video into 1-2 pages of notes".

DYNAMIC CONTEXT DIRECTIVE:
Analyze strictly THIS SPECIFIC LECTURE AND CHAPTER:
Title: "${videoTitle}"
URL: ${videoUrl || `https://www.youtube.com/watch?v=${videoId}`}
Target Subject: ${inferredSubject}

MANDATORY 2-PAGE STRUCTURE SPECIFIC TO THIS EXACT CHAPTER:

PAGE 1: Core Concepts, Definitions, and NCERT-Aligned Key Takeaways
- Breakdown of every important concept, mechanism, and definition in this specific video.
- Exact NCERT line-by-line terminology, classifications, and standard conventions for this chapter.
- High-yield checkpoints (what NTA NEET examiners frequently test for this chapter).
- Common student misconceptions and traps to avoid.

PAGE 2: All Formulas/Equations/Fact Bank, Shortcut Tricks, and High-Yield PYQ Highlights
- Complete Formula Bank / Numerical Data / Biochemical & Anatomical Fact Bank for this chapter.
- Speed-solving shortcuts, dimensional analysis hacks, or biological mnemonics taught in this video.
- 3-4 High-Yield PYQs from 2018-2024 testing this exact chapter with step-by-step solutions.

Delineate clearly with:
# PAGE 1: CORE CONCEPTS & NCERT TAKEAWAYS
and
# PAGE 2: FORMULA BANK, SHORTCUTS & PYQ HIGHLIGHTS
`;

    try {
      const text = await callGemini({
        contents: prompt,
        systemInstruction:
          `You are an elite NEET educator specializing in ${inferredSubject}. Generate rigorous, chapter-specific NCERT notes.`,
        temperature: 0.3,
        timeoutMs: 18000,
      });

      return res.json({ notes: text, subject: inferredSubject });
    } catch (modelErr) {
      console.warn('Falling back to chapter knowledge engine:', modelErr);
      const resolved = resolveNeetNotesForTitle(videoTitle, inferredSubject);
      return res.json({
        notes: `${resolved.page1}\n\n${resolved.page2}`,
        subject: resolved.subject,
      });
    }
  } catch (err: any) {
    console.error('Error generating notes:', err);
    const resolved = resolveNeetNotesForTitle(req.body?.videoTitle || 'NEET Lecture', req.body?.subject);
    return res.json({
      notes: `${resolved.page1}\n\n${resolved.page2}`,
      subject: resolved.subject,
    });
  }
});

// Interactive Preset Engine (Notes, Formula Sheet, Key PYQs, 5 Practice MCQs)
app.post('/api/gemini/preset', async (req: Request, res: Response) => {
  try {
    const { videoTitle, videoUrl, subject, presetType } = req.body;
    const inferredSubject = subject || detectSubject(videoTitle);

    let specificPrompt = '';
    switch (presetType) {
      case 'formula':
        specificPrompt = `Extract a dedicated "FORMULA SHEET / FACT BANK" strictly for this chapter: "${videoTitle}" (${inferredSubject}):
1. Every formula/equation, SI unit, constant, or biological/chemical data point.
2. Sign conventions or pathway sequences.
3. 2 Speed calculation shortcuts or mnemonics.`;
        break;

      case 'pyq':
        specificPrompt = `Extract "KEY HIGH-YIELD PYQs" from "${videoTitle}" (${inferredSubject}):
- 3 to 4 recent NEET questions (2018-2024) on this exact chapter.
- Question statement, options (A, B, C, D), correct option, and step-by-step NCERT reasoning.`;
        break;

      case 'mcq':
        specificPrompt = `Generate 5 high-yield NEET practice MCQs from "${videoTitle}" (${inferredSubject}) with options (A, B, C, D), answer keys, and NCERT explanations.`;
        break;

      default:
        specificPrompt = `Provide a structured NEET revision summary for "${videoTitle}".`;
    }

    const fullPrompt = `
DYNAMIC CONTEXT DIRECTIVE:
Analyze ONLY: "${videoTitle}" (${inferredSubject}). Wipe previous context.
${specificPrompt}
`;

    try {
      const text = await callGemini({
        contents: fullPrompt,
        temperature: 0.3,
        timeoutMs: 18000,
      });
      return res.json({ content: text });
    } catch (presetErr) {
      console.warn('Fallback preset response used:', presetErr);
      const resolved = resolveNeetNotesForTitle(videoTitle, inferredSubject);
      return res.json({ content: resolved.page2 });
    }
  } catch (err: any) {
    console.error('Error generating preset:', err);
    const resolved = resolveNeetNotesForTitle(req.body?.videoTitle || 'NEET Lecture', req.body?.subject);
    return res.json({ content: resolved.page2 });
  }
});

// Chat endpoint with Smart Intent Routing (Detects notes/formula/doubt requests)
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { videoTitle, videoUrl, subject, message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const inferredSubject = subject || detectSubject(videoTitle || '');
    const isNotesRequest = /(note|concise|summar|important topic|overview|cheat sheet|all concept|full video|revision|make note|give note)/i.test(
      message
    );

    // If the student asked for notes in chat, generate full chapter notes!
    if (isNotesRequest) {
      try {
        const prompt = `
YOU ARE THE NEET AI LECTURE COMPANION TUTOR.
STUDENT REQUEST VIA CHAT: "${message}".

Generate structured 2-Page NEET Notes for this specific chapter: "${videoTitle}" (${inferredSubject}).
Enforce:
PAGE 1: Core Concepts, Definitions, and NCERT-Aligned Key Takeaways for this chapter.
PAGE 2: Formulas / Fact Bank, Shortcut Tricks / Mnemonics, and High-Yield PYQ Highlights from this chapter.

Delineate clearly with:
# PAGE 1: CORE CONCEPTS & NCERT TAKEAWAYS
and
# PAGE 2: FORMULA BANK, SHORTCUTS & PYQ HIGHLIGHTS
`;
        const text = await callGemini({
          contents: prompt,
          systemInstruction:
            `You are an elite NEET tutor specializing in ${inferredSubject}. Provide comprehensive notes for ${videoTitle}.`,
          temperature: 0.3,
          timeoutMs: 18000,
        });

        return res.json({
          reply: text,
          isNotes: true,
          notes: text,
        });
      } catch (notesErr) {
        console.warn('Using chapter knowledge engine for notes request:', notesErr);
        const resolved = resolveNeetNotesForTitle(videoTitle || 'NEET Chapter', inferredSubject);
        const fullNotes = `${resolved.page1}\n\n${resolved.page2}`;
        return res.json({
          reply: fullNotes,
          isNotes: true,
          notes: fullNotes,
        });
      }
    }

    // Standard conceptual question in chat
    const systemInstruction = `
You are the "NEET AI Lecture Companion" - a razor-sharp, encouraging NEET tutor specializing in ${inferredSubject}.
CONTEXT: The student is studying THIS SPECIFIC LECTURE & CHAPTER:
- Title: "${videoTitle || 'Current Video'}"
- Subject: ${inferredSubject}

RULES:
1. Ground your explanation directly in the NCERT syllabus for ${inferredSubject}.
2. If Biology: discuss cell structures, organelles, biochemical pathways, genetics, or anatomical features relevant to this chapter. Never mix with physics formulas!
3. If Chemistry: explain reaction mechanisms, orbital hybridization, equilibrium laws, or periodic trends.
4. If Physics: explain derivations, coordinate sign conventions, and dimensional formulas.
5. Highlight high-yield NEET exam traps (+4 / -1 marking) and memory tricks.
`;

    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-4)) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    try {
      const text = await callGemini({
        contents,
        systemInstruction,
        temperature: 0.4,
        timeoutMs: 18000,
      });

      return res.json({ reply: text });
    } catch (chatErr) {
      console.warn('Fallback chat response used:', chatErr);
      const resolved = resolveNeetNotesForTitle(videoTitle || 'NEET Lecture', inferredSubject);

      let subjectSpecificAdvice = '';
      if (inferredSubject === 'Biology') {
        subjectSpecificAdvice = `In NEET **Biology**, remember that NCERT diagrams, organelle structures, and enzyme names are tested verbatim by NTA. Be sure to review the cell structures, functions, and organelle coordination!`;
      } else if (inferredSubject === 'Chemistry') {
        subjectSpecificAdvice = `In NEET **Chemistry**, verify the oxidation states, orbital hybridization, and periodic trends from NCERT. Watch out for anomalous exceptions!`;
      } else {
        subjectSpecificAdvice = `In NEET **Physics**, verify vector sign conventions, dimensional consistency, and boundary constraints to avoid negative marking (-1).`;
      }

      return res.json({
        reply: `### NEET ${inferredSubject} Insight for ${resolved.detectedChapter}:\n\nRegarding your question: *"**${message}**"*\n\n${subjectSpecificAdvice}\n\n💡 **Key Takeaways from this chapter**:\n${resolved.page1.substring(0, 500)}...\n\n*(Tap "2-Page Notes" above to view complete formula bank and PYQs!)*`,
      });
    }
  } catch (err: any) {
    console.error('Error in chat:', err);
    return res.json({
      reply: `Please review the NCERT core chapter for this lecture. Make sure to check key definitions and practice previous year NEET questions!`,
    });
  }
});

// Vite Middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NEET AI Lecture Companion server listening on port ${PORT}`);
  });
}

startServer();
