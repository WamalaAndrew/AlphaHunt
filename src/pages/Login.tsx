import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import { AlphaLogo } from '../components/AlphaLogo';
import { ArrowLeft, Mail, Lock, User, Globe, Phone, Briefcase, LogIn } from 'lucide-react';

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'seeker' | 'employer' | 'coach'>('seeker');

  const validateForm = () => {
    if (!email) return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Email address is invalid.';
    if (!showForgotPassword) {
      if (!password) return 'Password is required.';
      if (password.length < 6) return 'Password must be at least 6 characters.';
    }
    if (isSignUp && !showForgotPassword) {
      if (!fullName.trim()) return 'Full Name is required.';
      if (!nationality.trim()) return 'Nationality is required.';
      if (!phoneNumber.trim()) return 'Phone Number is required.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      if (showForgotPassword) {
        await resetPassword(email);
        setMessage('Password reset email sent! Check your inbox.');
        setShowForgotPassword(false);
      } else if (isSignUp) {
        await signUpWithEmail(email, password, {
          displayName: fullName,
          nationality,
          phoneNumber,
          role
        });
        setMessage('Account created! Please check your email to verify your account before continuing.');
        // Don't navigate immediately so they can see the message
      } else {
        await signInWithEmail(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle(isSignUp ? role : undefined);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#062016] flex flex-col font-sans selection:bg-[#bef264] selection:text-[#062016]">
      <header className="bg-[#062016]/80 backdrop-blur-xl border-b border-white/10 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-[#bef264] p-2 rounded-xl">
              <AlphaLogo className="w-5 h-5 text-[#062016]" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">AlphaHunt</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-[#bef264]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-[#bef264]/5 rounded-full blur-3xl"></div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-white/10 w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
              {showForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Welcome Back')}
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              {showForgotPassword 
                ? 'Enter your email to receive a reset link'
                : (isSignUp 
                  ? 'Join the professional network for East Africa' 
                  : 'Sign in to continue your career journey')}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 text-rose-400 p-3 rounded-xl text-sm mb-6 border border-rose-500/20 font-medium">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-[#bef264]/10 text-[#bef264] p-3 rounded-xl text-sm mb-6 border border-[#bef264]/20 font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !showForgotPassword && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#bef264] focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Nationality</label>
                    <div className="relative">
                      <Globe className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#bef264] focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                        placeholder="Ugandan"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Phone</label>
                    <div className="relative">
                      <Phone className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                        type="tel" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#bef264] focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                        placeholder="+256..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">I am a...</label>
                  <div className="relative">
                    <Briefcase className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <select 
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#bef264] focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="seeker" className="text-slate-900">Job Seeker</option>
                      <option value="employer" className="text-slate-900">Employer</option>
                      <option value="coach" className="text-slate-900">Career Coach</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#bef264] focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {!showForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  {!isSignUp && (
                    <button 
                      type="button" 
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-[#bef264] hover:text-white font-bold transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#bef264] focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#bef264] hover:bg-[#a3e635] text-[#062016] font-extrabold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-[#bef264]/10 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#062016] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {!showForgotPassword && <LogIn className="w-5 h-5" />}
                  {showForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Create Account' : 'Sign In')}
                </>
              )}
            </button>
          </form>

          {showForgotPassword ? (
            <div className="mt-6 text-center">
              <button 
                onClick={() => setShowForgotPassword(false)}
                className="text-sm text-[#bef264] hover:text-white font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="mt-8 flex items-center justify-center gap-4">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-xs text-slate-500 font-bold tracking-widest">OR</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              {isSignUp && (
                <div className="mt-6 mb-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Sign up as a...</label>
                  <div className="flex justify-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="googleRole" value="seeker" checked={role === 'seeker'} onChange={() => setRole('seeker')} className="text-[#bef264] focus:ring-[#bef264] bg-transparent border-white/20" />
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Seeker</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="googleRole" value="employer" checked={role === 'employer'} onChange={() => setRole('employer')} className="text-[#bef264] focus:ring-[#bef264] bg-transparent border-white/20" />
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Employer</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="googleRole" value="coach" checked={role === 'coach'} onChange={() => setRole('coach')} className="text-[#bef264] focus:ring-[#bef264] bg-transparent border-white/20" />
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Coach</span>
                    </label>
                  </div>
                </div>
              )}

              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-6 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="mt-10 text-center">
                <p className="text-sm text-slate-400 font-medium">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="ml-2 text-[#bef264] hover:text-white font-bold transition-colors"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
