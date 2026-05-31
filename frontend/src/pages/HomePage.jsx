import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Particles from '../components/Particles';
import Chatbot from '../components/Chatbot';

const HomePage = () => {
  const navigate = useNavigate();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const handlePlaySong = (song) => {
    localStorage.setItem('recommendations', JSON.stringify([song]));
    navigate('/player');
  };

  const handlePlayPlaylist = (playlist) => {
    if (playlist && playlist.songs && playlist.songs.length > 0) {
      localStorage.setItem('recommendations', JSON.stringify(playlist.songs));
      navigate('/player');
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Detect Mood',
      description: 'Analyze your emotions through facial recognition or manual selection',
      icon: '😊',
      gradient: 'from-orange-400 to-orange-600',
      bgGradient: 'from-orange-400/10 to-orange-400/10',
      route: '/mood-detection'
    },
    {
      id: 2,
      title: 'Set Preferences',
      description: 'Choose language, genre, and add your favorite songs & artists',
      icon: '⚙️',
      gradient: 'from-blue-400 to-blue-600',
      bgGradient: 'from-blue-600/20 to-blue-800/20',
      route: '/preferences'
    },
    {
      id: 3,
      title: 'Get Recommendations',
      description: 'AI curates perfect playlists based on your mood and preferences',
      icon: '🎵',
      gradient: 'from-pink-400 to-pink-600',
      bgGradient: 'from-pink-600/20 to-pink-800/20',
      route: '/recommendations'
    },
    {
      id: 4,
      title: 'Enjoy Music',
      description: 'Stream songs seamlessly with our integrated player',
      icon: '▶️',
      gradient: 'from-green-400 to-green-600',
      bgGradient: 'from-green-600/20 to-green-800/20',
      route: '/player'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <Particles />
      
      <div className="relative z-10">
        <Header />
        
        <div className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fadeIn">
            <h1 className="text-6xl font-black text-white mb-6 leading-tight">
              Let Your <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Emotions</span><br/>
              Guide Your <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Playlist</span>
            </h1>
            <p className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto">
              AI-powered music recommendations that perfectly match your mood in four simple steps
            </p>
            
            {/* Music Wave Indicator */}
            <div className="flex justify-center items-end space-x-2 mb-12">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-wave"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>

            <button
              onClick={() => navigate('/mood-detection')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-2xl inline-flex items-center gap-3"
            >
              <span>Get Started</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {steps.map((step) => (
              <div
                key={step.id}
                onClick={() => navigate(step.route)}
                className="group relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                {/* Background Number */}
                <div className="absolute top-6 right-6 text-8xl font-black text-slate-700/20 group-hover:text-purple-500/10 transition-colors">
                  0{step.id}
                </div>

                {/* Icon */}
                <div className={`relative w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all`}>
                  <span className="text-4xl">{step.icon}</span>
                </div>

                {/* Updated Title (Fix Applied Here) */}
              <h3
  className={`${
    step.id === 3
      ? "text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors leading-tight w-full max-w-[180px] text-left break-words"
      : "text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors"
  }`}
>
  {step.title}
</h3>



                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  {step.description}
                </p>

                {/* Go to Step Button */}
                <button className="text-purple-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                  <span>Go to Step</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Features Section */}
          <div className="mt-20 text-center">
            <h2 className="text-4xl font-bold text-white mb-12">Why Choose MoodTunes AI?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI-Powered</h3>
                <p className="text-gray-400 text-sm">Advanced algorithms analyze your mood and preferences</p>
              </div>

              <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Personalized</h3>
                <p className="text-gray-400 text-sm">Tailored recommendations based on your unique taste</p>
              </div>

              <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Seamless</h3>
                <p className="text-gray-400 text-sm">Integrated YouTube player for instant music streaming</p>
              </div>
            </div>
          </div>

          {/* About Developer */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                    <span className="text-5xl font-black text-white">KA</span>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-white mb-3">About the Developer</h2>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                    Kumar Abhishek
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    ML/AI Engineer | BTech ECE @ IIIT Una  | Specializing in LangChain, RAG Systems,
                    Deep Learning & Full-Stack Development | Built AI-powered solutions including InterviewBot,
                    MoodTunes AI, and AI Newsletter Automation using FastAPI, React, and cutting-edge AI frameworks
                  </p>

                  <div className="flex items-center justify-center md:justify-start gap-4 mt-6">
                    <a
                      href="https://github.com/kumarAbhishek2004"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/50 px-4 py-2 rounded-lg transition-all text-gray-300 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <span className="text-sm">GitHub</span>
                    </a>

                    <a
                      href="https://linkedin.com/in/kumar-abhishek-6b5828288"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/50 px-4 py-2 rounded-lg transition-all text-gray-300 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span className="text-sm">LinkedIn</span>
                    </a>

                    <a
                      href="mailto:abhishek.kr0418@gmail.com"
                      className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/50 px-4 py-2 rounded-lg transition-all text-gray-300 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">Email</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Chatbot
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
        currentMood={null}
        onPlaySong={handlePlaySong}
        onPlayPlaylist={handlePlayPlaylist}
      />

      <style>{`
        @keyframes wave {
          0%, 100% { height: 15px; }
          50% { height: 35px; }
        }
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
