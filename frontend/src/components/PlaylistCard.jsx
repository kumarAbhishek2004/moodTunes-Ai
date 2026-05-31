const PlaylistCard = ({ playlist, onView, onDelete }) => {
  const getMoodEmoji = (mood) => {
    const moodEmojis = {
      happy: '😊',
      sad: '😢',
      calm: '😌',
      angry: '😠',
      romantic: '❤️',
      energetic: '⚡'
    };
    return moodEmojis[mood?.toLowerCase()] || '🎵';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group">
      {/* Playlist Icon/Cover */}
      <div className="relative mb-4">
        <div className="w-full aspect-square bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-slate-700/50 group-hover:border-purple-500/50 transition-all">
          <span className="text-6xl">{getMoodEmoji(playlist.mood)}</span>
        </div>
        {playlist.mood && (
          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-300 border border-slate-700/50">
            {playlist.mood}
          </div>
        )}
      </div>

      {/* Playlist Info */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-purple-400 transition-colors">
          {playlist.name}
        </h3>
        {playlist.description && (
          <p className="text-gray-400 text-sm line-clamp-2 mb-2">
            {playlist.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
          </svg>
          <span>{playlist.songs?.length || 0} songs</span>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Created {formatDate(playlist.created_at)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onView}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 rounded-lg font-semibold transition-all text-sm"
        >
          Open
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="bg-slate-700/50 hover:bg-red-600/20 text-gray-400 hover:text-red-400 p-2 rounded-lg transition-all border border-slate-600/50 hover:border-red-500/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PlaylistCard;
