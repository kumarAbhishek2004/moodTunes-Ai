import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Chatbot = ({ isOpen, onToggle, currentMood, onPlaySong }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your music assistant. You can:\n• Say "play [song name]" for instant playback\n• Ask for recommendations\n• Search by artist, lyrics, or mood!',
      songs: [],
      playCommand: null
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const API_BASE_URL = "https://abhishek2607-music-rec-backend.hf.space";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSongClick = async (songName, artistName) => {
    try {
      console.log(`🎵 Playing: "${songName}" by ${artistName}`);
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: `🔍 Loading "${songName}"...`,
        songs: [],
        playCommand: null
      }]);
      
      const response = await axios.get(`${API_BASE_URL}/search-song`, {
        params: { name: songName, artist: artistName }
      });
      
      const song = response.data;
      
      if (!song.youtube_id) {
        setMessages(prev => prev.filter(msg => !msg.content.includes('🔍 Loading')));
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ "${songName}" found but no video available.`,
          songs: [],
          playCommand: null
        }]);
        return;
      }
      
      setMessages(prev => prev.filter(msg => !msg.content.includes('🔍 Loading')));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Now playing: "${song.name}" by ${song.artist}`,
        songs: [],
        playCommand: null
      }]);
      
      if (onPlaySong) {
        onPlaySong(song);
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      setMessages(prev => prev.filter(msg => !msg.content.includes('🔍 Loading')));
      
      const errorMsg = error.response?.data?.detail || 'Song not found';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ ${errorMsg}`,
        songs: [],
        playCommand: null
      }]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: '🎤 Listening... Speak now',
        songs: [],
        playCommand: null
      }]);
      
    } catch (error) {
      console.error('Microphone error:', error);
      alert('Could not access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      
      const response = await axios.post(`${API_BASE_URL}/voice/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const transcript = response.data.transcript;
      setMessages(prev => prev.filter(msg => msg.role !== 'system'));
      setInput(transcript);
      
      setMessages(prev => [...prev, {
        role: 'user',
        content: `🎤 ${transcript}`,
        songs: [],
        playCommand: null
      }]);
      
      setTimeout(() => handleSendMessage(transcript), 500);
      
    } catch (error) {
      console.error('Transcription error:', error);
      setMessages(prev => prev.filter(msg => msg.role !== 'system'));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, couldn\'t understand. Please try again.',
        songs: [],
        playCommand: null
      }]);
    } finally {
      setIsTranscribing(false);
    }
  };

  const renderMessage = (message) => {
    const { content, songs, playCommand } = message;
    
    return (
      <div className="space-y-2">
        {content && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        )}
        
        {/* Render song buttons */}
        {songs && songs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {songs.map((song, idx) => (
              <button
                key={idx}
                onClick={() => handleSongClick(song.name, song.artist)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-400 rounded-lg text-purple-300 hover:text-purple-200 transition-all text-sm group"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <div className="font-medium">{song.name}</div>
                  <div className="text-xs text-purple-400/70">{song.artist}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleSendMessage = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: textToSend,
        user_id: 'default',
        current_mood: currentMood?.mood || currentMood
      });

      // Handle direct play command
      if (response.data.play_command && response.data.play_command.autoplay) {
        const cmd = response.data.play_command;
        await handleSongClick(cmd.name, cmd.artist);
      }

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response || '',
        songs: response.data.recommended_songs || [],
        playCommand: response.data.play_command || null
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: error.response?.data?.detail || 'Connection error. Please try again.',
        songs: [],
        playCommand: null
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      role: 'user',
      content: input,
      songs: [],
      playCommand: null
    };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    setInput('');
    await handleSendMessage(currentInput);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 z-50 group transform hover:scale-110"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-gray-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-500/30 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Music Assistant</h3>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Voice & Text
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : message.role === 'system' ? 'justify-center' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none'
                      : message.role === 'system'
                      ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg'
                      : 'bg-gray-800 text-gray-200 rounded-bl-none'
                  }`}
                >
                  {renderMessage(message)}
                  {message.role !== 'system' && (
                    <p className="text-xs mt-2 opacity-70">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {(isLoading || isTranscribing) && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-3 rounded-lg rounded-bl-none shadow-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700 bg-gray-900/50 rounded-b-2xl">
            {currentMood && (
              <div className="mb-2 flex items-center gap-2 text-xs">
                <span className="text-gray-400">Current mood:</span>
                <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full capitalize">
                  {currentMood.mood || currentMood}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Play, recommend, or search..."
                className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 text-sm"
                disabled={isLoading || isRecording}
              />
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || isTranscribing}
                className={`rounded-lg px-4 py-2 transition-all disabled:opacity-50 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90'
                } text-white`}
              >
                {isRecording ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || isRecording}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Try: "Play Bohemian Rhapsody" or "Recommend workout music"
            </p>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </>
  );
};

export default Chatbot;