import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { resolveMusicTheme } from '../utils/themeMap';
import { openQueue } from '../store/audioSlice';

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Express or Detect Your Mood',
    tag: 'Input Layer',
    badgeColor: 'border-pink-500/30 text-pink-400 bg-pink-500/10',
    icon: '🎭',
    headline: '4 Ways to Tell MoodTunes AI How You Feel',
    description:
      'You do not need to scroll through endless genres. Simply show or tell MoodTunes AI your current emotional vibe:',
    features: [
      {
        icon: '📸',
        name: 'Face Emotion Scan',
        detail: 'AI computer vision analyzes subtle facial expressions in real-time to detect happiness, calmness, focus, or sadness.',
      },
      {
        icon: '🎙️',
        name: 'Voice Tone Analysis',
        detail: 'Speak a few words about your day; our neural engine evaluates acoustic pitch, cadence, and vocal energy.',
      },
      {
        icon: '✍️',
        name: 'Type Any Scene / Narrative',
        detail: 'Type what you are doing (e.g., "rainy midnight study session", "energetic gym pump") and AI infers the vibe.',
      },
      {
        icon: '🎛️',
        name: '360° Rotary Mood Dial',
        detail: 'Turn the physical tactile wheel to seamlessly transition between Happy, Romantic, Calm, Focus, Reflective, or Energetic.',
      },
    ],
  },
  {
    step: '02',
    title: 'Acoustic AI Intelligence',
    tag: 'Matching Engine',
    badgeColor: 'border-cyan/30 text-cyan bg-cyan/10',
    icon: '🧠',
    headline: 'Songs Selected by Audio DNA & Explainability',
    description:
      'Unlike black-box algorithms, MoodTunes AI matches your emotional valence with concrete musical properties:',
    features: [
      {
        icon: '⚡',
        name: 'BPM & Energy Calibration',
        detail: 'High-intensity workouts get punchy 140+ BPM rhythms; tranquil relaxation receives delta-frequency acoustic strings.',
      },
      {
        icon: '💡',
        name: 'Explainable AI Reasoning',
        detail: 'Every single song shows you an AI badge explaining exactly why it was chosen for your state of mind.',
      },
      {
        icon: '🔥',
        name: 'Hourly Live Trending Sync',
        detail: 'Live cached data from Last.fm and global music charts keeps fresh hits in your daily stream.',
      },
      {
        icon: '🛡️',
        name: 'Verified Parallel Audio',
        detail: 'High-definition audio streams through YouTube Parallel Streaming with direct fallbacks to ensure uninterrupted playback.',
      },
    ],
  },
  {
    step: '03',
    title: 'Studio Vinyl & Lyrics Experience',
    tag: 'Playback & Visuals',
    badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    icon: '💿',
    headline: 'Physical Turntable Studio Meets Modern Streaming',
    description:
      'Enjoy an analog-inspired tactile listening environment integrated with modern high-definition streaming:',
    features: [
      {
        icon: '🎛️',
        name: '12" Spinning Vinyl Turntable',
        detail: 'Realistic grooved vinyl record with tonearm physics that drops onto the record when you press play.',
      },
      {
        icon: '🎨',
        name: 'Dynamic Mood Color Grading',
        detail: 'The entire application morphs its background hues, glows, and accents to match the emotion of the current track.',
      },
      {
        icon: '📜',
        name: 'Real-time Synchronized Lyrics',
        detail: 'Karaoke-style synchronized lyrics follow along with every word of your favorite tracks.',
      },
      {
        icon: '🤖',
        name: 'Interactive Mood AI Chatbot',
        detail: 'Talk to your personal AI companion at the bottom corner to request songs, change vibes, or play from your playlists.',
      },
    ],
  },
  {
    step: '04',
    title: 'Complete Queue & Playlist Control',
    tag: 'Customization',
    badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    icon: '🥞',
    headline: 'Drag, Drop, and Prioritize What Plays Next',
    description:
      'You have complete sovereignty over your playback sequence without complicated menus:',
    features: [
      {
        icon: '⠿',
        name: 'Spotify-Style Drag & Drop',
        detail: 'Grab any track by its 6-dot handle (⠿) in recommendations or playlists and drag it up or down to customize the play order.',
      },
      {
        icon: '⚡',
        name: 'Instant "⚡ Next" Scheduling',
        detail: 'Click "⚡ Next" on any song to immediately jump it to the top of the upcoming queue.',
      },
      {
        icon: '🎛️',
        name: 'Playlist-to-Queue Live Sync',
        detail: 'When playing a playlist, reordering songs or clicking Next updates the live playback queue in real-time.',
      },
      {
        icon: '🔒',
        name: 'Isolated History & Member Playlists',
        detail: 'Each user has private history and custom playlists. Guests enjoy full streaming and queue customization freely.',
      },
    ],
  },
];

