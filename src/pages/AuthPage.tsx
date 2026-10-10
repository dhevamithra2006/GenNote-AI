import React, { useState } from 'react';
import { BookOpen, Sparkles, ArrowRight, UserCheck, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onSuccess }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, register, demoLogin, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        await login(email.trim());
      } else {
        await register(name.trim(), email.trim());
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleDemo = async () => {
    try {
      await demoLogin();
      onSuccess();
    } catch (err: any) {
      setError('Could not start demo session');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#fafaf9] dark:bg-neutral-950">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-8 space-y-6">
        {/* Logo and title */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {isLogin ? 'Welcome Back to GenNote AI' : 'Create Your Study Account'}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isLogin ? 'Access your multimodal notebooks and knowledge bases.' : 'Start transforming notes into living study artifacts.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Demo button */}
        <button
          onClick={handleDemo}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Instant Trial: Continue as Demo Student</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
          <span className="bg-white dark:bg-neutral-900 px-3 text-[11px] text-neutral-400 uppercase tracking-wider absolute">
            Or with email
          </span>
        </div>

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer mt-2"
          >
            {isLoading ? 'Please wait...' : isLogin ? 'Sign In to Workspace' : 'Create Account'}
          </button>
        </form>

        {/* Switch mode */}
        <div className="text-center text-xs text-neutral-500">
          <span>{isLogin ? "Don't have an account yet?" : 'Already have an account?'}</span>{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline ml-1"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
