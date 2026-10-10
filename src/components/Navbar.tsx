import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguageMode } from '../context/LanguageModeContext';
import { Language, AppMode } from '../types';
import {
  BookOpen,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  Search,
  Layers,
  ChevronRight,
  Languages,
  GraduationCap,
  Microscope,
  Check,
  ChevronDown,
  Settings
} from 'lucide-react';

interface NavbarProps {
  notebookTitle?: string;
  notebookId?: string;
  onOpenSearch?: () => void;
  onNavigate: (route: string) => void;
}

const LANGUAGES: Array<{ code: Language; label: string; nativeLabel: string; flag: string }> = [
  { code: 'en', label: 'English',  nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'ta', label: 'Tamil',    nativeLabel: 'தமிழ்',   flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi',    nativeLabel: 'हिन्दी',   flag: '🇮🇳' },
];

export const Navbar: React.FC<NavbarProps> = ({
  notebookTitle,
  notebookId,
  onOpenSearch,
  onNavigate
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const { language, setLanguage, mode, setMode, t } = useLanguageMode();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const langMenuRef    = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current    && !langMenuRef.current.contains(e.target as Node))    setShowLangMenu(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">

        {/* ── Logo & Breadcrumb ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none shrink-0"
            aria-label="GenNote AI Home"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="hidden sm:flex items-baseline gap-0.5">
              <span className="font-extrabold text-[15px] tracking-tight text-neutral-900 dark:text-white">GenNote</span>
              <span className="font-extrabold text-[15px] text-emerald-500 dark:text-emerald-400">AI</span>
            </div>
          </button>

          {notebookTitle && (
            <div className="hidden md:flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 min-w-0">
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <button
                onClick={() => onNavigate('dashboard')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0 font-medium"
              >
                {t('myNotebooks')}
              </button>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold text-neutral-700 dark:text-neutral-200 truncate max-w-[220px]">
                {notebookTitle}
              </span>
            </div>
          )}
        </div>

        {/* ── Controls ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* Mode Toggle */}
          <div
            className="hidden xs:inline-flex p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 text-xs font-semibold"
            role="group"
            aria-label="Application Mode Toggle"
          >
            <button
              onClick={() => setMode('study')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 ${
                mode === 'study'
                  ? 'bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              title={t('studyModeDesc')}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('studyMode')}</span>
            </button>
            <button
              onClick={() => setMode('research')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 ${
                mode === 'research'
                  ? 'bg-white dark:bg-neutral-900 text-indigo-700 dark:text-indigo-400 shadow-sm font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              title={t('researchModeDesc')}
            >
              <Microscope className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('researchMode')}</span>
            </button>
          </div>

          {/* Language Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 transition-colors"
              aria-label="Select Language"
            >
              <span className="text-base leading-none">{currentLang.flag}</span>
              <span className="hidden sm:inline">{currentLang.nativeLabel}</span>
              <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl shadow-black/10 py-1.5 z-50 animate-scale-in">
                <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Select Language
                </div>
                {LANGUAGES.map(lang => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                      className={`w-full px-3 py-2.5 text-xs text-left flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{lang.flag}</span>
                        <div>
                          <div className="leading-tight">{lang.nativeLabel}</div>
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-normal">{lang.label}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search trigger */}
          {notebookId && onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-200/60 dark:border-neutral-700/60 group"
              title="Search notebook (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 group-hover:text-emerald-500 transition-colors" />
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Theme switcher */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {isDark
              ? <Sun  className="w-4 h-4 transition-transform hover:rotate-12 duration-200" />
              : <Moon className="w-4 h-4 transition-transform hover:-rotate-12 duration-200" />
            }
          </button>

          {/* User Profile */}
          {user ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="User profile menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-emerald-500/20 ring-2 ring-white dark:ring-neutral-900">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl shadow-black/10 py-1.5 z-50 animate-scale-in">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Mobile mode toggle */}
                  <div className="xs:hidden px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Mode</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setMode('study'); setShowProfileMenu(false); }}
                        className={`flex-1 flex items-center gap-1.5 justify-center py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === 'study' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" /> Study
                      </button>
                      <button
                        onClick={() => { setMode('research'); setShowProfileMenu(false); }}
                        className={`flex-1 flex items-center gap-1.5 justify-center py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === 'research' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}
                      >
                        <Microscope className="w-3.5 h-3.5" /> Research
                      </button>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { setShowProfileMenu(false); onNavigate('dashboard'); }}
                      className="w-full px-4 py-2 text-xs text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2.5 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-neutral-400" />
                      {t('myNotebooks')}
                    </button>
                  </div>
                  <div className="border-t border-neutral-100 dark:border-neutral-800 py-1">
                    <button
                      onClick={() => { setShowProfileMenu(false); logout(); onNavigate('landing'); }}
                      className="w-full px-4 py-2 text-xs text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {t('signOut')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {t('signIn')}
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] rounded-lg shadow-sm shadow-emerald-600/20 transition-all duration-200"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