const FAQS = [
  {
    question: 'How does MoodTunes AI detect my mood using the camera?',
    answer:
      'When you click "Detect Mood with Face", your browser captures a snapshot from your webcam and sends it to our DeepFace emotion recognition backend. The neural model evaluates facial action units (smile curvature, eyebrow position, eye openness) to identify whether you feel Happy, Romantic, Calm, Sad, Energetic, or Focused. No images or videos are ever saved to disk — the snapshot is processed in memory and immediately discarded.',
  },
  {
    question: 'How do I adjust the queue and change which song plays next?',
    answer:
      'You have two easy ways: 1) Drag and Drop: Click and hold the 6-dot icon (⠿) next to any song in your recommendations, playlist, or queue drawer, and drop it anywhere you want. 2) Click "⚡ Next": This instantly schedules that song to play immediately after the current song finishes. You can also open the sliding Queue Drawer anytime to shuffle upcoming tracks or clear the queue.',
  },
  {
    question: 'What is the difference between Guest mode and logging in?',
    answer:
      'Anyone can use MoodTunes AI as a Guest without signing up! Guests have access to face detection, voice analysis, text synthesis, the rotary mood dial, streaming all songs, drag-and-drop queue adjustment, and the AI chatbot. Logging in with a free account unlocks saving custom mood playlists, synchronizing your taste profile across devices, and maintaining your personal listening history.',
  },
  {
    question: 'What makes Explainable AI Reasoning different?',
    answer:
      'Standard music apps hide why songs appear on your feed. MoodTunes AI provides an explicit Explainable AI tag for every single track (e.g. "140+ BPM cadence and punchy 808 sub-bass engineered for peak motivational momentum" or "Delicate acoustic guitar fingerpicking tuned for intimate nostalgia"). This connects the musical characteristics directly to your emotional state.',
  },
  {
    question: 'How does the vinyl turntable studio work?',
    answer:
      'When you open the player, MoodTunes AI switches to an authentic 12" Vinyl Turntable Studio. The virtual tonearm drops onto the spinning record grooves as audio plays, accompanied by a dynamic frequency visualizer and synchronized lyrics. You can switch between Vinyl Mode and YouTube Video Mode with one click.',
  },
];

const AboutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentSong, activeMood } = useSelector((state) => state.audio);
  const theme = resolveMusicTheme(currentSong, activeMood);

  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (idx) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div
      className="min-h-screen text-slate-100 transition-colors duration-1000 relative pb-32 font-sans selection:bg-cyan/30"
      style={{
        background: `radial-gradient(ellipse at 50% -5%, rgba(${theme.accentRgb || '0, 242, 254'}, 0.22) 0%, transparent 70%), #060B10`,
      }}
    >
      {/* Dynamic Background Glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out z-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 85% 20%, rgba(${theme.accentRgb || '0, 242, 254'}, 0.18), transparent 50%), radial-gradient(circle at 15% 75%, rgba(${theme.accentRgb || '0, 242, 254'}, 0.12), transparent 50%)`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 space-y-16 sm:space-y-24">
        
        {/* ============================================================== */}
        {/* 1. HERO SECTION: SIMPLE & CINEMATIC                             */}
        {/* ============================================================== */}
        <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold tracking-wide backdrop-blur-md">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent, boxShadow: `0 0 10px ${theme.glow}` }} />
            <span style={{ color: theme.accent }}>MOODTUNES AI ARCHITECTURE</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">How It Works</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Music that understands{' '}
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.accent} 0%, #FFFFFF 100%)`,
              }}
            >
              how you feel.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            MoodTunes AI eliminates endless track browsing. By combining real-time emotion detection, acoustic intelligence, and customizable drag-and-drop queues, your mood becomes the soundtrack.
          </p>

          {/* Quick Action Navigation CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-full font-bold text-xs sm:text-sm text-obsidian-950 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${theme.accent} 0%, #ffffff 100%)`,
                boxShadow: `0 8px 24px -4px ${theme.glow}`,
              }}
            >
              <span>🚀 Try It Live</span>
              <span>→</span>
            </button>

            <button
              onClick={() => navigate('/playlists')}
              className="px-5 py-3 rounded-full font-semibold text-xs sm:text-sm text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🥞 View Playlists</span>
            </button>

            <button
              onClick={() => dispatch(openQueue())}
              className="px-5 py-3 rounded-full font-semibold text-xs sm:text-sm text-cyan bg-cyan/10 hover:bg-cyan/15 border border-cyan/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🎛️ Open Queue Drawer</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. FOUR CORE STEPS EXPLAINED SIMPLY                            */}
        {/* ============================================================== */}
        <div className="space-y-10 sm:space-y-14">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              The 4-Step Pipeline
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Simple. Intelligent. In Your Control.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Here is how MoodTunes AI turns your emotional pulse into a high-fidelity continuous stream.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div
                key={step.step}
                className="group relative rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-slate-600 group-hover:text-slate-400 transition-colors">
                      {step.step}
                    </span>
                    <span
                      className={`text-[10.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${step.badgeColor}`}
                    >
                      {step.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-2xl select-none">{step.icon}</span>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Feature Bullets */}
                  <div className="space-y-3.5 mb-4">
                    {step.features.map((feat) => (
                      <div
                        key={feat.name}
                        className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm select-none">{feat.icon}</span>
                          <span className="text-xs font-bold text-white tracking-tight">
                            {feat.name}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-400 leading-normal pl-6">
                          {feat.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Step {step.step} Active</span>
                  <span className="text-cyan group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>Learn more</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. AT A GLANCE: QUEUE & PLAYLIST REORDERING VISUAL GUIDE       */}
        {/* ============================================================== */}
        <div
          className="relative rounded-3xl p-6 sm:p-10 border backdrop-blur-2xl shadow-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(${theme.accentRgb || '0, 242, 254'}, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)`,
            borderColor: `rgba(${theme.accentRgb || '0, 242, 254'}, 0.3)`,
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan/15 text-cyan border border-cyan/30 text-xs font-mono font-bold uppercase tracking-wider">
                <span>⚡ Power Feature</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                How Drag-and-Drop & Queue Scheduling Work
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Whether you are listening to recommendations or playing a custom playlist, you have instant tactile control over the playback queue:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-cyan font-bold text-xs">
                    <span className="text-base">⠿</span>
                    <span>6-Dot Drag Handle</span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-normal">
                    Grab any track in the tracklist or playlist table. Move it up or down — the cyan drop line highlights the exact destination.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <span>⚡</span>
                    <span>Play Next Button</span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-normal">
                    Found a song you want to hear next? Click <strong>⚡ Next</strong>. It immediately places that track right after the currently playing song.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <span>🥞</span>
                    <span>Playlist-to-Queue Sync</span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-normal">
                    When you play a playlist, reordering songs or clicking Next updates the live playing queue in real-time.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <span>🎛️</span>
                    <span>Sliding Queue Drawer</span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-normal">
                    Click the Queue icon on the bottom player or playlist page to inspect, shuffle, or clear upcoming tracks anytime.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Visual Card */}
            <div className="lg:col-span-5 bg-obsidian-950/80 rounded-2xl border border-white/15 p-5 shadow-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-slate-400">
                <span className="text-emerald-400 font-bold">● LIVE QUEUE PREVIEW</span>
                <span>Active Sync</span>
              </div>

              {/* Sample Track Row 1 */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-cyan/15 border border-cyan/30 text-white">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
                  <span className="font-bold">1. Kesariya</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan/20 text-cyan">PLAYING NOW</span>
              </div>

              {/* Sample Track Row 2 */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">⠿</span>
                  <span>2. Apna Bana Le</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">UP NEXT ⚡</span>
              </div>

              {/* Sample Track Row 3 */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">⠿</span>
                  <span>3. Raataan Lambiyan</span>
                </div>
                <span className="text-[10px] text-slate-400">In Queue</span>
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-400">
                Drag using ⠿ or click ⚡ Next on any song to reorder!
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. FREQUENTLY ASKED QUESTIONS (ACCORDION)                      */}
        {/* ============================================================== */}
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Clear, simple answers to how MoodTunes AI operates behind the scenes.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden transition-all backdrop-blur-xl"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                      {faq.question}
                    </span>
                    <span className="text-slate-400 text-lg transition-transform duration-200">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3 animate-fadeIn">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 5. BOTTOM CALL TO ACTION                                      */}
        {/* ============================================================== */}
        <div className="text-center py-10 px-6 rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-2xl space-y-4">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            Ready to find your vibe?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Choose your mood, customize your queue, and experience music crafted around how you feel.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm text-obsidian-950 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${theme.accent} 0%, #ffffff 100%)`,
              }}
            >
              Start Listening Now →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
