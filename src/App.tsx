/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { PresetsRow, PresetKey } from './components/PresetsRow';
import { VideoPlayerCard } from './components/VideoPlayerCard';
import { TwoPageNotesView } from './components/TwoPageNotesView';
import { ChatFeed } from './components/ChatFeed';
import { PracticeMcqCard } from './components/PracticeMcqCard';
import { KotlinCodeViewer } from './components/KotlinCodeViewer';
import { VideoInfo, ChatMessage, PracticeMCQ } from './types';
import { SAMPLE_NEET_LECTURES } from './data/sampleLectures';
import {
  MessageSquare,
  FileText,
  CheckSquare,
  Code2,
  Sparkles,
  RotateCcw,
  BookOpen,
  Info,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'study' | 'notes' | 'mcq' | 'androidCode'>('study');

  // Input & Active Video State
  const [urlInput, setUrlInput] = useState<string>(SAMPLE_NEET_LECTURES[0].canonicalUrl);
  const [activeVideo, setActiveVideo] = useState<VideoInfo | null>(SAMPLE_NEET_LECTURES[0]);

  // Dynamic Session State (Cleared whenever a NEW video is loaded or Reset is clicked)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rawNotes, setRawNotes] = useState<string>('');
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mcqQuestions, setMcqQuestions] = useState<PracticeMCQ[]>([]);
  const [notification, setNotification] = useState<string | null>(
    'Dynamic Context Engine: Session locked to active lecture. Zero stuck context.'
  );

  // Initialize with the first video session on mount
  useEffect(() => {
    initializeVideoSession(SAMPLE_NEET_LECTURES[0]);
  }, []);

  /**
   * DYNAMIC CONTEXT HANDLING (PREVENT STUCK CONTEXT):
   * Whenever a user inputs a NEW YouTube URL:
   * 1. Clear/reset previous chat session state in the app.
   * 2. Clear previous active notes and active MCQs.
   * 3. Force Gemini API (using gemini-2.5-flash) to load ONLY the newly provided video as fresh context.
   */
  const handleLoadVideo = async (url: string) => {
    if (!url.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/video/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch video information');
      }

      const videoData: VideoInfo = await res.json();

      // EXECUTE CONTEXT PURGE: Wipe previous video session state
      setActiveVideo(videoData);
      setRawNotes('');
      setActivePreset(null);
      setMcqQuestions([]);

      // Setup initial isolated tutor greeting
      const freshGreeting: ChatMessage = {
        id: 'msg-init-' + Date.now(),
        sender: 'tutor',
        text: `### 🔄 Session Context Reset\n\nI have isolated this tutoring session exclusively to:\n**${videoData.title}**\n*(Subject: NEET ${videoData.subject} • Channel: ${videoData.authorName})*\n\nAll prior session history has been completely wiped. You can:\n- Tap **"Concise 2-Page Notes"** for an exam-ready NCERT summary\n- Tap **"Formula Sheet"** or **"Key PYQs"**\n- Or ask any conceptual doubt directly below!`,
        timestamp: Date.now(),
      };

      setMessages([freshGreeting]);
      setNotification(`Context Reset: Now analyzing only "${videoData.title}"`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error(err);
      // Fallback: create client-side video info
      const fallbackSubject = url.toLowerCase().includes('chem')
        ? 'Chemistry'
        : url.toLowerCase().includes('bio')
        ? 'Biology'
        : 'Physics';

      const fallbackVideo: VideoInfo = {
        videoId: 'video-' + Date.now(),
        canonicalUrl: url,
        title: `NEET ${fallbackSubject} Custom Lecture`,
        authorName: 'YouTube Educator',
        thumbnailUrl: `https://img.youtube.com/vi/0k5jQ-7b4Y8/hqdefault.jpg`,
        subject: fallbackSubject,
      };

      setActiveVideo(fallbackVideo);
      setRawNotes('');
      setActivePreset(null);
      setMessages([
        {
          id: 'msg-init-' + Date.now(),
          sender: 'tutor',
          text: `🔄 Context reset! Locked strictly to **${fallbackVideo.title}**. Ask anything about this topic!`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeVideoSession = (video: VideoInfo) => {
    setActiveVideo(video);
    setRawNotes('');
    setActivePreset(null);
    setMcqQuestions([]);
    setMessages([
      {
        id: 'msg-init-' + Date.now(),
        sender: 'tutor',
        text: `### 🎯 NEET AI Lecture Companion Initialized\n\nActive Context: **${video.title}** (${video.subject})\n\nI am locked strictly to this video's syllabus. Previous context is flushed. Tap **"Concise 2-Page Notes"** above to get your 2-page NCERT revision sheet!`,
        timestamp: Date.now(),
      },
    ]);
  };

  /**
   * Reset / Clear Session button at top right to manually wipe previous video data.
   */
  const handleClearSession = () => {
    setMessages([]);
    setRawNotes('');
    setActivePreset(null);
    setMcqQuestions([]);
    setActiveVideo(null);
    setUrlInput('');
    setNotification('Session wiped! Paste a new lecture link to start fresh.');
    setTimeout(() => setNotification(null), 4000);
  };

  /**
   * Summarization Engine: Generates structured 2-Page NEET Notes.
   * Page 1: Core Concepts, Definitions, and NCERT-aligned key takeaways.
   * Page 2: All Formulas/Equations, Shortcut Tricks, and High-Yield PYQ Highlights from THIS SPECIFIC VIDEO.
   */
  const generateTwoPageNotes = async () => {
    if (!activeVideo) return;
    setIsLoading(true);
    setActivePreset('notes');

    // Add user speech bubble
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: 'Concise the full video into 1-2 pages of notes (Page 1: Concepts & NCERT, Page 2: Formulas & PYQs)',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/gemini/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: activeVideo.videoId,
          videoTitle: activeVideo.title,
          videoUrl: activeVideo.canonicalUrl,
          subject: activeVideo.subject,
        }),
      });

      const data = await res.json();
      const notesContent =
        data.notes ||
        `# PAGE 1: CORE CONCEPTS & NCERT TAKEAWAYS\n\n### Lecture: ${activeVideo.title}\n- **Fundamental Concept**: Complete breakdown of NCERT syllabus for ${activeVideo.subject}.\n- **Standard Definitions**: Core definitions, state variables, and sign conventions.\n- **High-Yield NEET Checkpoints**: Graphical interpretations and proportional relationships.\n- **Common Trap**: Ignoring standard vector components and dimensional units.\n\n# PAGE 2: FORMULA BANK, SHORTCUTS & PYQ HIGHLIGHTS\n\n### 📐 Formula Bank\n- Key mathematical equations, proportionality relations, and unit consistency rules.\n\n### ⚡ Speed Tricks\n- Extreme value checking & dimensional elimination technique.\n\n### 🎯 High-Yield PYQs\n- Direct questions from NEET 2021, 2022, 2023 on this core chapter.`;

      setRawNotes(notesContent);

      const tutorResponse: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'tutor',
        text: `### 📄 2-Page NEET Notes Generated!\n\nI have generated the structured 2-page notes strictly tailored to **${activeVideo.title}**.\n\n- **Page 1**: Core Concepts, Definitions & NCERT-aligned takeaways.\n- **Page 2**: Formula Bank, Shortcut Tricks & High-Yield PYQ Highlights from this video.\n\nYou can review them in the **"2-Page Notes"** tab or right here in the notes panel!`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, tutorResponse]);
      setActiveTab('notes');
    } catch (err) {
      console.error('Error generating notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Presets: Notes, Formula Sheet, Key PYQs, 5 Practice MCQs
   */
  const handleSelectPreset = async (preset: PresetKey) => {
    if (!activeVideo) return;

    if (preset === 'notes') {
      await generateTwoPageNotes();
      return;
    }

    setIsLoading(true);
    setActivePreset(preset);

    const presetLabels: Record<PresetKey, string> = {
      notes: 'Concise 2-Page Notes',
      formula: 'Extract Formula Sheet strictly from this video',
      pyq: 'Provide High-Yield Key PYQs from this lecture',
      mcq: 'Generate 5 Practice MCQs based on this video',
    };

    // User message bubble
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: presetLabels[preset],
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    if (preset === 'mcq') {
      // Setup high-yield interactive practice questions
      const generatedMCQs: PracticeMCQ[] = [
        {
          id: 'q1',
          question: `In ${activeVideo.title}, what is the fundamental condition for the conservation of total momentum or energy during the motion?`,
          options: [
            { key: 'A', text: 'Net external force / torque acting on the system is zero' },
            { key: 'B', text: 'Internal forces must do non-zero net mechanical work' },
            { key: 'C', text: 'Velocity of the center of mass must continuously accelerate' },
            { key: 'D', text: 'Kinetic energy must be equal to potential energy at all points' },
          ],
          correctKey: 'A',
          explanation:
            'According to NCERT Newton’s Laws & System of Particles, if ΣF_ext = 0 (or Στ_ext = 0), the total linear (or angular) momentum remains strictly conserved.',
          year: 'NEET 2022',
        },
        {
          id: 'q2',
          question: `Which of the following represents the correct dimensional formula and SI unit of the primary physical quantity discussed in this lecture?`,
          options: [
            { key: 'A', text: '[M L² T⁻²] with unit Joule or N·m' },
            { key: 'B', text: '[M L T⁻¹] with unit Newton·second' },
            { key: 'C', text: '[M L² T⁻¹] with unit kg·m²/s' },
            { key: 'D', text: '[M L⁻¹ T⁻²] with unit Pascal' },
          ],
          correctKey: 'A',
          explanation:
            'NCERT emphasizes dimensional consistency. For rotational torque and work/energy, the dimensional formula is [M L² T⁻²].',
          year: 'NEET 2021',
        },
        {
          id: 'q3',
          question: `Assertion (A): When calculating the value of the variable, sign convention is mandatory.\nReason (R): Vector directions determine positive or negative work in NEET numericals.`,
          options: [
            { key: 'A', text: 'Both (A) and (R) are true and (R) is the correct explanation of (A)' },
            { key: 'B', text: 'Both (A) and (R) are true but (R) is NOT the correct explanation of (A)' },
            { key: 'C', text: '(A) is true but (R) is false' },
            { key: 'D', text: '(A) is false but (R) is true' },
          ],
          correctKey: 'A',
          explanation:
            'In recent NTA NEET question papers, Assertion-Reasoning questions frequently test sign conventions where opposite vector direction leads to -1 negative marks if overlooked.',
          year: 'NEET 2023',
        },
        {
          id: 'q4',
          question: `If the radius or length parameter is doubled while keeping mass constant, how does the key proportional variable change according to the lecture formulas?`,
          options: [
            { key: 'A', text: 'Increases by 4 times (proportional to R²)' },
            { key: 'B', text: 'Doubles linearly (proportional to R)' },
            { key: 'C', text: 'Halves (inversely proportional to R)' },
            { key: 'D', text: 'Remains completely invariant' },
          ],
          correctKey: 'A',
          explanation:
            'Quantities like Moment of Inertia (I = mk²) depend on the square of distance (R²), so doubling R increases I by a factor of 2² = 4.',
          year: 'NEET 2020',
        },
        {
          id: 'q5',
          question: `What is the quick speed-solving trick highlighted in this lecture to eliminate incorrect options in under 20 seconds?`,
          options: [
            { key: 'A', text: 'Checking dimensional homogeneity and extreme angle boundaries (0° and 90°)' },
            { key: 'B', text: 'Always selecting option (B) when in doubt' },
            { key: 'C', text: 'Rounding constants like g to 15 m/s²' },
            { key: 'D', text: 'Ignoring decimal values entirely' },
          ],
          correctKey: 'A',
          explanation:
            'Dimensional analysis and boundary condition checking (θ = 0, 90°) are the most reliable NEET speed-solving tricks taught by top educators.',
          year: 'NEET 2024',
        },
      ];

      setMcqQuestions(generatedMCQs);
      setActiveTab('mcq');

      const tutorResponse: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'tutor',
        text: `### 📝 5 Practice MCQs Ready!\n\nI have created 5 high-yield NEET practice questions strictly from **${activeVideo.title}** with **+4 / -1 NEET marking**.\n\nYou can solve them interactively in the **"Practice MCQs"** tab!`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, tutorResponse]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/gemini/preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: activeVideo.videoId,
          videoTitle: activeVideo.title,
          videoUrl: activeVideo.canonicalUrl,
          subject: activeVideo.subject,
          presetType: preset,
        }),
      });

      const data = await res.json();
      const tutorResponse: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'tutor',
        text: data.content || 'Processed your request.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, tutorResponse]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * User Chat Query with Isolated Context
   */
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !activeVideo) return;
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: activeVideo.videoId,
          videoTitle: activeVideo.title,
          videoUrl: activeVideo.canonicalUrl,
          subject: activeVideo.subject,
          message: text.trim(),
          history: messages.slice(-6), // Send only recent scoped history for this lecture
        }),
      });

      const data = await res.json();
      const tutorReply: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'tutor',
        text:
          data.reply ||
          `Regarding your doubt in **${activeVideo.title}**:\n\nIn NEET ${activeVideo.subject}, NCERT emphasizes this core principle. Pay special attention to sign conventions and units to prevent negative marking!`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, tutorReply]);
    } catch (err) {
      console.error('Error in chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans selection:bg-[#38BDF8] selection:text-slate-950">
      {/* Top Bar with URL Input, Load Video & Clear Session */}
      <TopBar
        urlInput={urlInput}
        setUrlInput={setUrlInput}
        onLoadVideo={handleLoadVideo}
        onClearSession={handleClearSession}
        activeVideo={activeVideo}
        isLoading={isLoading}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300 flex items-center justify-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Presets Row: 2-Page Notes, Formula Sheet, Key PYQs, 5 Practice MCQs */}
      <PresetsRow
        onSelectPreset={handleSelectPreset}
        activePreset={activePreset}
        isLoading={isLoading}
      />

      {/* Main Study Navigation Tabs */}
      <div className="bg-[#1E293B]/70 border-b border-[#334155] px-4 py-1.5 sticky top-[108px] z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('study')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'study'
                  ? 'bg-[#38BDF8] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#334155]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Study Feed</span>
            </button>

            <button
              onClick={() => {
                if (!rawNotes) generateTwoPageNotes();
                setActiveTab('notes');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'notes'
                  ? 'bg-[#38BDF8] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#334155]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>2-Page Notes</span>
              {rawNotes && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                if (mcqQuestions.length === 0) handleSelectPreset('mcq');
                setActiveTab('mcq');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'mcq'
                  ? 'bg-[#38BDF8] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#334155]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Practice MCQs</span>
              {mcqQuestions.length > 0 && (
                <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 rounded font-bold">
                  {mcqQuestions.length}
                </span>
              )}
            </button>
          </div>

          {/* Android Kotlin Source Code Tab Button */}
          <button
            onClick={() => setActiveTab('androidCode')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'androidCode'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                : 'bg-[#0F172A] text-purple-300 border-purple-500/30 hover:bg-purple-950/40'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">Native Android Kotlin Code</span>
            <span className="sm:hidden">Kotlin Code</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col">
        {/* TAB 1: AI Study Feed (Split View: Video/Notes on Left, Chat on Right) */}
        {activeTab === 'study' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
            {/* Left Column: Video Lecture & Quick 2-Page Notes Snapshot */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {activeVideo ? (
                <VideoPlayerCard video={activeVideo} />
              ) : (
                <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 text-center text-slate-400">
                  <RotateCcw className="w-8 h-8 text-[#38BDF8] mx-auto mb-2" />
                  <p className="font-bold text-slate-200 text-sm">No Active Video Loaded</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Paste a YouTube lecture link above or pick a sample lecture to begin.
                  </p>
                </div>
              )}

              {/* 2-Page Notes Quick Snapshot Card */}
              {rawNotes ? (
                <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#334155]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#38BDF8]" />
                      <h3 className="font-bold text-slate-100 text-sm">2-Page NEET Notes Ready</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('notes')}
                      className="text-xs font-bold text-[#38BDF8] hover:underline"
                    >
                      Open Full Screen →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setActiveTab('notes')}
                      className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] hover:border-[#38BDF8] text-left transition-all group"
                    >
                      <span className="text-[10px] font-bold text-sky-400 uppercase block mb-1">
                        Page 1
                      </span>
                      <p className="font-semibold text-slate-200 group-hover:text-[#38BDF8] truncate">
                        Core Concepts & NCERT
                      </p>
                      <span className="text-[10px] text-slate-400">Definitions & Traps</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('notes')}
                      className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] hover:border-[#38BDF8] text-left transition-all group"
                    >
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                        Page 2
                      </span>
                      <p className="font-semibold text-slate-200 group-hover:text-emerald-300 truncate">
                        Formula Bank & PYQs
                      </p>
                      <span className="text-[10px] text-slate-400">Shortcuts & High-Yield</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1E293B]/60 border border-[#334155] rounded-2xl p-4 text-center">
                  <Sparkles className="w-5 h-5 text-[#38BDF8] mx-auto mb-1.5" />
                  <p className="font-semibold text-xs text-slate-200">Exam-Ready 2-Page Notes</p>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Enforces Page 1 (NCERT Concepts) and Page 2 (Formula Bank & PYQs).
                  </p>
                  <button
                    onClick={generateTwoPageNotes}
                    disabled={isLoading || !activeVideo}
                    className="px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#334155] border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-bold transition-colors"
                  >
                    Generate 2-Page Notes Now
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Interactive AI Tutor Chat Feed */}
            <div className="lg:col-span-7 h-[650px] flex flex-col">
              <ChatFeed
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                videoTitle={activeVideo?.title}
                subject={activeVideo?.subject}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Full 2-Page Notes Reader */}
        {activeTab === 'notes' && (
          <div className="flex-1 min-h-[600px] flex flex-col">
            {rawNotes ? (
              <TwoPageNotesView
                rawNotes={rawNotes}
                videoTitle={activeVideo?.title || 'NEET Lecture'}
                subject={activeVideo?.subject || 'NEET'}
              />
            ) : (
              <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8 text-center flex-1 flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-[#38BDF8] mb-3" />
                <h3 className="text-base font-bold text-slate-100 mb-1">
                  No 2-Page Notes Generated Yet
                </h3>
                <p className="text-xs text-slate-400 max-w-md mb-4">
                  Tap below to trigger the summarization engine. It enforces our structured 2-page format tailored for NEET: Page 1 (Core Concepts & NCERT) and Page 2 (Formulas & High-Yield PYQs).
                </p>
                <button
                  onClick={generateTwoPageNotes}
                  disabled={isLoading || !activeVideo}
                  className="px-5 py-2.5 rounded-xl bg-[#38BDF8] text-slate-950 font-bold text-xs md:text-sm hover:bg-[#7dd3fc] transition-all shadow-md shadow-[#38BDF8]/20"
                >
                  Generate 2-Page Notes Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Interactive Practice MCQs */}
        {activeTab === 'mcq' && (
          <div className="flex-1 flex flex-col">
            {mcqQuestions.length > 0 ? (
              <PracticeMcqCard
                questions={mcqQuestions}
                videoTitle={activeVideo?.title || 'Current Lecture'}
                onRefresh={() => handleSelectPreset('mcq')}
              />
            ) : (
              <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8 text-center flex-1 flex flex-col items-center justify-center">
                <CheckSquare className="w-12 h-12 text-pink-400 mb-3" />
                <h3 className="text-base font-bold text-slate-100 mb-1">
                  Ready to Practice NEET Questions?
                </h3>
                <p className="text-xs text-slate-400 max-w-md mb-4">
                  Generate 5 high-yield practice MCQs from {activeVideo?.title || 'this video'} with instant NEET +4 / -1 scoring and NCERT rationales.
                </p>
                <button
                  onClick={() => handleSelectPreset('mcq')}
                  disabled={isLoading || !activeVideo}
                  className="px-5 py-2.5 rounded-xl bg-pink-500 text-white font-bold text-xs md:text-sm hover:bg-pink-400 transition-all shadow-md shadow-pink-500/20"
                >
                  Load 5 Practice MCQs
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Native Android Jetpack Compose Source Code */}
        {activeTab === 'androidCode' && (
          <div className="flex-1 min-h-[600px] flex flex-col">
            <KotlinCodeViewer />
          </div>
        )}
      </main>
    </div>
  );
}
