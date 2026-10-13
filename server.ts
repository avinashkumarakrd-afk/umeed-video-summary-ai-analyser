import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

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

// Utility to extract YouTube Video ID
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  // Standard watch URL: youtube.com/watch?v=ID
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  // Raw 11 char ID
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
      // Fallback if oembed fails or network restricted
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

// Enforce 2-page NEET Notes format
app.post('/api/gemini/generate-notes', async (req: Request, res: Response) => {
  try {
    const { videoId, videoTitle, videoUrl, subject } = req.body;
    if (!videoTitle) {
      return res.status(400).json({ error: 'Video details are required' });
    }

    const prompt = `
YOU ARE THE NEET AI LECTURE COMPANION TUTOR.
STUDENT REQUEST: "Concise the full video into 1-2 pages of notes".

CRITICAL DYNAMIC CONTEXT DIRECTIVE:
- Discard ANY past video session or outside topics.
- Analyze strictly THIS SPECIFIC LECTURE:
  Title: "${videoTitle}"
  YouTube Link: ${videoUrl || `https://www.youtube.com/watch?v=${videoId}`}
  Target Subject: ${subject || 'NEET Prep'}

ENFORCE THE MANDATORY 2-PAGE NEET STRUCTURE:

PAGE 1: Core Concepts, Definitions, and NCERT-Aligned Key Takeaways
- Must include:
  1. Detailed breakdown of core concepts taught in this lecture
  2. NCERT line-by-line definitions, standard terminologies & conventions
  3. High-yield conceptual checkpoints (what NTA NEET examiners frequently test)
  4. Common student misconceptions and traps to avoid

PAGE 2: All Formulas/Equations, Shortcut Tricks, and High-Yield PYQ Highlights from THIS SPECIFIC VIDEO
- Must include:
  1. Complete Formula Bank: Every mathematical relation, SI units, dimensional formula, and proportionality relation taught in this lecture.
  2. Speed Solving & Shortcut Tricks (mental math, dimensional analysis shortcuts, elimination heuristics).
  3. High-Yield PYQ Highlights: Specific previous years NEET questions (from 2015-2024 trends) directly solved or related to this exact video's topics, with year, question theme, and key concept applied.

FORMATTING:
Return clear, crisp Markdown with clean LaTeX/notation for equations (e.g. $F = ma$, $\\tau = I\\alpha$).
Clearly delineate:
# PAGE 1: CORE CONCEPTS & NCERT TAKEAWAYS
and
# PAGE 2: FORMULA BANK, SHORTCUTS & PYQ HIGHLIGHTS
`;

    if (!ai) {
      return res.json({
        notes: `# PAGE 1: CORE CONCEPTS & NCERT TAKEAWAYS\n\n### Lecture: ${videoTitle}\n- **Core Topic**: Comprehensive NEET ${subject} lecture.\n- **NCERT Alignment**: Direct coverage of NCERT chapter fundamentals.\n- **Key Definitions**: Standard definitions, state variables, and boundary conditions.\n- **Critical Takeaways**: Focus on fundamental principles, sign conventions, and graph interpretations.\n\n# PAGE 2: FORMULA BANK, SHORTCUTS & PYQ HIGHLIGHTS\n\n### 📐 Formula Bank\n- Key mathematical equations, proportionality relations, and unit consistency rules.\n\n### ⚡ Speed Tricks\n- Extreme value checking & dimensional elimination technique.\n\n### 🎯 High-Yield PYQs\n- Direct questions from NEET 2021, 2022, 2023 on this core chapter.`,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a premier NEET educator specializing in structured, high-yield NCERT lecture extraction. Maintain absolute context isolation for each video.',
          temperature: 0.3,
        },
      });

      return res.json({ notes: response.text || '' });
    } catch (modelErr) {
      console.warn('gemini-2.5-flash call fallback, trying gemini-3.8-flash:', modelErr);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      return res.json({ notes: fallbackResponse.text || '' });
    }
  } catch (err: any) {
    console.error('Error generating notes:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate notes' });
  }
});

