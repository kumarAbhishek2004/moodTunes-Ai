import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setShortcutsModalOpen } from '../store/audioSlice';

const ShortcutsModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.audio.isShortcutsModalOpen);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Playback Controls',
      items: [
        { keys: ['Space'], action: 'Play / Pause toggle' },
        { keys: ['→'], action: 'Seek forward 5 seconds' },
        { keys: ['←'], action: 'Seek backward 5 seconds' },
        { keys: ['Shift', '→'], action: 'Skip to next song' },
        { keys: ['Shift', '←'], action: 'Previous song' },
        { keys: ['M'], action: 'Mute / Unmute audio' },
      ],
    },
    {
      title: 'Studio & Navigation',
      items: [
        { keys: ['Q'], action: 'Toggle Queue Drawer' },
        { keys: ['T'], action: 'Toggle 12" Vinyl Turntable Studio' },
        { keys: ['S'], action: 'Open Sleep Timer menu' },
        { keys: ['V'], action: 'Generate Shareable Vibe Card' },
        { keys: ['L'], action: 'Like / Favorite current track' },
        { keys: ['?'], action: 'Show / Hide this shortcuts guide' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={() => dispatch(setShortcutsModalOpen(false))}
    >
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-obsidian-900 via-obsidian-950 to-slate-950 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shadow-inner">
              ⌨️
            </div>
            <div>
              <h3 className="font-bold text-lg text-white tracking-wide">Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-400">Navigate & control MoodTunes AI with pro speed</p>
            </div>
          </div>
          <button
            onClick={() => dispatch(setShortcutsModalOpen(false))}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Shortcut Groups */}
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <h4 className="text-xs uppercase tracking-wider font-mono font-bold text-amber-400/90 mb-2.5">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                  >
                    <span className="text-sm text-slate-200 font-medium">{item.action}</span>
                    <div className="flex items-center gap-1.5">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2.5 py-1 text-xs font-mono font-bold text-slate-100 bg-obsidian-950/90 border border-white/20 rounded-lg shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Hint */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Shortcuts are disabled while typing in search boxes.</span>
          <button
            onClick={() => dispatch(setShortcutsModalOpen(false))}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
