import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import RotaryMoodDial, { MOOD_NODES } from './RotaryMoodDial';

const MoodDetection = ({ onMoodDetected }) => {
  const [activeTab, setActiveTab] = useState('dial'); // 'dial' | 'camera'
  const [isCamera, setIsCamera] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedMood, setDetectedMood] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [allEmotions, setAllEmotions] = useState([]);
  const webcamRef = useRef(null);

  const captureAndDetect = async () => {
    if (!webcamRef.current) return;

    setIsDetecting(true);
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Unable to capture webcam image');
      }

      const base64Response = await fetch(imageSrc);
      const blob = await base64Response.blob();

      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');

      const response = await axios.post(`${API_BASE_URL}/detect-mood`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;
      setDetectedMood(data.mood);
      setConfidence(data.confidence);
      setAllEmotions(data.all_emotions || []);

      setTimeout(() => {
        if (onMoodDetected) {
          onMoodDetected(data);
        }
      }, 1800);
    } catch (error) {
      console.error('Error detecting mood:', error);
      alert('Error detecting mood from camera. Please ensure camera permissions are granted or use the Rotary Mood Dial.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleDialSelect = (node) => {
    setDetectedMood(node.mappedMood || node.id);
    setConfidence(100);
  };

  const handleCurateStream = (node) => {
    if (onMoodDetected) {
      onMoodDetected({
        mood: node.mappedMood || node.id,
        sub_mood: node.id,
        confidence: 100,
        isManual: true,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn px-2 sm:px-4">
      {/* Tab Switcher: Rotary Dial vs Camera Scan */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1.5 rounded-2xl bg-obsidian-900/90 border border-obsidian-800 backdrop-blur-xl shadow-xl">
          <button
            onClick={() => setActiveTab('dial')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'dial'
                ? 'bg-gradient-to-r from-cyan/20 to-emerald/20 text-cyan border border-cyan/40 shadow-lg shadow-cyan/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎛️</span>
            <span>Interactive Mood Dial</span>
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'camera'
                ? 'bg-gradient-to-r from-cyan/20 to-emerald/20 text-cyan border border-cyan/40 shadow-lg shadow-cyan/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📸</span>
            <span>Live Camera Scan</span>
          </button>
        </div>
      </div>

      {/* Main Glass Panel */}
      <div className="bg-obsidian-900/70 backdrop-blur-2xl border border-obsidian-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/80">
        {activeTab === 'dial' ? (
          <div>
            <div className="text-center mb-6">
              <span className="text-[11px] font-mono uppercase tracking-widest text-cyan font-bold px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20">
                Tactile Emotion Tuner
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mt-3 mb-1">
                Dial In Your Atmosphere
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Turn the analog knob or tap any emotion node to dynamically morph the soundscape
              </p>
            </div>

            {/* Flagship Rotary Mood Dial Component */}
            <RotaryMoodDial
              onSelectMood={handleDialSelect}
              onCurateStream={handleCurateStream}
              showCurateButton={true}
            />
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald font-bold px-3 py-1 rounded-full bg-emerald/10 border border-emerald/20">
                Facial AI Recognition
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mt-3 mb-1">
                Scan Your Expression
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                DeepFace analyzes 7 facial micro-expressions to compute multi-class emotion weights
              </p>
            </div>

            {/* Camera Viewport */}
            <div className="relative aspect-video rounded-2xl bg-obsidian-950 border-2 border-dashed border-obsidian-750 flex items-center justify-center overflow-hidden mb-6 shadow-inner">
              {isCamera ? (
                <>
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle Target Reticle Overlay */}
                  <div className="absolute inset-8 border border-cyan/30 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-cyan absolute top-0 left-0" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-cyan absolute top-0 right-0" />
                    <div className="w-4 h-4 border-b-2 border-l-2 border-cyan absolute bottom-0 left-0" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-cyan absolute bottom-0 right-0" />
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-cyan/10 border border-cyan/30 flex items-center justify-center text-cyan shadow-lg shadow-cyan/10">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-300 font-medium">Camera is currently inactive</p>
                  <p className="text-xs text-slate-500 mt-1">Activate to scan facial emotions in real-time</p>
                </div>
              )}
            </div>

            {/* Camera Trigger Buttons */}
            {!isCamera ? (
              <button
                onClick={() => setIsCamera(true)}
                className="w-full bg-cyan hover:bg-cyan/90 text-obsidian-950 font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-cyan/20 flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Activate Camera</span>
              </button>
            ) : (
              <button
                onClick={captureAndDetect}
                disabled={isDetecting}
                className="w-full bg-gradient-to-r from-emerald to-teal-400 hover:from-emerald/90 hover:to-teal-300 text-obsidian-950 font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isDetecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Facial Micro-Expressions...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    <span>Capture & Detect Mood</span>
                  </>
                )}
              </button>
            )}

            {/* Results Card */}
            {detectedMood && (
              <div className="mt-6 p-4 rounded-2xl bg-obsidian-950/80 border border-cyan/30 text-center animate-fadeIn shadow-lg shadow-cyan/5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Detected Dominant State
                </span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xl font-bold uppercase text-cyan capitalize">
                    {detectedMood}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({Math.round(confidence)}% confidence)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodDetection;