// Interactive Preset Engine (Notes, Formula Sheet, Key PYQs, 5 Practice MCQs)
app.post('/api/gemini/preset', async (req: Request, res: Response) => {
  try {
    const { videoTitle, videoUrl, subject, presetType } = req.body;

    let specificPrompt = '';
    switch (presetType) {
      case 'formula':
        specificPrompt = `Generate a dedicated "FORMULA SHEET" strictly from this specific NEET lecture: "${videoTitle}".
Include:
1. Every formula, equation, constant value, and SI unit taught in this video.
2. Sign conventions and condition constraints.
3. Proportionality relationships (e.g. $y \\propto x^2$).
4. 3 Super-fast calculation hacks / shortcuts.`;
        break;

      case 'pyq':
        specificPrompt = `Extract "KEY HIGH-YIELD PYQs" directly tested on the exact concepts covered in this NEET video: "${videoTitle}".
Include:
- 4 to 5 past NEET questions (mentioning year like NEET 2019, NEET 2021, NEET 2023).
- Question statement.
- Four options (A, B, C, D).
- Step-by-step solution referencing the NCERT formula or concept taught in the lecture.
- "Why students get this wrong" trap alert.`;
        break;

      case 'mcq':
        specificPrompt = `Generate "5 PRACTICE MCQs" for NEET aspirants based STRICTLY on this video: "${videoTitle}".
Format each question with:
Q1 to Q5:
- Question stem (clinical/numerical/assertion-reasoning style as per latest NTA NEET pattern).
- Options: (A), (B), (C), (D).
- Correct Option.
- Detailed NCERT-grounded Explanation and elimination reason.`;
        break;

      default:
        specificPrompt = `Provide a structured NEET revision summary for the video "${videoTitle}".`;
    }

    const fullPrompt = `
DYNAMIC CONTEXT DIRECTIVE:
You are analyzing ONLY this video: "${videoTitle}" (${videoUrl || ''}, Subject: ${subject || 'NEET'}).
Wipe all previous conversation history. Focus exclusively on this lecture.

${specificPrompt}
`;

    if (!ai) {
      return res.json({
        content: `### ${presetType.toUpperCase()} for ${videoTitle}\n\n*Generated in offline/demo mode based on NEET ${subject} curriculum.*`,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          temperature: 0.4,
        },
      });
      return res.json({ content: response.text || '' });
    } catch {
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
      });
      return res.json({ content: fallback.text || '' });
    }
  } catch (err: any) {
    console.error('Error generating preset:', err);
    return res.status(500).json({ error: err.message || 'Failed to process preset' });
  }
});

// Chat endpoint with Dynamic Context Handling (Prevent Stuck Context)
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { videoTitle, videoUrl, subject, message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemInstruction = `
You are the "NEET AI Lecture Companion" - a knowledgeable, encouraging, and razor-sharp NEET tutor (Physics, Chemistry, Biology).
CRITICAL CONTEXT ISOLATION:
The student is studying THIS SPECIFIC VIDEO ONLY:
- Video Title: "${videoTitle || 'Current Video'}"
- Video URL: ${videoUrl || 'Provided by user'}
- Subject: ${subject || 'NEET'}

RULES:
1. Prevent Stuck Context: Treat all answers as strictly contextualized to this video and the NCERT NEET syllabus for this topic. Do not blend in details from previous videos the student might have discussed in older sessions.
2. Structure your answers with high pedagogical clarity: use bolding for NCERT keywords, bullet points, clear mathematical equations, and mnemonics when helpful.
3. Keep NEET exam scoring in mind: point out high-weightage topics, potential trap options, and time-saving shortcuts.
`;

    // Construct conversation payload strictly scoped to this session
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    if (!ai) {
      return res.json({
        reply: `Great question regarding **${videoTitle || 'this lecture'}**! In NEET ${subject || 'Physics/Chem/Bio'}, remember that NCERT defines this directly. Make sure to note the formula and units carefully.`,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.5,
        },
      });

      return res.json({ reply: response.text || '' });
    } catch {
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.5,
        },
      });

      return res.json({ reply: fallback.text || '' });
    }
  } catch (err: any) {
    console.error('Error in chat:', err);
    return res.status(500).json({ error: err.message || 'Failed to process chat message' });
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
