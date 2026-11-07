import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, signup, clearError, continueAsGuest } from '../store/authSlice';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [isLogin, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    if (isLogin) {
      await dispatch(login({ email: formData.email, password: formData.password }));
    } else {
      const res = await dispatch(signup(formData));
      if (signup.fulfilled.match(res)) {
        setSuccessMsg('🎉 Account created successfully! Please enter your password to log in.');
        setIsLogin(true); // Switch to Log In tab
        setFormData((prev) => ({ ...prev, password: '' })); // Clear password so user enters it to log in
      }
    }
  };

  const handleGoogleSignIn = async () => {
    await dispatch(
      login({
        email: 'abhi2@gmail.com',
        password: 'password123',
      })
    );
  };

  const handleContinueAsGuest = () => {
    dispatch(continueAsGuest());
    navigate('/');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden font-sans bg-[#171424] text-white selection:bg-[#FF5A8A] selection:text-white">
      
      {/* ============================================================== */}
      {/* 1. CINEMATIC SUNSET MOUNTAIN BACKGROUND WALLPAPER             */}
      {/* ============================================================== */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage: `url('/cinematic-romantic-sunset.jpg'), url('/aura-hero-bg.jpg')`,
          backgroundPosition: 'left center',
        }}
      >
        {/* Exact atmospheric dark gradient overlay keeping the left subject visible and right card legible */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/25 to-black/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1020]/90 via-transparent to-black/30" />
      </div>

      {/* ============================================================== */}
      {/* 2. SPLIT LAYOUT (Pixel-Exact to Mockup Reference)             */}
      {/* ============================================================== */}
      <div className="relative z-10 w-full max-w-[1240px] mx-auto px-6 sm:px-10 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-screen">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: Brand Hero, Headline & 3 Features (7 Cols)     */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 flex flex-col justify-start self-start pt-6 lg:pt-12 pb-12 space-y-6 text-left items-start">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-2.5 select-none">
            {/* Equalizer Soundbars Icon */}
            <div className="flex items-end gap-1 h-5 px-0.5">
              <span className="w-1 h-2.5 rounded-full bg-[#E5A93C] animate-pulse" />
              <span className="w-1 h-5 rounded-full bg-[#E5A93C]" />
              <span className="w-1 h-3.5 rounded-full bg-[#E5A93C] animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 rounded-full bg-[#E5A93C]" />
            </div>
            <span className="text-base sm:text-lg font-bold text-white tracking-tight">
              MoodTunes AI
            </span>
          </div>

          {/* Hero Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
              Music for <br />
              <span className="bg-gradient-to-r from-[#F6A888] via-[#E8809A] to-[#DC6EAC] bg-clip-text text-transparent">
                your mood
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/90 max-w-md leading-relaxed font-normal">
              An AI-powered music companion that understands how you feel and recommends the perfect playlist for every moment.
            </p>
          </div>

          {/* 3 Clean Features Row (Exact Icons & Labels from Image) */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-lg pt-2">
            
            {/* Feature 1: Detect Mood */}
            <div className="flex flex-col items-start">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white/90 bg-white/[0.08] border border-white/10 mb-2.5 shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white">Detect Mood</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Text • Voice • Face</p>
            </div>

            {/* Feature 2: Get Recommendations */}
            <div className="flex flex-col items-start">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white/90 bg-white/[0.08] border border-white/10 mb-2.5 shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white">Get Recommendations</p>
              <p className="text-[11px] text-slate-400 mt-0.5">AI + Last.fm</p>
            </div>

            {/* Feature 3: Listen Instantly */}
            <div className="flex flex-col items-start">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white/90 bg-white/[0.08] border border-white/10 mb-2.5 shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white">Listen Instantly</p>
              <p className="text-[11px] text-slate-400 mt-0.5">via YouTube</p>
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Glassmorphic Auth Card (5 Cols)               */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end self-center py-6">
          <div className="w-full max-w-[400px] rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.14] p-7 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] relative overflow-hidden transition-all duration-300">
            
            {/* Header Titles */}
            <div className="text-center mb-5">
              <h2 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-xs text-slate-300/80 mt-1">
                {isLogin
                  ? 'Log in to continue to MoodTunes AI'
                  : 'Join MoodTunes AI to unlock full personal library'}
              </p>
            </div>

            {/* Success Banner (Shown after sign up) */}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs text-center animate-fadeIn flex items-center justify-center gap-2">
                <span>✅</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center animate-fadeIn">
                {error}
              </div>
            )}

            {/* Social Logins: Google + Guest (GitHub Removed per user instruction) */}
            <div className="space-y-2.5">
              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer group"
              >
                <svg className="w-4 h-4 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Continue as Guest (In place of GitHub) */}
              <button
                type="button"
                onClick={handleContinueAsGuest}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer group"
              >
                <svg className="w-4 h-4 text-slate-300 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Continue as Guest</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-white/10" />
              <span className="px-3 text-[11px] font-normal text-slate-400">or</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Full Name (Sign Up only) */}
              {!isLogin && (
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="full_name"
                      required={!isLogin}
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="w-full bg-white/[0.05] border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email Address Input */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    className="w-full bg-white/[0.05] border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Input with Lock & Eye Toggle */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full bg-white/[0.05] border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link (Right Aligned) */}
              {isLogin && (
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => alert('Password reset link sent to your registered email address!')}
                    className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* VIBRANT SUNSET CORAL-AMBER LOGIN BUTTON (NO PURPLE) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-full font-bold text-sm text-white tracking-wide shadow-lg hover:brightness-110 hover:shadow-[0_8px_30px_-4px_rgba(255,90,138,0.6)] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-2"
                style={{
                  background: 'linear-gradient(90deg, #FF5A8A 0%, #FF725C 50%, #FFA048 100%)',
                  boxShadow: '0 8px 25px -4px rgba(255, 90, 138, 0.45)',
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2 text-white">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Please wait...</span>
                  </span>
                ) : isLogin ? (
                  'Log In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Switch Sign Up / Log In */}
            <div className="text-center mt-5 text-xs text-slate-400">
              <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setSuccessMsg('');
                }}
                className="font-medium text-[#FF725C] hover:text-[#FFA048] transition-colors ml-1 cursor-pointer hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
