import { useState } from 'react';
import { registerUser, loginUser, loginWithGoogle } from '../../services/authService';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';

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
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
      // Page will redirect away for Google sign-in
    } catch (err) {
      console.error('Google login failed:', err);
      setError('Google login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071129] via-[#07193a] to-[#021425] p-6" style={{ paddingTop: 'env(safe-area-inset-top, 16px)', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: Illustration / Brand */}
        <div className="hidden md:flex flex-col justify-center items-start p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/3 backdrop-blur-sm border border-white/5 shadow-lg">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white">Smart Wallet</h1>
            <p className="text-sm text-gray-300 mt-2">Track expenses, manage budgets, and stay on top of your money.</p>
          </div>
          <div className="w-full mt-6 grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 opacity-95 shadow-md p-4 text-white">
              <div className="flex items-center gap-3">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <rect x="1" y="5" width="22" height="14" rx="2" fill="rgba(255,255,255,0.12)" />
                  <path d="M3 9h18M7 16h6" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <div className="font-semibold">Monthly Overview</div>
                  <div className="text-xs text-white/80 mt-1">BAL: $4,790 • Inv: $2.1k</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white/6 p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-white">💸</div>
              <div>
                <div className="text-sm text-white font-medium">Expenses</div>
                <div className="text-xs text-white/75">This week</div>
              </div>
            </div>

            <div className="rounded-lg bg-white/6 p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-white">💰</div>
              <div>
                <div className="text-sm text-white font-medium">Income</div>
                <div className="text-xs text-white/75">This month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/6 rounded-2xl p-6 md:p-10 shadow-xl">
          {/* Back button */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </button>
          )}
          
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-1">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-sm text-gray-300">{isLogin ? 'Sign in to continue to your wallet' : 'Create your account to start tracking'}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-600/10 border border-red-600/20 text-red-300 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <label className="block">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-300" />
                  <input
                    type="text"
                    name="displayName"
                    placeholder="Full name"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/6 border border-white/8 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    required={!isLogin}
                  />
                </div>
              </label>
            )}

            <label className="block">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-300" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/6 border border-white/8 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  required
                />
              </div>
            </label>

            <label className="block">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-3 rounded-lg bg-white/6 border border-white/8 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-6 w-6 text-gray-200 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 text-gray-900 font-semibold shadow-lg hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <div className="flex-1 h-px bg-white/8" />
              <div>Or continue with</div>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-white text-gray-900 font-medium hover:shadow-md flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-300 hover:text-white"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;