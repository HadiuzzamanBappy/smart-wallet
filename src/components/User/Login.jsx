import { useState } from 'react';
import { registerUser, loginUser, loginWithGoogle } from '../../services/authService';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, ShieldCheck, Globe, Zap } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-[#050b1a] relative overflow-hidden p-4 sm:p-6">
      {/* Atmospheric Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10">

        {/* Left Panel: Financial Intelligence Terminal */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-white/[0.02] to-transparent relative overflow-hidden border-r border-white/10">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded bg-teal-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#050b1a] fill-current" />
              </div>
              <h1 className="text-xl font-black text-white uppercase tracking-[0.2em]">Smart Wallet</h1>
            </div>

            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              Your Financial <br />
              <span className="text-teal-400">Command Center</span>
            </h2>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Access high-density financial intelligence, track extra income, and monitor your lifestyle ceiling in real-time.
            </p>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> System Status
              </div>
              <div className="flex items-end justify-between">
                <div className="text-lg font-bold text-white">Secure Access</div>
                <div className="text-[10px] text-gray-500 font-mono">AES-256 ENCRYPTED</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Live Nodes</div>
                <div className="text-sm font-bold text-white">Global Cluster</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Latency</div>
                <div className="text-sm font-bold text-white">12ms</div>
              </div>
            </div>
          </div>

          {/* Decorative Grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>

        {/* Right Panel: Authentication Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center relative">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="absolute top-8 left-8 flex items-center space-x-2 text-gray-500 hover:text-teal-400 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Return</span>
            </button>
          )}

          <div className="mb-8 mt-4">
            <h2 className="text-2xl font-bold text-white mb-1">
              {isLogin ? 'Identity Access' : 'Initialize Account'}
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              {isLogin ? 'Confirm your credentials to enter the terminal' : 'Create a new node in the Smart Wallet platform'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                  Node Identity
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    name="displayName"
                    placeholder="Full name"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white/[0.05] transition-all"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                Access Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@smartwallet.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white/[0.05] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                Access Token
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white/[0.05] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#050b1a] text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#050b1a] border-t-transparent rounded-full animate-spin" />
              ) : (isLogin ? 'Authenticate Node' : 'Initialize Node')}
            </button>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Social Auth</div>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full mt-6 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-white/[0.07] transition-all flex items-center justify-center gap-3 group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google Identity Protocol
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-gray-500 hover:text-teal-400 uppercase tracking-widest transition-colors"
            >
              {isLogin ? "Switch to Registration Mode" : "Switch to Authentication Mode"}
            </button>
          </div>
        </div>
      </div>

      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '100px 100px' }} />
    </div>
  );
};

export default Login;