import React, { useState } from 'react';
import { registerUser, loginUser, loginWithGoogle } from '../services/authService';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Zap, DollarSign, Euro, CircleDollarSign } from 'lucide-react';

// Base UI Components
import Button from '../components/UI/base/Button';
import IconBox from '../components/UI/base/IconBox';
import GlassCard from '../components/UI/base/GlassCard';

const Login = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await loginUser(formData.email, formData.password);
      } else {
        result = await registerUser(formData.email, formData.password, formData.displayName);
      }

      if (!result.success) {
        setError(result.error);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setError(result.error);
      }
    } catch {
      setError('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050b1a] relative overflow-hidden p-4 font-sans">
      {/* Animated Floating Assets Infrastructure */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatMoney {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.08; }
          90% { opacity: 0.08; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        .floating-asset {
          position: absolute;
          bottom: -100px;
          color: white;
          pointer-events: none;
          z-index: 1;
        }
      `}} />

      {/* Floating Money Background Icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => {
          const Icon = i % 3 === 0 ? DollarSign : i % 3 === 1 ? Euro : CircleDollarSign;
          const left = Math.random() * 100;
          const duration = 20 + Math.random() * 20;
          const delay = Math.random() * 15;
          const size = 18 + Math.random() * 22;
          
          return (
            <div 
              key={i}
              className="floating-asset"
              style={{ 
                left: `${left}%`, 
                animation: `floatMoney ${duration}s infinite linear`,
                animationDelay: `${delay}s`,
              }}
            >
              <Icon size={size} strokeWidth={1} />
            </div>
          );
        })}
      </div>

      {/* Subtle Atmospheric Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="w-full max-w-[360px] relative z-10 space-y-5">
        {/* Compact Branding */}
        <div className="flex flex-col items-center text-center">
          <IconBox icon={Zap} variant="glass" colorClass="text-teal-400" size="sm" className="mb-2" />
          <h1 className="text-lg font-black text-white uppercase tracking-[0.3em] leading-none">Wallet Tracker</h1>
          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1">Command Center</p>
        </div>

        <GlassCard 
          className="overflow-hidden border-white/5 shadow-2xl"
          padding="p-5 sm:p-7"
        >
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="absolute top-3 left-3 p-1.5 text-gray-600 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="mb-6 text-center">
            <h2 className="text-lg font-black text-white leading-none mb-1">
              {isLogin ? 'Sign In' : 'Register'}
            </h2>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
              {isLogin ? 'Secure Suite Access' : 'Initialize Registry'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2.5">
              <div className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="space-y-1">
                <label className="block text-[8px] font-black text-gray-600 uppercase tracking-widest px-1">
                  Name
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-600 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="text"
                    name="displayName"
                    placeholder="Full name"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.01] border border-white/5 text-white text-[12px] font-bold placeholder-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500/20 focus:border-teal-500/30 transition-all"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[8px] font-black text-gray-600 uppercase tracking-widest px-1">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-600 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.01] border border-white/5 text-white text-[12px] font-bold placeholder-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500/20 focus:border-teal-500/30 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[8px] font-black text-gray-600 uppercase tracking-widest px-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-600 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-white/[0.01] border border-white/5 text-white text-[12px] font-bold placeholder-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500/20 focus:border-teal-500/30 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="sm"
              color="teal"
              className="mt-4 !py-2.5 shadow-xl shadow-teal-500/5"
            >
              {isLogin ? 'Sign In' : 'Initialize'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              fullWidth
              variant="soft"
              color="gray"
              size="sm"
              className="group !py-2.5 !bg-white/[0.02]"
            >
              <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-widest">Google Auth</span>
            </Button>

            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[8px] font-black text-gray-600 hover:text-teal-400 uppercase tracking-[0.2em] transition-all"
              >
                {isLogin ? "Join the Suite" : "Go to Login"}
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Footer info */}
        <div className="text-center opacity-30">
          <p className="text-[7px] font-black text-white uppercase tracking-[0.4em]">
            &copy; 2026 Wallet Tracker
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;