import { useState } from 'react';

const MOOD_OPTIONS = [
  {
    key: 'calm',
    name: 'Calm',
    emoji: '🍃',
    accent: '#00F2FE',
    accentRgb: '0, 242, 254',
    desc: 'Peaceful, chill, and acoustic serenity',
    presets: [
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    key: 'happy',
    name: 'Happy',
    emoji: '😊',
    accent: '#F59E0B',
    accentRgb: '245, 158, 11',
    desc: 'Joyful, uplifting, and cheerful hits',
    presets: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    key: 'energetic',
    name: 'Energetic',
    emoji: '⚡',
    accent: '#F97316',
    accentRgb: '249, 115, 22',
    desc: 'High-tempo pump, gym, and party rhythm',
    presets: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    key: 'sad',
    name: 'Sad / Blues',
    emoji: '🌙',
    accent: '#3B82F6',
    accentRgb: '59, 130, 246',
    desc: 'Reflective midnight melodies and deep solitude',
    presets: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    key: 'focus',
    name: 'Focus',
    emoji: '🎯',
    accent: '#10B981',
    accentRgb: '16, 185, 129',
    desc: 'Binaural lo-fi, study flow, and deep work',
    presets: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    key: 'romantic',
    name: 'Romantic',
    emoji: '💖',
    accent: '#EC4899',
    accentRgb: '236, 72, 153',
    desc: 'Intimate acoustic serenades and heartfelt poetry',
    presets: [
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    ],
  },
];

const CreatePlaylistModal = ({ isOpen, onClose, onCreate, initialSongs = [] }) => {
  const [selectedMood, setSelectedMood] = useState('calm');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCover, setSelectedCover] = useState(MOOD_OPTIONS[0].presets[0]);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentMoodConfig = MOOD_OPTIONS.find((m) => m.key === selectedMood) || MOOD_OPTIONS[0];
  const activeCover = customCoverUrl.trim() || selectedCover;

  const handleMoodSelect = (moodKey) => {
    setSelectedMood(moodKey);
    const m = MOOD_OPTIONS.find((opt) => opt.key === moodKey);
    if (m && m.presets?.length > 0 && !customCoverUrl.trim()) {
      setSelectedCover(m.presets[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a playlist title');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        mood: selectedMood,
        cover: activeCover,
        is_public: isPublic,
        songs: initialSongs, // Starts empty as user adds songs themselves
      });
      // Reset form
      setName('');
      setDescription('');
      setCustomCoverUrl('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-xl my-6 rounded-3xl bg-slate-950/95 border shadow-2xl overflow-hidden p-6 sm:p-8 transition-all duration-300"
        style={{
          borderColor: `rgba(${currentMoodConfig.accentRgb}, 0.35)`,
          boxShadow: `0 25px 70px -10px rgba(0,0,0,0.8), 0 0 40px rgba(${currentMoodConfig.accentRgb}, 0.18)`,
        }}
      >
        {/* Subtle Ambient Radial Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full pointer-events-none opacity-20 blur-3xl transition-colors duration-500"
          style={{ backgroundColor: currentMoodConfig.accent }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg"
              style={{
                backgroundColor: `rgba(${currentMoodConfig.accentRgb}, 0.15)`,
                border: `1px solid rgba(${currentMoodConfig.accentRgb}, 0.35)`,
              }}
            >
              {currentMoodConfig.emoji}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Create New Playlist
              </h2>
              <p className="text-xs text-slate-400">
                Design your collection • You will add your own favorite songs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all text-xs cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 1. SELECT MOOD ATMOSPHERE TILES */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Select Playlist Mood Vibe
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {MOOD_OPTIONS.map((m) => {
                const isSelected = selectedMood === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => handleMoodSelect(m.key)}
                    className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'scale-105 shadow-md font-bold'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `rgba(${m.accentRgb}, 0.18)`,
                            borderColor: m.accent,
                            color: '#ffffff',
                            boxShadow: `0 0 18px rgba(${m.accentRgb}, 0.3)`,
                          }
                        : undefined
                    }
                  >
                    <span className="text-xl mb-1">{m.emoji}</span>
                    <span className="text-[11px] truncate">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. CHOOSE COVER ARTWORK PRESET OR CUSTOM */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Playlist Artwork
            </label>
            <div className="flex items-center gap-3">
              {/* Presets */}
              <div className="flex items-center gap-2">
                {currentMoodConfig.presets.map((presetUrl, idx) => {
                  const isSelected = selectedCover === presetUrl && !customCoverUrl.trim();
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedCover(presetUrl);
                        setCustomCoverUrl('');
                      }}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        isSelected ? 'scale-105 shadow-md' : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        borderColor: isSelected ? currentMoodConfig.accent : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <img src={presetUrl} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>

              {/* Custom URL Input */}
              <div className="flex-1">
                <input
                  type="url"
                  placeholder="Or paste image URL..."
                  value={customCoverUrl}
                  onChange={(e) => setCustomCoverUrl(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 focus:border-white/25 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. PLAYLIST NAME & DESCRIPTION */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Playlist Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. My Late Night Vibes, Gym Motivation..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              style={{
                borderColor: name ? currentMoodConfig.accent : undefined,
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Description <span className="text-slate-500 text-[10px] normal-case">(Optional)</span>
            </label>
            <textarea
              rows="2"
              placeholder="What makes this playlist special?.."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 focus:border-white/25 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none resize-none"
            />
          </div>

          {/* 4. LIVE MINIATURE PREVIEW CARD */}
          <div className="p-3 rounded-2xl bg-slate-900/50 border border-white/10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-800">
              <img src={activeCover} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{currentMoodConfig.emoji}</span>
                <p className="text-xs font-bold text-white truncate">
                  {name.trim() || 'Untitled Playlist'}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                0 songs • User Curated
              </p>
            </div>
            <span
              className="text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0"
              style={{
                color: currentMoodConfig.accent,
                borderColor: `rgba(${currentMoodConfig.accentRgb}, 0.35)`,
                backgroundColor: `rgba(${currentMoodConfig.accentRgb}, 0.1)`,
              }}
            >
              {currentMoodConfig.name}
            </span>
          </div>

          {/* 5. ACTION BUTTONS */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl font-semibold text-xs sm:text-sm bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-lg hover:scale-[1.02] active:scale-98 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              style={{
                backgroundColor: currentMoodConfig.accent,
                color: '#060B10',
                boxShadow: `0 8px 25px -4px rgba(${currentMoodConfig.accentRgb}, 0.45)`,
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlaylistModal;
