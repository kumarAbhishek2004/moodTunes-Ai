import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveMood } from '../store/audioSlice';

export const MOOD_NODES = [
  {
    id: 'calm',
    name: 'Calm',
    angle: 0,
    emoji: '🌊',
    tagline: 'Serene ambient soundscapes & soothing melodies',
    color: '#00F2FE',
    glowClass: 'shadow-[0_0_30px_rgba(0,242,254,0.35)]',
    textClass: 'text-cyan',
    borderClass: 'border-cyan/40',
    bgClass: 'bg-cyan/15',
    mappedMood: 'calm',
  },
  {
    id: 'focus',
    name: 'Focus',
    angle: 60,
    emoji: '🧠',
    tagline: 'Deep instrumental lo-fi & distraction-free flows',
    color: '#10B981',
    glowClass: 'shadow-[0_0_30px_rgba(16,185,129,0.35)]',
    textClass: 'text-emerald',
    borderClass: 'border-emerald/40',
    bgClass: 'bg-emerald/15',
    mappedMood: 'focus',
  },
  {
    id: 'energetic',
    name: 'Energetic',
    angle: 120,
    emoji: '⚡',
    tagline: 'High BPM, punchy rhythms & pulse-raising beats',
    color: '#F97316',
    glowClass: 'shadow-[0_0_30px_rgba(249,115,22,0.35)]',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-400/40',
    bgClass: 'bg-orange-400/15',
    mappedMood: 'energetic',
  },
  {
    id: 'happy',
    name: 'Happy',
    angle: 180,
    emoji: '✨',
    tagline: 'Bright euphoric anthems, golden keys & joyful energy',
    color: '#F59E0B',
    glowClass: 'shadow-[0_0_30px_rgba(245,158,11,0.35)]',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-400/40',
    bgClass: 'bg-amber-400/15',
    mappedMood: 'happy',
  },
  {
    id: 'romantic',
    name: 'Romantic',
    angle: 240,
    emoji: '💖',
    tagline: 'Warm soulful harmonies & intimate acoustic vibes',
    color: '#EC4899',
    glowClass: 'shadow-[0_0_30px_rgba(236,72,153,0.35)]',
    textClass: 'text-pink-400',
    borderClass: 'border-pink-400/40',
    bgClass: 'bg-pink-400/15',
    mappedMood: 'romantic',
  },
  {
    id: 'sad',
    name: 'Reflective',
    angle: 300,
    emoji: '🌧️',
    tagline: 'Gentle melancholic reflections & slow rainy sessions',
    color: '#3B82F6',
    glowClass: 'shadow-[0_0_30px_rgba(59,130,246,0.35)]',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-400/40',
    bgClass: 'bg-blue-400/15',
    mappedMood: 'sad',
  },
];

const findClosestNode = (angle) => {
  const normalized = ((angle % 360) + 360) % 360;
  let closest = MOOD_NODES[0];
  let minDiff = 360;

  for (const node of MOOD_NODES) {
    let diff = Math.abs(normalized - node.angle);
    if (diff > 180) diff = 360 - diff;
    if (diff < minDiff) {
      minDiff = diff;
      closest = node;
    }
  }
  return closest;
};

