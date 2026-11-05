import { useState } from 'react';

const WEEKLY_STATS = [
  { mood: 'Calm', percentage: 38, hours: 6.4, color: '#00F2FE', emoji: '🌊' },
  { mood: 'Focus', percentage: 26, hours: 4.5, color: '#10B981', emoji: '🧠' },
  { mood: 'Energetic', percentage: 18, hours: 3.1, color: '#F97316', emoji: '⚡' },
  { mood: 'Happy', percentage: 12, hours: 2.0, color: '#F59E0B', emoji: '✨' },
  { mood: 'Reflective', percentage: 6, hours: 1.0, color: '#3B82F6', emoji: '🌧️' },
];

const MoodInsightsDonut = () => {
  const [activeMoodItem, setActiveMoodItem] = useState(WEEKLY_STATS[0]);

  // Compute SVG circular dash offsets
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="bg-obsidian-900/80 backdrop-blur-2xl border border-obsidian-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/80 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-obsidian-800/60 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Weekly Mood Insights
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Emotional listening habits • Past 7 Days
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-obsidian-800 text-slate-300 border border-obsidian-750">
          17.0 hrs total
        </span>
      </div>

      {/* Donut Chart & Center HUD */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
        <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#0A1118"
              strokeWidth="16"
            />

            {/* Segment Arcs */}
            {WEEKLY_STATS.map((item) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.percentage;
              const isSelected = activeMoodItem.mood === item.mood;

              return (
                <circle
                  key={item.mood}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isSelected ? '20' : '16'}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 cursor-pointer hover:opacity-100 opacity-90"
                  onMouseEnter={() => setActiveMoodItem(item)}
                  style={{
                    filter: isSelected ? `drop-shadow(0 0 6px ${item.color})` : 'none',
                  }}
                />
              );
            })}
          </svg>

          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl animate-bounce [animation-duration:3s]">
              {activeMoodItem.emoji}
            </span>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: activeMoodItem.color }}
            >
              {activeMoodItem.mood}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {activeMoodItem.percentage}% ({activeMoodItem.hours}h)
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="flex-1 w-full space-y-2">
          {WEEKLY_STATS.map((item) => {
            const isSelected = activeMoodItem.mood === item.mood;
            return (
              <div
                key={item.mood}
                onMouseEnter={() => setActiveMoodItem(item)}
                className={`flex items-center justify-between p-1.5 px-2.5 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-obsidian-800/80 border border-obsidian-700'
                    : 'hover:bg-obsidian-850/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-medium text-slate-200">
                    {item.emoji} {item.mood}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    {item.percentage}%
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {item.hours}h
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Trend Insight Callout */}
      <div className="mt-4 p-3 rounded-2xl bg-cyan/5 border border-cyan/20 flex items-start gap-2.5">
        <span className="text-sm mt-0.5">💡</span>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          <strong className="text-cyan font-semibold">AI Weekly Digest:</strong> Your listening shifted{' '}
          <strong className="text-emerald font-semibold">18% calmer</strong> than last week, leading to longer focus intervals and reduced auditory fatigue.
        </p>
      </div>
    </div>
  );
};

export default MoodInsightsDonut;
