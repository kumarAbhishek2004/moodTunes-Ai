import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { setQueue, playSong } from '../store/audioSlice';
import { cleanSongTitle } from '../utils/textHelper';

/**
 * Available moods for categorizing imported playlists
 */
const MOOD_OPTIONS = [
  { id: 'calm', label: 'Calm', emoji: '😌', color: '#10B981', border: 'border-emerald-500/50', bg: 'bg-emerald-500/20', activeGlow: 'shadow-emerald-500/30' },
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#F59E0B', border: 'border-amber-500/50', bg: 'bg-amber-500/20', activeGlow: 'shadow-amber-500/30' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡', color: '#EF4444', border: 'border-red-500/50', bg: 'bg-red-500/20', activeGlow: 'shadow-red-500/30' },
  { id: 'sad', label: 'Sad', emoji: '🌙', color: '#6366F1', border: 'border-indigo-500/50', bg: 'bg-indigo-500/20', activeGlow: 'shadow-indigo-500/30' },
  { id: 'focus', label: 'Focus', emoji: '🎯', color: '#06B6D4', border: 'border-cyan-500/50', bg: 'bg-cyan-500/20', activeGlow: 'shadow-cyan-500/30' },
  { id: 'romantic', label: 'Romantic', emoji: '❤️', color: '#EC4899', border: 'border-pink-500/50', bg: 'bg-pink-500/20', activeGlow: 'shadow-pink-500/30' },
];

/**
 * ImportPlaylistModal
 * 1-Click Spotify & YouTube Playlist Importer
 * Converts public playlist links into native MoodTunes playlists.
 * Allows importing multiple playlists with user-selectable mood classification.
 */
const ImportPlaylistModal = ({ isOpen, onClose, initialMood = 'calm', onImportSuccess }) => {
  const dispatch = useDispatch();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedMood, setSelectedMood] = useState(initialMood || 'calm');
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [importedData, setImportedData] = useState(null);

  useEffect(() => {
    if (isOpen && initialMood) {
      setSelectedMood(initialMood.toLowerCase());
      setErrorMsg('');
    }
  }, [isOpen, initialMood]);

  if (!isOpen) return null;

  const handleResetForAnother = () => {
    setPlaylistUrl('');
    setCustomName('');
    setImportedData(null);
    setErrorMsg('');
    setStatusStep('');
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!playlistUrl.trim()) {
      setErrorMsg('Please enter a Spotify or YouTube playlist URL.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setImportedData(null);
    setStatusStep('Connecting to playlist source...');

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const stepTimer1 = setTimeout(() => setStatusStep('Extracting authentic tracks & artists...'), 1200);
      const stepTimer2 = setTimeout(() => setStatusStep('Resolving high-quality audio streams...'), 3000);

      const res = await axios.post(
        `${API_BASE_URL}/api/playlists/import`,
        {
          url: playlistUrl.trim(),
          playlist_name: customName.trim() || undefined,
          mood: selectedMood,
        },
        { headers, timeout: 45000 }
      );

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const pl = res.data.playlist;
      if (pl) {
        pl.mood = selectedMood;
      }
      setImportedData(pl);
      if (onImportSuccess) onImportSuccess(pl);
    } catch (err) {
      console.error('Playlist import failed:', err);
      const detail = err.response?.data?.detail || 'Failed to import playlist. Please ensure the link is public and accessible.';
      setErrorMsg(detail);
    } finally {
      setIsLoading(false);
      setStatusStep('');
    }
  };

  const handlePlayNow = () => {
    if (importedData && importedData.songs && importedData.songs.length > 0) {
      dispatch(setQueue(importedData.songs));
      dispatch(playSong(importedData.songs[0]));
      onClose();
    }
  };

  const formatDuration = (sec) => {
    if (!sec || isNaN(sec)) return '3:30';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentMoodConfig = MOOD_OPTIONS.find((m) => m.id === selectedMood) || MOOD_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn font-sans">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-950/95 border border-cyan/30 shadow-2xl p-5 sm:p-6 text-white backdrop-blur-2xl">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan/20 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/20">
              📥
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Import Playlist</h3>
              <p className="text-[11px] text-slate-400">Import genuine tracks from Spotify or YouTube into your library</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {!importedData ? (
          /* Import URL & Mood Selection Form */
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Spotify or YouTube Playlist Link
              </label>
              <input
                type="url"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/... or youtube.com/playlist?list=..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan transition"
                required
                disabled={isLoading}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Supports public Spotify playlists & albums, or YouTube playlist links.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Custom Playlist Name <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Leave blank to use original playlist title"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan transition"
                disabled={isLoading}
              />
            </div>

            {/* Mood Selector Pills */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Select Playlist Mood
                </label>
                <span className="text-[10px] font-mono uppercase tracking-wide text-cyan-400">
                  Category: {currentMoodConfig.emoji} {currentMoodConfig.label}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {MOOD_OPTIONS.map((m) => {
                  const isSelected = selectedMood === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMood(m.id)}
                      disabled={isLoading}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer border ${
                        isSelected
                          ? `${m.bg} ${m.border} text-white shadow-lg ${m.activeGlow} scale-105 ring-1 ring-white/30`
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="text-base">{m.emoji}</span>
                      <span className="text-[11px] leading-tight">{m.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                This playlist will be saved under the <span className="text-cyan-300 font-semibold capitalize">{selectedMood}</span> mood tab in your library.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{statusStep || 'Extracting authentic tracks...'}</span>
                  </div>
                ) : (
                  <>
                    <span>📥 Import & Save to Library</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Successful Import View */
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
              <span className="text-3xl block mb-2">🎉</span>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  Imported from {importedData.source || 'External'}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 font-bold capitalize">
                  {currentMoodConfig.emoji} {importedData.mood || selectedMood}
                </span>
              </div>
              <h4 className="text-base font-extrabold text-white">{importedData.name}</h4>
              <p className="text-xs text-emerald-300 mt-1 font-medium">
                Successfully saved {importedData.songs?.length || 0} genuine tracks to your {importedData.mood || selectedMood} collection!
              </p>
            </div>

            {/* Imported Track Preview List */}
            {importedData.songs && importedData.songs.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-900/60 border border-white/5 divide-y divide-white/5 p-2 pr-1 custom-scrollbar">
                {importedData.songs.slice(0, 10).map((trk, i) => (
                  <div key={trk.id || i} className="flex items-center justify-between py-1.5 px-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="font-mono text-[10px] text-slate-500 w-4">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200 truncate">{cleanSongTitle(trk.name)}</p>
                        <p className="text-[10px] text-slate-400 truncate">{trk.artist}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {formatDuration(trk.duration)}
                    </span>
                  </div>
                ))}
                {importedData.songs.length > 10 && (
                  <div className="text-center py-1 text-[10px] text-slate-500 font-mono">
                    + {importedData.songs.length - 10} more tracks in playlist
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                View in Library
              </button>
              <button
                onClick={handlePlayNow}
                className="flex-1 py-2.5 rounded-xl bg-cyan hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan/30 hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>▶</span>
                <span>Play Now</span>
              </button>
            </div>

            {/* Import Another Playlist Button */}
            <div className="text-center pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={handleResetForAnother}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 transition cursor-pointer"
              >
                + Import Another Playlist
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPlaylistModal;
