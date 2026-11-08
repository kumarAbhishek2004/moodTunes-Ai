import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { setQueue, playSong } from '../store/audioSlice';
import { cleanSongTitle } from '../utils/textHelper';

/**
 * ImportPlaylistModal
 * 1-Click Spotify & YouTube Playlist Importer
 * Converts public playlist links into native MoodTunes playlists.
 * Enforces single active imported playlist constraint & shows real track previews.
 */
const ImportPlaylistModal = ({ isOpen, onClose, hasImportedPlaylist = false, onImportSuccess }) => {
  const dispatch = useDispatch();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [importedData, setImportedData] = useState(null);

  if (!isOpen) return null;

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
        },
        { headers, timeout: 45000 }
      );

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const pl = res.data.playlist;
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
              <h3 className="text-base font-bold text-white tracking-wide">1-Click Playlist Importer</h3>
              <p className="text-[11px] text-slate-400">Import real tracks from Spotify or YouTube</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 1. If user ALREADY has an imported playlist and hasn't just imported one in this session */}
        {hasImportedPlaylist && !importedData ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-300 mb-1">
                <span>⚠️</span>
                <span>Playlist Import Limit Reached</span>
              </div>
              <p>
                You already have an active imported playlist in your MoodTunes library. To import a new playlist, please remove your existing imported playlist first.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition cursor-pointer"
            >
              Return to Library
            </button>
          </div>
        ) : !importedData ? (
          /* 2. Import URL Input Form */
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan"
                required
                disabled={isLoading}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Supports public Spotify playlists & albums, or YouTube playlist URLs.
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan"
                disabled={isLoading}
              />
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
                    <span>📥 Import to MoodTunes</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* 3. Successful Import View - No duplicate import form */
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
              <span className="text-3xl block mb-2">🎉</span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                Imported from {importedData.source || 'External'}
              </span>
              <h4 className="text-base font-extrabold text-white mt-2">{importedData.name}</h4>
              <p className="text-xs text-emerald-300 mt-1 font-medium">
                Successfully imported {importedData.songs?.length || 0} genuine tracks into your library!
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPlaylistModal;