const RotaryMoodDial = ({
  onSelectMood,
  onCurateStream,
  showCurateButton = true,
  compact = false,
  showPills = true,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const reduxActiveMood = useSelector((state) => state.audio.activeMood) || 'calm';
  const dialRef = useRef(null);

  // Find initial node from Redux
  const initialNode = MOOD_NODES.find((m) => m.id === reduxActiveMood.toLowerCase()) || MOOD_NODES[0];

  const [rotationAngle, setRotationAngle] = useState(initialNode.angle);
  const [activeNode, setActiveNode] = useState(initialNode);
  const [isDragging, setIsDragging] = useState(false);

  // Sync state if Redux activeMood changes externally (e.g., from player or scanner)
  useEffect(() => {
    const node = MOOD_NODES.find((m) => m.id === reduxActiveMood.toLowerCase());
    if (node && node.id !== activeNode.id && !isDragging) {
      setActiveNode(node);
      setRotationAngle(node.angle);
    }
  }, [reduxActiveMood, activeNode.id, isDragging]);

  const selectNode = useCallback((node) => {
    setActiveNode(node);
    setRotationAngle(node.angle);
    dispatch(setActiveMood(node.id));

    try {
      localStorage.setItem('selectedMood', JSON.stringify({
        mood: node.mappedMood || node.id,
        sub_mood: node.id,
        confidence: 1.0,
        isManual: true,
      }));
    } catch (e) {}

    if (onSelectMood) {
      onSelectMood(node);
    }
  }, [dispatch, onSelectMood]);

  // Pointer drag calculations
  const calculateAngleFromEvent = useCallback((e) => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);

    if (clientX === undefined || clientY === undefined) return 0;

    const rad = Math.atan2(clientY - centerY, clientX - centerX);
    let deg = (rad * 180) / Math.PI + 90; // 0 deg at top
    if (deg < 0) deg += 360;
    return deg;
  }, []);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const deg = calculateAngleFromEvent(e);
    setRotationAngle(deg);

    const closest = findClosestNode(deg);
    if (closest.id !== activeNode.id) {
      setActiveNode(closest);
      dispatch(setActiveMood(closest.id));
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      const deg = calculateAngleFromEvent(e);
      setRotationAngle(deg);

      const closest = findClosestNode(deg);
      if (closest.id !== activeNode.id) {
        setActiveNode(closest);
        dispatch(setActiveMood(closest.id));
      }
    };

    const handlePointerUp = (e) => {
      setIsDragging(false);
      const deg = calculateAngleFromEvent(e);
      const snapped = findClosestNode(deg);
      selectNode(snapped);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, activeNode.id, calculateAngleFromEvent, selectNode, dispatch]);

  const handleCurateClick = () => {
    if (onCurateStream) {
      onCurateStream(activeNode);
    } else {
      navigate('/recommendations?tab=recommendations');
    }
  };

  // Generate 36 dial ticks (every 10 deg)
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);

  return (
    <div className={`flex flex-col items-center select-none w-full ${compact ? 'p-0 max-w-sm' : 'max-w-xl p-4 sm:p-6'} mx-auto`}>
      {/* Outer Glow Halo container */}
      <div className={`relative flex items-center justify-center ${compact ? 'py-0 my-0 scale-[0.56] sm:scale-[0.60] origin-center -my-8 sm:-my-8' : 'py-6'}`}>
        {/* Dynamic Bloom Aura matching active mood */}
        <div
          className={`absolute ${compact ? 'w-56 h-56' : 'w-72 h-72 sm:w-80 sm:h-80'} rounded-full blur-3xl opacity-30 transition-all duration-700 pointer-events-none`}
          style={{ backgroundColor: activeNode.color }}
        />

        {/* Rotary Dial Surface */}
        <div
          ref={dialRef}
          onPointerDown={handlePointerDown}
          className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full cursor-grab active:cursor-grabbing touch-none flex items-center justify-center p-3 transition-transform"
          style={{
            background: 'radial-gradient(circle at center, #0F172A 0%, #060B10 100%)',
            boxShadow: `
              0 0 0 1px rgba(255, 255, 255, 0.08),
              0 20px 40px -15px rgba(0, 0, 0, 0.9),
              inset 0 2px 4px rgba(255, 255, 255, 0.1),
              inset 0 -2px 6px rgba(0, 0, 0, 0.8)
            `,
          }}
        >
          {/* Tick Marks Ring */}
          <div className="absolute inset-2 rounded-full pointer-events-none">
            {ticks.map((deg) => {
              const isMajor = deg % 60 === 0;
              const isNearActive = Math.abs(deg - activeNode.angle) < 15;
              return (
                <div
                  key={deg}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 origin-top"
                  style={{
                    transform: `rotate(${deg}deg) translateY(-118px)`,
                  }}
                >
                  <div
                    className={`w-[2px] rounded-full transition-all duration-300 ${
                      isMajor
                        ? isNearActive
                          ? 'h-3.5 bg-cyan shadow-[0_0_8px_#00F2FE]'
                          : 'h-3 bg-slate-500'
                        : 'h-1.5 bg-slate-700/60'
                    }`}
                    style={
                      isMajor && isNearActive
                        ? { backgroundColor: activeNode.color, boxShadow: `0 0 8px ${activeNode.color}` }
                        : {}
                    }
                  />
                </div>
              );
            })}
          </div>

          {/* Emotional Node Pills Around the Perimeter */}
          {MOOD_NODES.map((node) => {
            const rad = ((node.angle - 90) * Math.PI) / 180;
            const distance = 104; // pixel offset from center
            const x = Math.round(distance * Math.cos(rad));
            const y = Math.round(distance * Math.sin(rad));
            const isSelected = activeNode.id === node.id;

            return (
              <button
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  selectNode(node);
                }}
                className={`absolute z-20 flex items-center justify-center transition-all duration-300 rounded-full group ${
                  isSelected
                    ? 'w-10 h-10 scale-110 shadow-lg'
                    : 'w-8 h-8 opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  backgroundColor: isSelected ? node.color : '#0A1118',
                  boxShadow: isSelected ? `0 0 16px ${node.color}` : 'none',
                  border: isSelected ? '2px solid white' : '1px solid rgba(255,255,255,0.15)',
                }}
                title={`Select ${node.name}`}
              >
                <span className={`text-sm ${isSelected ? 'brightness-125 scale-110' : ''}`}>
                  {node.emoji}
                </span>
              </button>
            );
          })}

          {/* Central Rotating Analog Knob */}
          <div
            className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center pointer-events-none transition-transform duration-200 ease-out"
            style={{
              transform: `rotate(${rotationAngle}deg)`,
              background: 'radial-gradient(circle at 35% 35%, #1E293B 0%, #0A1118 70%)',
              boxShadow: `
                0 10px 25px -5px rgba(0, 0, 0, 0.8),
                0 0 0 1px rgba(255, 255, 255, 0.08),
                inset 0 1px 2px rgba(255, 255, 255, 0.2)
              `,
            }}
          >
            {/* Fine Radial Texture Grooves */}
            <div className="absolute inset-2 rounded-full border border-slate-700/40 opacity-40" />
            <div className="absolute inset-5 rounded-full border border-slate-700/30 opacity-30" />

            {/* Glowing Pointer Indicator Needle / Pip */}
            <div className="absolute top-2 flex flex-col items-center">
              <div
                className="w-2.5 h-2.5 rounded-full shadow-lg animate-pulse"
                style={{
                  backgroundColor: activeNode.color,
                  boxShadow: `0 0 10px ${activeNode.color}, 0 0 20px ${activeNode.color}`,
                }}
              />
              <div
                className="w-0.5 h-3 mt-0.5 rounded-full"
                style={{ backgroundColor: activeNode.color }}
              />
            </div>
          </div>

          {/* Center Info HUD Hub (Fixed, Non-rotating) */}
          <div className="absolute z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-obsidian-950/90 backdrop-blur-md border border-obsidian-750 flex flex-col items-center justify-center p-2 text-center pointer-events-none shadow-inner">
            <span className="text-xl sm:text-2xl animate-bounce [animation-duration:2.5s]">
              {activeNode.emoji}
            </span>
            <span
              className="text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors duration-300"
              style={{ color: activeNode.color }}
            >
              {activeNode.name}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">
              {activeNode.angle}°
            </span>
          </div>
        </div>
      </div>

      {/* Empathetic Vibe Descriptor */}
      <div className={`text-center ${compact ? 'mt-2 mb-3' : 'mt-3 mb-5'} max-w-sm px-4`}>
        <p className="text-xs sm:text-sm text-slate-300 transition-all duration-300 leading-relaxed">
          {activeNode.tagline}
        </p>
      </div>

      {/* Accessible Quick-Preset Pills */}
      {showPills && (
        <div className={`w-full flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 ${compact ? 'mb-2' : 'mb-6'}`}>
          {MOOD_NODES.map((node) => {
            const isSelected = activeNode.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => selectNode(node)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? `${node.bgClass} ${node.textClass} border ${node.borderClass} ${node.glowClass} scale-105`
                    : 'bg-obsidian-900/90 text-slate-400 border border-obsidian-800 hover:text-white hover:border-obsidian-700'
                }`}
              >
                <span>{node.emoji}</span>
                <span>{node.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Curate Stream CTA Button */}
      {showCurateButton && (
        <button
          onClick={handleCurateClick}
          className="group relative flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm text-obsidian-950 shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${activeNode.color} 0%, #ffffff 100%)`,
            boxShadow: `0 8px 25px -5px ${activeNode.color}66`,
          }}
        >
          <svg className="w-4 h-4 fill-current text-obsidian-950" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>Curate {activeNode.name} Stream</span>
          <svg className="w-4 h-4 text-obsidian-950 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default RotaryMoodDial;
