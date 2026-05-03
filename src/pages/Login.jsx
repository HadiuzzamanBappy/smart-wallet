import React, { useState } from 'react';
import { registerUser, loginUser, loginWithGoogle } from '../services/authService';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Zap } from 'lucide-react';

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
      setError('Identity authentication failure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper-50 dark:bg-ink-950 relative overflow-hidden p-6 transition-colors duration-500">
      {/* Subtle Atmospheric Glow - Studio Executive Style */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-96 bg-primary-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-96 bg-secondary-500/5 blur-[120px] pointer-events-none" />

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="fixed top-8 left-8 z-50 p-2 text-ink-400 hover:text-ink-900 dark:text-paper-700 dark:hover:text-paper-50 bg-white/5 backdrop-blur-xl border border-paper-100/50 dark:border-white/5 rounded-xl transition-all hover:scale-110"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <div className="w-full max-w-[340px] relative z-10">
        {/* Minimal Branding */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <IconBox icon={Zap} variant="glass" color="primary" size="sm" />
          <h1 className="text-h3 font-black text-ink-900 dark:text-paper-50 tracking-tighter">Wallet Tracker</h1>
        </div>

        <GlassCard
          className="border-paper-100/50 dark:border-white/5 shadow-2xl"
          padding="p-8"
          rounded="rounded-[2.5rem]"
        >
          <div className="text-center mb-8">
            <h2 className="text-h5 font-black text-ink-900 dark:text-paper-50 tracking-tight mb-1">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-overline text-ink-400 dark:text-paper-700 font-black tracking-widest uppercase opacity-60">
              {isLogin ? 'Authentication Required' : 'Initialize Identity'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-error-500/5 border border-error-500/20 text-error-600 text-[10px] font-bold uppercase tracking-wider rounded-xl animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300 dark:text-paper-800 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  name="displayName"
                  placeholder="Operator Name"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-paper-100/50 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 text-ink-900 dark:text-paper-50 text-body font-bold placeholder:font-medium placeholder:text-ink-300 dark:placeholder:text-paper-900 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition-all"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300 dark:text-paper-800 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="email"
                name="email"
                placeholder="Access Point"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-paper-100/50 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 text-ink-900 dark:text-paper-50 text-body font-bold placeholder:font-medium placeholder:text-ink-300 dark:placeholder:text-paper-900 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition-all"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300 dark:text-paper-800 group-focus-within:text-primary-500 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Security Key"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-paper-100/50 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 text-ink-900 dark:text-paper-50 text-body font-bold placeholder:font-medium placeholder:text-ink-300 dark:placeholder:text-paper-900 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-900 dark:text-paper-800 dark:hover:text-paper-50 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              color="primary"
              className="!mt-6 !py-4 rounded-2xl text-overline font-black tracking-widest shadow-lg shadow-primary-500/10"
            >
              {isLogin ? 'Authenticate' : 'Initialize'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-paper-100 dark:border-white/5 flex flex-col gap-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl bg-paper-100/50 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 hover:bg-paper-200 dark:hover:bg-white/10 transition-all group"
            >
              <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-label font-bold text-ink-700 dark:text-paper-600">Identity Portal</span>
            </button>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] text-ink-400 dark:text-paper-700 hover:text-primary-500 font-black uppercase tracking-widest transition-all"
            >
              {isLogin ? "Request Access" : "Return to Login"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Login;