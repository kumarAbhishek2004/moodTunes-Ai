import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MoodTunes App ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    try {
      localStorage.removeItem('selectedMood');
      localStorage.removeItem('recommendations');
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060B10] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 shadow-2xl">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
            Playback Stream Notice
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            The platform encountered a temporary render interruption. Click below to refresh your session.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan to-blue-600 text-obsidian-950 font-bold text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              🔄 Refresh & Reload
            </button>
          </div>
          {this.state.error && (
            <div className="mt-8 p-4 rounded-xl bg-obsidian-950/80 border border-white/10 text-left max-w-lg w-full text-[11px] font-mono text-rose-300/80 overflow-x-auto">
              <span className="font-bold block text-slate-400 mb-1">Details:</span>
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
