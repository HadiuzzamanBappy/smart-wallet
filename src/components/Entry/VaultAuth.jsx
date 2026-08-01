import React, { useState } from 'react';
import { registerUser, loginUser, loginWithGoogle } from '../../services/authService';
import { Eye, EyeOff, Mail, Lock, User, Key, DoorClosed } from 'lucide-react';
import Button from '../UI/base/Button';
import GlassInput from '../UI/base/GlassInput';

const VaultAuth = ({ onBack }) => {
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
    <div className="w-[80%] max-w-[280px] mx-auto flex flex-col justify-center items-center gap-6 relative z-50 animate-in fade-in zoom-in duration-1000">

      {/* Header */}
      <div className="text-center relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-stone-950 border border-amber-900/50 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8),0_2px_10px_rgba(251,191,36,0.1)] mb-2">
          <Key className="w-4 h-4 text-amber-500/80" />
        </div>
        <h2 className="text-[11px] font-bold text-amber-500/90 tracking-widest uppercase">
          {isLogin ? 'Access Vault' : 'Forge Key'}
        </h2>
      </div>

      {error && (
        <div className="w-full p-2 bg-red-950/30 border border-red-900/30 text-red-400 text-[9px] font-bold uppercase tracking-widest rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-2.5 relative z-10 flex flex-col items-center">
        {!isLogin && (
          <div className="relative w-full">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 z-10" />
            <input
              name="displayName"
              placeholder="Operator Name"
              value={formData.displayName}
              onChange={handleInputChange}
              required={!isLogin}
              className="w-full bg-stone-950/40 border border-stone-800/60 focus:border-amber-700/50 text-stone-300 placeholder:text-stone-600/70 py-2.5 pl-10 pr-3 text-[10px] rounded-lg outline-none transition-all focus:ring-1 focus:ring-amber-700/30 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgb(28,25,23)] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(214,211,209)]"
            />
          </div>
        )}

        <div className="relative w-full">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 z-10" />
          <input
            type="email"
            name="email"
            placeholder="Identity Record"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full bg-stone-950/40 border border-stone-800/60 focus:border-amber-700/50 text-stone-300 placeholder:text-stone-600/70 py-2.5 pl-10 pr-3 text-[10px] rounded-lg outline-none transition-all focus:ring-1 focus:ring-amber-700/30 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgb(28,25,23)] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(214,211,209)]"
          />
        </div>

        <div className="relative w-full">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 z-10" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Security Cipher"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="w-full bg-stone-950/40 border border-stone-800/60 focus:border-amber-700/50 text-stone-300 placeholder:text-stone-600/70 py-2.5 pl-10 pr-10 text-[10px] rounded-lg outline-none transition-all focus:ring-1 focus:ring-amber-700/30 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgb(28,25,23)] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(214,211,209)]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-amber-500 transition-colors p-0.5 z-10"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 rounded-lg bg-gradient-to-r from-amber-800/80 via-amber-700/80 to-amber-900/80 border border-amber-900/50 shadow-[0_4px_10px_rgba(0,0,0,0.5)] text-amber-100/90 text-[10px] font-bold tracking-widest uppercase hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'Processing' : isLogin ? 'Unlock' : 'Initialize'}
        </button>
      </form>

      {/* Footer / Alternate Auth */}
      <div className="w-full flex flex-col items-center gap-3 relative z-10 pt-1 border-t border-stone-800/30">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-stone-950/30 border border-stone-800/50 hover:bg-stone-900/50 transition-colors disabled:opacity-50"
        >
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Google Auth</span>
        </button>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-[9px] text-stone-600 hover:text-amber-500/80 font-bold uppercase tracking-widest transition-colors my-1"
        >
          {isLogin ? "Forge Key" : "Use Key"}
        </button>

        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            title="Close Vault"
            className="p-1.5 rounded-full bg-stone-900/40 border border-stone-800/60 text-stone-500 hover:text-amber-500/80 hover:bg-stone-900 transition-colors z-20 mt-1"
          >
            <DoorClosed className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default VaultAuth;
